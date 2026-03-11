import { TwitterMention, VelocityResult } from './types';
import { createLogger } from '../config/logger';

const logger = createLogger('NarrativeScorer');

// Known high-performing narrative patterns based on historical data
const NARRATIVE_PATTERNS = {
  meme: ['meme', 'viral', 'funny', 'lol', 'lmao', 'based', 'gigachad'],
  community: ['community', 'holders', 'fam', 'together', 'we', 'us'],
  political: ['president', 'whitehouse', 'government', 'politician', 'vote'],
  influencer: ['@', 'ct', 'alpha', 'thread', 'gem', 'early'],
  project: ['roadmap', 'utility', 'launch', 'partnership', 'team'],
};

const NARRATIVE_FIT_SCORES: Record<string, number> = {
  meme: 8,
  community: 9,
  influencer: 7,
  viral: 10,
  political: 6,
  project: 5,
};

export function calculateNarrativeVelocity(
  mentions: TwitterMention[]
): VelocityResult {
  const now = Date.now();
  const window1h = mentions.filter(m => now - m.timestamp < 3_600_000);
  const window6h = mentions.filter(m => now - m.timestamp < 21_600_000);

  if (window6h.length === 0) {
    return { velocityMultiplier: 0, recentMentions: 0, organicScore: 0, score: 0 };
  }

  const recentRate = window1h.length;
  const baseRate = window6h.length / 6;

  const velocityMultiplier = baseRate > 0
    ? recentRate / baseRate
    : recentRate > 0 ? 10 : 0;

  // Organic scoring: unique accounts / total mentions in last hour
  const uniqueAccounts = new Set(window1h.map(m => m.authorId)).size;
  const organicScore = uniqueAccounts / Math.max(window1h.length, 1);

  // Engagement weight
  const engagementScore = window1h.reduce((sum, m) => {
    return sum + m.likeCount * 1 + m.retweetCount * 3 + m.replyCount * 2;
  }, 0) / Math.max(window1h.length, 1);

  const normalizedEngagement = Math.min(1, engagementScore / 100);

  const rawScore = velocityMultiplier * organicScore * 15 + normalizedEngagement * 5;

  return {
    velocityMultiplier,
    recentMentions: recentRate,
    organicScore,
    score: Math.min(35, rawScore),
  };
}

export function classifyNarrative(mentions: TwitterMention[]): {
  type: string;
  confidence: number;
  narrative: string;
} {
  const allText = mentions.map(m => m.text.toLowerCase()).join(' ');

  const scores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(NARRATIVE_PATTERNS)) {
    scores[category] = keywords.filter(k => allText.includes(k)).length;
  }

  const topCategory = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];

  if (!topCategory || topCategory[1] === 0) {
    return { type: 'unknown', confidence: 0, narrative: 'No clear narrative detected' };
  }

  const [type, matchCount] = topCategory;
  const confidence = Math.min(1, matchCount / 3);

  const narrativeDescription = buildNarrativeDescription(type, mentions);

  return { type, confidence, narrative: narrativeDescription };
}

export function calculateNarrativeFitScore(narrativeType: string): number {
  return NARRATIVE_FIT_SCORES[narrativeType] ?? 5;
}

function buildNarrativeDescription(
  type: string,
  mentions: TwitterMention[]
): string {
  const recentMentions = mentions.slice(0, 5);
  const influencerMentions = mentions
    .filter(m => m.likeCount > 100)
    .sort((a, b) => b.likeCount - a.likeCount);

  if (influencerMentions.length > 0) {
    return `${type} narrative with influencer traction — ${influencerMentions[0].likeCount} likes on top post`;
  }

  return `${type} narrative forming — ${mentions.length} mentions in last 6h`;
}

export function detectBotActivity(mentions: TwitterMention[]): number {
  if (mentions.length === 0) return 0;

  // Signals of bot activity:
  // 1. Many mentions with 0 engagement
  const zeroEngagement = mentions.filter(
    m => m.likeCount === 0 && m.retweetCount === 0 && m.replyCount === 0
  ).length;
  const zeroEngagementRatio = zeroEngagement / mentions.length;

  // 2. Low unique author ratio
  const uniqueAuthors = new Set(mentions.map(m => m.authorId)).size;
  const uniqueRatio = uniqueAuthors / mentions.length;

  // 3. Identical or near-identical posts (simplified check)
  const texts = mentions.map(m => m.text.slice(0, 50));
  const uniqueTexts = new Set(texts).size;
  const textDiversity = uniqueTexts / mentions.length;

  // Bot score: higher = more bot activity (0–1)
  const botScore =
    zeroEngagementRatio * 0.4 +
    (1 - uniqueRatio) * 0.4 +
    (1 - textDiversity) * 0.2;

  return botScore;
}
