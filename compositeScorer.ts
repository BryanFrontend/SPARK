import { SparkConfig } from '../config/config';
import { createLogger } from '../config/logger';
import { TokenCandidate } from './momentumScanner';
import { AgentSignal, SignalBreakdown } from '../agent/types';
import { TwitterMonitor } from '../twitter/twitterMonitor';
import {
  calculateNarrativeVelocity,
  classifyNarrative,
  calculateNarrativeFitScore,
  detectBotActivity,
} from './narrativeScorer';
import { analyzeOnChainMomentum } from './onChainAnalyzer';

const logger = createLogger('CompositeScorer');

export class CompositeScorer {
  private config: SparkConfig;
  private twitterMonitor: TwitterMonitor;

  constructor(config: SparkConfig) {
    this.config = config;
    this.twitterMonitor = new TwitterMonitor(config.twitter);
  }

  async score(candidate: TokenCandidate): Promise<AgentSignal> {
    logger.debug(`Scoring ${candidate.tokenSymbol}...`);

    // Fetch Twitter mentions
    const mentions = await this.twitterMonitor.getMentions(
      candidate.tokenSymbol
    );

    // Calculate velocity
    const velocity = calculateNarrativeVelocity(mentions);

    // Classify narrative
    const { type: narrativeType, narrative } = classifyNarrative(mentions);

    // Detect bot activity (0 = all organic, 1 = all bots)
    const botScore = detectBotActivity(mentions);
    const organicMultiplier = 1 - botScore;

    // On-chain analysis
    const onChain = await analyzeOnChainMomentum(
      candidate.tokenMint,
      this.config.solana.rpcUrl
    );

    // Volume spike score (0–20)
    const volSpikeRatio = candidate.volume1h / Math.max(candidate.volume24h / 24, 1);
    const volumeSpikeScore = Math.min(20, volSpikeRatio * 4);

    // Holder growth score (0–25)
    const holderGrowthScore = Math.min(25, onChain.holderGrowthRatePerHour * 2);

    // Twitter velocity score (0–35)
    const twitterVelocityScore = Math.min(35, velocity.score * organicMultiplier);

    // Organic score (0–10)
    const organicScore = Math.min(10, velocity.organicScore * 10 * organicMultiplier);

    // Narrative fit (0–10)
    const narrativeFitScore = calculateNarrativeFitScore(narrativeType);

    const breakdown: SignalBreakdown = {
      twitterVelocity: Math.round(twitterVelocityScore),
      holderGrowth: Math.round(holderGrowthScore),
      volumeSpike: Math.round(volumeSpikeScore),
      organicScore: Math.round(organicScore),
      narrativeFit: Math.round(narrativeFitScore),
    };

    const totalScore =
      breakdown.twitterVelocity +
      breakdown.holderGrowth +
      breakdown.volumeSpike +
      breakdown.organicScore +
      breakdown.narrativeFit;

    logger.debug(
      `${candidate.tokenSymbol}: ${totalScore}/100 ` +
      `(tw:${breakdown.twitterVelocity} hg:${breakdown.holderGrowth} ` +
      `vs:${breakdown.volumeSpike} org:${breakdown.organicScore} nf:${breakdown.narrativeFit})`
    );

    return {
      tokenMint: candidate.tokenMint,
      tokenSymbol: candidate.tokenSymbol,
      score: Math.min(100, totalScore),
      signals: breakdown,
      narrative,
      marketCapUsd: candidate.marketCapUsd,
      holderCount: onChain.holderCount,
      timestamp: new Date(),
    };
  }
}
