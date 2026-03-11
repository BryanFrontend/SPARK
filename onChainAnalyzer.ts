import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';
import { OnChainSignal } from './types';
import { createLogger } from '../config/logger';

const logger = createLogger('OnChainAnalyzer');

interface HolderData {
  total: number;
  top10Pct: number;
  gini: number; // distribution concentration
}

interface VolumeData {
  current: number;
  avg24h: number;
  avg7d: number;
}

export async function analyzeOnChainMomentum(
  tokenMint: string,
  rpcUrl: string
): Promise<OnChainSignal> {
  logger.debug(`Analyzing on-chain momentum for ${tokenMint}`);

  const [volumeData, holderData] = await Promise.allSettled([
    fetchVolumeData(tokenMint),
    fetchHolderData(tokenMint),
  ]);

  const volume: VolumeData = volumeData.status === 'fulfilled'
    ? volumeData.value
    : { current: 0, avg24h: 1, avg7d: 1 };

  const holders: HolderData = holderData.status === 'fulfilled'
    ? holderData.value
    : { total: 0, top10Pct: 0, gini: 0 };

  const volumeSpikeRatio = volume.current / Math.max(volume.avg24h, 1);
  const holderGrowthRatePerHour = await estimateHolderGrowthRate(tokenMint, holders.total);

  const score = computeOnChainScore({
    volumeSpikeRatio,
    holderGrowthRatePerHour,
    liquidityUsd: 0, // would come from DexScreener
    holderConcentration: holders.top10Pct,
  });

  return {
    holderCount: holders.total,
    holderGrowthRatePerHour,
    volumeSpikeRatio,
    liquidityUsd: 0,
    score,
  };
}

async function fetchVolumeData(tokenMint: string): Promise<VolumeData> {
  // Fetch from DexScreener API
  const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`;
  const response = await axios.get(url, { timeout: 8_000 });

  const pairs = response.data?.pairs ?? [];
  if (pairs.length === 0) {
    return { current: 0, avg24h: 0, avg7d: 0 };
  }

  // Use the highest liquidity pair
  const mainPair = pairs.sort(
    (a: { liquidity?: { usd: number } }, b: { liquidity?: { usd: number } }) =>
      (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
  )[0];

  const vol1h = mainPair.volume?.h1 ?? 0;
  const vol24h = mainPair.volume?.h24 ?? 0;

  return {
    current: vol1h,
    avg24h: vol24h / 24,
    avg7d: vol24h / 24, // approximation without 7d data
  };
}

async function fetchHolderData(tokenMint: string): Promise<HolderData> {
  // In production, use Helius or Birdeye for holder data
  // This is a simplified implementation
  try {
    const url = `https://public-api.birdeye.so/public/tokenlist?address=${tokenMint}`;
    const response = await axios.get(url, {
      timeout: 8_000,
      headers: { 'X-API-KEY': process.env.BIRDEYE_API_KEY ?? '' },
    });

    const data = response.data?.data;
    if (!data) return { total: 0, top10Pct: 0.5, gini: 0.5 };

    return {
      total: data.holder ?? 0,
      top10Pct: 0.4, // would calculate from distribution data
      gini: 0.5,
    };
  } catch {
    return { total: 0, top10Pct: 0.5, gini: 0.5 };
  }
}

async function estimateHolderGrowthRate(
  tokenMint: string,
  currentHolders: number
): Promise<number> {
  // In production, compare against historical snapshots stored in DB
  // Here we simulate with a heuristic
  const baselineGrowth = currentHolders * 0.001; // 0.1% per hour baseline
  return baselineGrowth;
}

function computeOnChainScore(params: {
  volumeSpikeRatio: number;
  holderGrowthRatePerHour: number;
  liquidityUsd: number;
  holderConcentration: number;
}): number {
  let score = 0;

  // Volume spike contribution (0–20 points)
  const volScore = Math.min(20, params.volumeSpikeRatio * 5);
  score += volScore;

  // Holder growth contribution (0–25 points)
  const growthMultiplier = Math.min(5, params.holderGrowthRatePerHour / 10);
  const holderScore = Math.min(25, growthMultiplier * 5);
  score += holderScore;

  // Penalize high concentration (whales = exit risk)
  if (params.holderConcentration > 0.8) {
    score *= 0.7;
  }

  return Math.min(45, score);
}

export async function getTokenHolderCount(
  tokenMint: string
): Promise<number> {
  try {
    const holders = await fetchHolderData(tokenMint);
    return holders.total;
  } catch {
    return 0;
  }
}
