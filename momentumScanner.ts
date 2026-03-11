import axios from 'axios';
import { SparkConfig } from '../config/config';
import { createLogger } from '../config/logger';
import { TokenCandidate } from './types';

const logger = createLogger('MomentumScanner');

interface DexScreenerPair {
  chainId: string;
  baseToken: {
    address: string;
    symbol: string;
    name: string;
  };
  fdv?: number;
  volume: { h24: number; h6: number; h1: number };
  txns: {
    h24: { buys: number; sells: number };
    h1: { buys: number; sells: number };
  };
  priceUsd?: string;
  liquidity?: { usd: number };
}

export class MomentumScanner {
  private config: SparkConfig;
  private seenTokens = new Set<string>();

  constructor(config: SparkConfig) {
    this.config = config;
  }

  async getCandidates(): Promise<TokenCandidate[]> {
    logger.debug('Fetching candidates from DexScreener...');

    const candidates: TokenCandidate[] = [];

    try {
      // Fetch trending Solana tokens
      const trending = await this.fetchTrendingSolanaTokens();
      candidates.push(...trending);

      // Deduplicate
      const seen = new Set<string>();
      const unique = candidates.filter(c => {
        if (seen.has(c.tokenMint)) return false;
        seen.add(c.tokenMint);
        return true;
      });

      // Apply initial filters
      const filtered = unique.filter(c => this.passesInitialFilter(c));

      logger.debug(`Found ${filtered.length} candidates after initial filter`);
      return filtered;
    } catch (err) {
      logger.error('Failed to fetch candidates:', err);
      return [];
    }
  }

  private async fetchTrendingSolanaTokens(): Promise<TokenCandidate[]> {
    const url = `${this.config.dexscreener.apiUrl}/tokens/solana`;

    const response = await axios.get<{ pairs: DexScreenerPair[] }>(url, {
      timeout: 10_000,
      params: { sort: 'trendingScore', order: 'desc', limit: 100 },
    });

    const pairs = response.data?.pairs ?? [];

    return pairs
      .filter(p => p.chainId === 'solana' && p.fdv && p.liquidity)
      .map(p => ({
        tokenMint: p.baseToken.address,
        tokenSymbol: p.baseToken.symbol,
        tokenName: p.baseToken.name,
        marketCapUsd: p.fdv ?? 0,
        volume24h: p.volume.h24,
        volume1h: p.volume.h1,
        buys1h: p.txns.h1.buys,
        sells1h: p.txns.h1.sells,
        liquidityUsd: p.liquidity?.usd ?? 0,
        priceUsd: parseFloat(p.priceUsd ?? '0'),
      }));
  }

  private passesInitialFilter(candidate: TokenCandidate): boolean {
    // Market cap range: $50K to $20M
    if (candidate.marketCapUsd < 50_000) return false;
    if (candidate.marketCapUsd > 20_000_000) return false;

    // Minimum liquidity: $10K
    if (candidate.liquidityUsd < 10_000) return false;

    // Must have some recent volume
    if (candidate.volume1h < 1_000) return false;

    return true;
  }

  async pingDexscreener(): Promise<boolean> {
    try {
      await axios.get(`${this.config.dexscreener.apiUrl}/tokens/solana`, {
        timeout: 5_000,
      });
      return true;
    } catch {
      return false;
    }
  }
}

// Re-export TokenCandidate type
export type { TokenCandidate };
