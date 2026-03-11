import axios from 'axios';
import { VersionedTransaction } from '@solana/web3.js';
import { SparkWallet } from '../wallet/walletManager';
import { SparkConfig } from '../config/config';
import { createLogger } from '../config/logger';
import { BuyParams, SwapParams, SwapResult } from './types';
import { ExecutedTrade } from '../agent/types';

const logger = createLogger('JupiterExecutor');

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  priceImpactPct: string;
  routePlan: unknown[];
}

interface JupiterSwapResponse {
  swapTransaction: string;
}

export class JupiterExecutor {
  private wallet: SparkWallet;
  private config: SparkConfig;

  constructor(wallet: SparkWallet, config: SparkConfig) {
    this.wallet = wallet;
    this.config = config;
  }

  async executeBuy(params: BuyParams): Promise<ExecutedTrade> {
    logger.info(`Executing BUY: $${params.amountUsd} → ${params.tokenSymbol}`);

    // Convert USD to USDC lamports (USDC has 6 decimals)
    const amountLamports = Math.floor(params.amountUsd * 1_000_000);

    const result = await this.executeSwap({
      inputMint: USDC_MINT,
      outputMint: params.tokenMint,
      amountLamports,
      slippageBps: 300, // 3% slippage
    });

    const tradeId = `spark-${Date.now()}`;

    logger.info(`✅ BUY executed: ${result.txid}`);

    return {
      tradeId,
      action: 'BUY',
      tokenMint: params.tokenMint,
      tokenSymbol: params.tokenSymbol,
      inputToken: 'USDC',
      inputAmount: params.amountUsd,
      outputToken: params.tokenSymbol,
      outputAmount: parseInt(result.outputAmount),
      priceImpactPct: result.priceImpactPct,
      txid: result.txid,
      solscanUrl: `https://solscan.io/tx/${result.txid}`,
      momentumScore: params.signal.score,
      signals: params.signal.signals,
      reasoning: params.reasoning,
      stopLoss: this.config.risk.stopLossPct,
      status: 'OPEN',
      executedAt: result.executedAt,
    };
  }

  async executeSell(
    tokenMint: string,
    tokenSymbol: string,
    tokenAmount: number,
    tokenDecimals: number
  ): Promise<SwapResult> {
    logger.info(`Executing SELL: ${tokenAmount} ${tokenSymbol} → USDC`);

    const amountLamports = Math.floor(tokenAmount * Math.pow(10, tokenDecimals));

    return this.executeSwap({
      inputMint: tokenMint,
      outputMint: USDC_MINT,
      amountLamports,
      slippageBps: 500, // 5% slippage for sells (more forgiving)
    });
  }

  private async executeSwap(params: SwapParams): Promise<SwapResult> {
    // 1. Get quote from Jupiter
    const quote = await this.getQuote(params);

    // 2. Get swap transaction
    const swapTx = await this.getSwapTransaction(quote);

    // 3. Deserialize, sign, and send
    const txBuffer = Buffer.from(swapTx.swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(txBuffer);
    transaction.sign([this.wallet.getKeypair()]);

    const txid = await this.wallet.sendVersionedTransaction(transaction);

    // 4. Confirm
    await this.wallet.confirmTransaction(txid);

    return {
      txid,
      inputAmount: quote.inAmount,
      outputAmount: quote.outAmount,
      priceImpactPct: parseFloat(quote.priceImpactPct),
      executedAt: new Date(),
    };
  }

  private async getQuote(params: SwapParams): Promise<JupiterQuote> {
    const url = `${JUPITER_QUOTE_API}/quote`;

    const response = await axios.get<JupiterQuote>(url, {
      params: {
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amount: params.amountLamports,
        slippageBps: params.slippageBps ?? 300,
        onlyDirectRoutes: false,
        asLegacyTransaction: false,
      },
      timeout: 10_000,
    });

    logger.debug(
      `Quote: ${response.data.inAmount} → ${response.data.outAmount} ` +
      `(impact: ${response.data.priceImpactPct}%)`
    );

    return response.data;
  }

  private async getSwapTransaction(
    quote: JupiterQuote
  ): Promise<JupiterSwapResponse> {
    const url = `${JUPITER_QUOTE_API}/swap`;

    const response = await axios.post<JupiterSwapResponse>(
      url,
      {
        quoteResponse: quote,
        userPublicKey: this.wallet.publicKey.toString(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      },
      { timeout: 15_000 }
    );

    return response.data;
  }
}
