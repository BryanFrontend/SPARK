import { TwitterApi, TweetV2 } from 'twitter-api-v2';
import { createLogger } from '../config/logger';
import { TwitterMention } from '../momentum/types';
import { TwitterConfig } from '../config/config';

const logger = createLogger('TwitterMonitor');

export class TwitterMonitor {
  private client: TwitterApi;
  private mentionCache = new Map<string, { data: TwitterMention[]; fetchedAt: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1_000; // 5 minutes

  constructor(config: TwitterConfig) {
    this.client = new TwitterApi({
      appKey: config.apiKey,
      appSecret: config.apiSecret,
      accessToken: config.accessToken,
      accessSecret: config.accessTokenSecret,
    });
  }

  async getMentions(tokenSymbol: string): Promise<TwitterMention[]> {
    const cacheKey = tokenSymbol.toLowerCase();
    const cached = this.mentionCache.get(cacheKey);

    if (cached && Date.now() - cached.fetchedAt < this.CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const query = `$${tokenSymbol} OR #${tokenSymbol} lang:en -is:retweet`;
      const mentions = await this.searchRecentTweets(query, 100);

      this.mentionCache.set(cacheKey, {
        data: mentions,
        fetchedAt: Date.now(),
      });

      logger.debug(`Fetched ${mentions.length} mentions for ${tokenSymbol}`);
      return mentions;
    } catch (err) {
      logger.error(`Failed to fetch mentions for ${tokenSymbol}:`, err);
      return [];
    }
  }

  private async searchRecentTweets(
    query: string,
    maxResults = 100
  ): Promise<TwitterMention[]> {
    const response = await this.client.v2.search(query, {
      max_results: Math.min(maxResults, 100),
      'tweet.fields': [
        'created_at',
        'author_id',
        'public_metrics',
        'referenced_tweets',
      ],
    });

    const tweets: TweetV2[] = response.data.data ?? [];

    return tweets.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      authorId: tweet.author_id ?? '',
      timestamp: tweet.created_at
        ? new Date(tweet.created_at).getTime()
        : Date.now(),
      likeCount: tweet.public_metrics?.like_count ?? 0,
      retweetCount: tweet.public_metrics?.retweet_count ?? 0,
      replyCount: tweet.public_metrics?.reply_count ?? 0,
      isRetweet: !!tweet.referenced_tweets?.some(r => r.type === 'retweeted'),
    }));
  }

  async streamMentions(
    keywords: string[],
    onMention: (mention: TwitterMention) => void
  ): Promise<() => void> {
    // Set up filtered stream rules
    const rules = keywords.map(k => ({
      value: `$${k} lang:en`,
      tag: k,
    }));

    try {
      await this.client.v2.updateStreamRules({ add: rules });

      const stream = await this.client.v2.searchStream({
        'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
      });

      stream.on('data', (tweet: TweetV2) => {
        const mention: TwitterMention = {
          id: tweet.id,
          text: tweet.text,
          authorId: tweet.author_id ?? '',
          timestamp: Date.now(),
          likeCount: tweet.public_metrics?.like_count ?? 0,
          retweetCount: tweet.public_metrics?.retweet_count ?? 0,
          replyCount: tweet.public_metrics?.reply_count ?? 0,
          isRetweet: false,
        };
        onMention(mention);
      });

      return () => {
        stream.destroy();
        logger.info('Twitter stream stopped');
      };
    } catch (err) {
      logger.error('Failed to start Twitter stream:', err);
      return () => {};
    }
  }
}
