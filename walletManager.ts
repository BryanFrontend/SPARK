import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
  TransactionSignature,
} from '@solana/web3.js';
import * as bs58 from 'bs58';
import { createLogger } from '../config/logger';

const logger = createLogger('WalletManager');

export interface WalletConfig {
  privateKey: string;
  rpcUrl: string;
}

export class SparkWallet {
  private keypair: Keypair;
  private connection: Connection;

  constructor(config: WalletConfig) {
    const secretKey = bs58.decode(config.privateKey);
    this.keypair = Keypair.fromSecretKey(secretKey);
    this.connection = new Connection(config.rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60_000,
    });

    logger.info(`Wallet loaded: ${this.keypair.publicKey.toString()}`);
  }

  get publicKey(): PublicKey {
    return this.keypair.publicKey;
  }

  getKeypair(): Keypair {
    return this.keypair;
  }

  async getSOLBalance(): Promise<number> {
    const balance = await this.connection.getBalance(this.keypair.publicKey);
    return balance / 1e9; // Convert lamports to SOL
  }

  async sendVersionedTransaction(
    transaction: VersionedTransaction
  ): Promise<string> {
    const rawTx = transaction.serialize();
    const txid = await this.connection.sendRawTransaction(rawTx, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3,
    });
    return txid;
  }

  async confirmTransaction(
    txid: TransactionSignature,
    timeoutMs = 60_000
  ): Promise<void> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const status = await this.connection.getSignatureStatus(txid);

      if (status.value?.confirmationStatus === 'confirmed' ||
          status.value?.confirmationStatus === 'finalized') {
        return;
      }

      if (status.value?.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
      }

      await new Promise(r => setTimeout(r, 2_000));
    }

    throw new Error(`Transaction not confirmed after ${timeoutMs}ms: ${txid}`);
  }

  async ping(): Promise<boolean> {
    try {
      await this.getSOLBalance();
      return true;
    } catch {
      return false;
    }
  }

  async pingRpc(): Promise<boolean> {
    try {
      await this.connection.getSlot();
      return true;
    } catch {
      return false;
    }
  }

  getConnection(): Connection {
    return this.connection;
  }
}
