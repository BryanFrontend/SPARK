import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import axios from 'axios';
import { SparkWallet } from './walletManager';
import { PortfolioSnapshot, TokenPosition } from './types';
import { createLogger } from '../config/logger';

const logger = createLogger('PortfolioTracker');

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const SOL_USD_FALLBACK = 150;

export class PortfolioTracker {
  private wallet: SparkWallet;
  private cachedSnapshot: PortfolioSnapshot | null = null;
  private lastFetch = 0;
  private readonly CACHE_TTL_MS = 30_000;

  constructor(wallet: SparkWallet) {
    this.wallet = wallet;
  }

  async getSnapshot(): Promise<PortfolioSnapshot> {
    const now = Date.now();
    if (this.cachedSnapshot && now - this.lastFetch < this.CACHE_TTL_MS) {
      return this.cachedSnapshot;
    }

    const [solBalance, tokenAccounts] = await Promise.all([
      this.wallet.getSOLBalance(),
      this.getTokenAccounts(),
    ]);

    const solPriceUsd = await this.getSolPrice();
    const solValueUsd = solBalance * solPriceUsd;

    const usdcPosition = tokenAccounts.find(t => t.mint === USDC_MINT);
    const usdcBalance = usdcPosition?.valueUsd ?? 0;

    const otherTokens = tokenAccounts.filter(t => t.mint !== USDC_MINT);

    const totalUsd = solValueUsd + usdcBalance +
      otherTokens.reduce((s, t) => s + t.valueUsd, 0);

    const snapshot: PortfolioSnapshot = {
      walletAddress: this.wallet.publicKey.toString(),
      solBalance,
      usdcBalance,
      tokenPositions: otherTokens,
      totalUsd,
      snapshotAt: new Date(),
    };

    this.cachedSnapshot = snapshot;
    this.lastFetch = now;

    logger.debug(`Portfolio: $${totalUsd.toFixed(2)} total`);
    return snapshot;
  }

  private async getTokenAccounts(): Promise<TokenPosition[]> {
    const connection = this.wallet.getConnection();

    const accounts = await connection.getParsedTokenAccountsByOwner(
      this.wallet.publicKey,
      { programId: TOKEN_PROGRAM_ID }
    );

    const positions: TokenPosition[] = [];

    for (const { account } of accounts.value) {
      const parsed = account.data.parsed?.info;
      if (!parsed) continue;

      const mint = parsed.mint as string;
      const amount = parsed.tokenAmount.uiAmount as number;
      const decimals = parsed.tokenAmount.decimals as number;

      if (amount === 0) continue;

      const priceUsd = await this.getTokenPrice(mint).catch(() => 0);

      positions.push({
        mint,
        symbol: 'UNKNOWN',
        amount,
        decimals,
        priceUsd,
        valueUsd: amount * priceUsd,
      });
    }

    return positions;
  }

  private async getTokenPrice(mint: string): Promise<number> {
    if (mint === USDC_MINT) return 1.0;

    try {
      const url = `https://api.dexscreener.com/latest/dex/tokens/${mint}`;
      const res = await axios.get(url, { timeout: 5_000 });
      const pairs = res.data?.pairs ?? [];
      if (pairs.length === 0) return 0;

      const main = pairs.sort(
        (a: { liquidity?: { usd: number } }, b: { liquidity?: { usd: number } }) =>
          (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
      )[0];

      return parseFloat(main.priceUsd ?? '0');
    } catch {
      return 0;
    }
  }

  private async getSolPrice(): Promise<number> {
    try {
      const res = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
        { timeout: 5_000 }
      );
      return res.data?.solana?.usd ?? SOL_USD_FALLBACK;
    } catch {
      return SOL_USD_FALLBACK;
    }
  }
}
