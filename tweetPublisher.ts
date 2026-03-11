import { TwitterApi } from 'twitter-api-v2';
import { createLogger } from '../config/logger';
import { ExecutedTrade } from '../agent/types';
import { TwitterConfig } from '../config/config';

const logger = createLogger('TweetPublisher');

export class TweetPublisher {
  private client: TwitterApi;

  constructor(config: TwitterConfig) {
    this.client = new TwitterApi({
      appKey: config.apiKey,
      appSecret: config.apiSecret,
      accessToken: config.accessToken,
      accessSecret: config.accessTokenSecret,
    });
  }

  async publishTrade(trade: ExecutedTrade): Promise<void> {
    const tweet = this.buildTradeTweet(trade);

    try {
      const response = await this.client.v2.tweet(tweet);
      logger.info(`🐦 Trade tweet posted: ${response.data.id}`);
    } catch (err) {
      logger.error('Failed to post trade tweet:', err);
    }
  }

  async publishDecision(
    action: 'SKIP' | 'WATCH',
    tokenSymbol: string,
    reason: string
  ): Promise<void> {
    const emoji = action === 'SKIP' ? '⏭️' : '👀';
    const verb = action === 'SKIP' ? 'Skipping' : 'Watching';

    const tweet =
      `⚡ Spark | ${emoji} ${verb} $${tokenSymbol}\n\n` +
      `${reason.slice(0, 200)}\n\n` +
      `Every decision logged publicly. #Solana #OpenClaw`;

    try {
      await this.client.v2.tweet(tweet);
    } catch (err) {
      logger.error('Failed to post decision tweet:', err);
    }
  }

  async publishPortfolioUpdate(params: {
    totalUsd: number;
    pnlUsd: number;
    pnlPct: number;
    openPositions: number;
  }): Promise<void> {
    const pnlEmoji = params.pnlUsd >= 0 ? '🟢' : '🔴';
    const pnlSign = params.pnlUsd >= 0 ? '+' : '';

    const tweet =
      `⚡ Spark | 📊 Portfolio Update\n\n` +
      `Total: $${params.totalUsd.toFixed(2)}\n` +
      `P&L: ${pnlEmoji} ${pnlSign}$${params.pnlUsd.toFixed(2)} (${pnlSign}${(params.pnlPct * 100).toFixed(1)}%)\n` +
      `Open positions: ${params.openPositions}\n\n` +
      `Full trade log on GitHub. #Solana #OpenClaw`;

    try {
      await this.client.v2.tweet(tweet);
    } catch (err) {
      logger.error('Failed to post portfolio tweet:', err);
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.v2.me();
      return true;
    } catch {
      return false;
    }
  }

  private buildTradeTweet(trade: ExecutedTrade): string {
    if (trade.action === 'BUY') {
      return (
        `⚡ Spark | ✅ BUY $${trade.tokenSymbol}\n\n` +
        `💰 Size: $${trade.inputAmount.toFixed(0)} USDC\n` +
        `📊 Score: ${trade.momentumScore}/100\n` +
        `🎯 Reasoning: ${trade.reasoning.slice(0, 150)}\n\n` +
        `🔗 TX: ${trade.solscanUrl}\n\n` +
        `#Solana #OpenClaw #SparkAgent`
      );
    } else {
      return (
        `⚡ Spark | 💸 SELL $${trade.tokenSymbol}\n\n` +
        `📊 Score: ${trade.momentumScore}/100\n` +
        `🎯 Reasoning: ${trade.reasoning.slice(0, 150)}\n\n` +
        `🔗 TX: ${trade.solscanUrl}\n\n` +
        `#Solana #OpenClaw #SparkAgent`
      );
    }
  }
}
