import OpenAI from 'openai';
import { SparkConfig } from '../config/config';
import { createLogger } from '../config/logger';
import { AgentDecision, AgentSignal, ExecutedTrade } from './types';
import { PortfolioSnapshot } from '../wallet/types';
import { OpenPosition } from '../trading/types';

const logger = createLogger('DecisionEngine');

const SPARK_SYSTEM_PROMPT = `You are Spark, an autonomous Solana momentum trading agent.

Your role is to analyze token signals and make trading decisions based on:
- Narrative momentum (how fast a story is spreading)
- On-chain metrics (holder growth, volume spikes)
- Market cap positioning (you prefer $100K–$10M range)
- Organic vs bot-driven activity

Your personality:
- Analytical but decisive
- Transparent about your reasoning
- Risk-aware — you never bet more than 5% on a single trade
- You explain your thinking clearly and concisely

When asked to make a trading decision, respond in JSON format:
{
  "action": "ENTER" | "SKIP" | "WATCH",
  "reasoning": "string (2-4 sentences explaining why)",
  "confidence": 0-100,
  "positionSizeUsd": number (only if action is ENTER),
  "stopLossPct": 0.20 (default)
}

When asked conversational questions, respond naturally as Spark.`;

export class DecisionEngine {
  private client: OpenAI;
  private config: SparkConfig;
  private lastDecision: AgentDecision | null = null;
  private chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  constructor(config: SparkConfig) {
    this.config = config;
    this.client = new OpenAI({ apiKey: config.openai.apiKey });
  }

  async decide(
    signal: AgentSignal,
    portfolio: PortfolioSnapshot,
    openPositions: OpenPosition[]
  ): Promise<AgentDecision> {
    const prompt = this.buildDecisionPrompt(signal, portfolio, openPositions);

    logger.debug(`Querying LLM for decision on ${signal.tokenSymbol}`);

    const response = await this.client.chat.completions.create({
      model: this.config.openai.model,
      messages: [
        { role: 'system', content: SPARK_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content ?? '{}';

    let parsed: {
      action: string;
      reasoning: string;
      confidence: number;
      positionSizeUsd?: number;
      stopLossPct?: number;
    };

    try {
      parsed = JSON.parse(content);
    } catch {
      logger.error('Failed to parse LLM response as JSON:', content);
      parsed = {
        action: 'SKIP',
        reasoning: 'Failed to parse LLM response — defaulting to SKIP.',
        confidence: 0,
      };
    }

    // Validate and cap position size
    if (parsed.action === 'ENTER' && parsed.positionSizeUsd) {
      parsed.positionSizeUsd = Math.min(
        parsed.positionSizeUsd,
        this.config.risk.maxPositionSizeUsd
      );
    } else if (parsed.action === 'ENTER') {
      // Default position size
      parsed.positionSizeUsd = Math.min(
        portfolio.totalUsd * this.config.risk.maxPortfolioRiskPct,
        this.config.risk.maxPositionSizeUsd
      );
    }

    const decision: AgentDecision = {
      action: parsed.action as AgentDecision['action'],
      signal,
      reasoning: parsed.reasoning,
      positionSizeUsd: parsed.positionSizeUsd,
      stopLossPct: parsed.stopLossPct ?? this.config.risk.stopLossPct,
      confidence: parsed.confidence,
    };

    this.lastDecision = decision;
    return decision;
  }

  async chat(
    message: string,
    context: {
      portfolio: PortfolioSnapshot;
      openPositions: OpenPosition[];
      cycleCount: number;
    }
  ): Promise<string> {
    const contextNote = `
Current context:
- Portfolio value: $${context.portfolio.totalUsd.toFixed(2)}
- Open positions: ${context.openPositions.length}
- Cycles completed: ${context.cycleCount}
- Open positions: ${JSON.stringify(context.openPositions.map(p => ({
      symbol: p.tokenSymbol,
      entryUsd: p.entryAmountUsd,
      status: p.status,
    })))}
    `.trim();

    this.chatHistory.push({ role: 'user', content: message });

    const messages = [
      { role: 'system' as const, content: SPARK_SYSTEM_PROMPT + '\n\n' + contextNote },
      ...this.chatHistory,
    ];

    const response = await this.client.chat.completions.create({
      model: this.config.openai.model,
      messages,
      temperature: 0.7,
    });

    const reply = response.choices[0]?.message?.content ?? 'No response.';
    this.chatHistory.push({ role: 'assistant', content: reply });

    // Keep history bounded
    if (this.chatHistory.length > 20) {
      this.chatHistory = this.chatHistory.slice(-20);
    }

    return reply;
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  getLastDecision(): AgentDecision | null {
    return this.lastDecision;
  }

  private buildDecisionPrompt(
    signal: AgentSignal,
    portfolio: PortfolioSnapshot,
    openPositions: OpenPosition[]
  ): string {
    return `
Evaluate this trading signal and decide whether to ENTER, SKIP, or WATCH.

TOKEN: ${signal.tokenSymbol}
Mint: ${signal.tokenMint}
Market cap: $${signal.marketCapUsd.toLocaleString()}
Holder count: ${signal.holderCount.toLocaleString()}
Narrative: ${signal.narrative}

MOMENTUM SCORES:
- Twitter Velocity: ${signal.signals.twitterVelocity}/35
- Holder Growth:    ${signal.signals.holderGrowth}/25
- Volume Spike:     ${signal.signals.volumeSpike}/20
- Organic Score:    ${signal.signals.organicScore}/10
- Narrative Fit:    ${signal.signals.narrativeFit}/10
- TOTAL:            ${signal.score}/100

PORTFOLIO:
- Total value: $${portfolio.totalUsd.toFixed(2)}
- Open positions: ${openPositions.length}
- Available USDC: $${portfolio.usdcBalance.toFixed(2)}

Respond with a JSON decision object.
    `.trim();
  }
}
