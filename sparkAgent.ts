import { SparkConfig } from '../config/config';
import { createLogger } from '../config/logger';
import { MomentumScanner } from '../momentum/momentumScanner';
import { CompositeScorer } from '../momentum/compositeScorer';
import { JupiterExecutor } from '../trading/jupiterExecutor';
import { PositionManager } from '../trading/positionManager';
import { RiskManager } from '../trading/riskManager';
import { TradeLogger } from '../trading/tradeLogger';
import { SparkWallet } from '../wallet/walletManager';
import { PortfolioTracker } from '../wallet/portfolioTracker';
import { TwitterMonitor } from '../twitter/twitterMonitor';
import { TweetPublisher } from '../twitter/tweetPublisher';
import { DecisionEngine } from './decisionEngine';
import {
  AgentOptions,
  AgentCycleResult,
  AgentDecision,
  HealthCheck,
  ExecutedTrade,
} from './types';
import { AgentSignal } from './types';

const logger = createLogger('SparkAgent');

export class SparkAgent {
  private config: SparkConfig;
  private options: AgentOptions;
  private running = false;
  private cycleCount = 0;

  // Core components
  private wallet!: SparkWallet;
  private portfolio!: PortfolioTracker;
  private scanner!: MomentumScanner;
  private scorer!: CompositeScorer;
  private decisionEngine!: DecisionEngine;
  private jupiterExecutor!: JupiterExecutor;
  private positionManager!: PositionManager;
  private riskManager!: RiskManager;
  private tradeLogger!: TradeLogger;
  private twitterMonitor!: TwitterMonitor;
  private tweetPublisher!: TweetPublisher;

  constructor(config: SparkConfig, options: AgentOptions) {
    this.config = config;
    this.options = options;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Spark agent components...');

    this.wallet = new SparkWallet({
      privateKey: this.config.solana.privateKey,
      rpcUrl: this.config.solana.rpcUrl,
    });

    this.portfolio = new PortfolioTracker(this.wallet);
    this.scanner = new MomentumScanner(this.config);
    this.scorer = new CompositeScorer(this.config);
    this.decisionEngine = new DecisionEngine(this.config);
    this.jupiterExecutor = new JupiterExecutor(this.wallet, this.config);
    this.positionManager = new PositionManager();
    this.riskManager = new RiskManager(this.config.risk);
    this.tradeLogger = new TradeLogger(this.config.logging.tradesDir);
    this.twitterMonitor = new TwitterMonitor(this.config.twitter);
    this.tweetPublisher = new TweetPublisher(this.config.twitter);

    logger.info('✅ Spark agent initialized.');

    const snapshot = await this.portfolio.getSnapshot();
    logger.info(`💰 Portfolio value: $${snapshot.totalUsd.toFixed(2)}`);
  }

  async startLoop(): Promise<void> {
    this.running = true;
    logger.info(`⚡ Agent loop started. Interval: ${this.config.agent.loopIntervalMs}ms`);

    while (this.running) {
      try {
        const result = await this.runCycle();
        this.logCycleResult(result);
      } catch (err) {
        logger.error('Cycle error:', err);
      }

      await this.sleep(this.config.agent.loopIntervalMs);
    }
  }

  async runCycle(): Promise<AgentCycleResult> {
    const startTime = Date.now();
    this.cycleCount++;
    logger.info(`\n─── Cycle #${this.cycleCount} ─────────────────────────────`);

    // 1. Scan for candidates
    const candidates = await this.scanner.getCandidates();
    logger.info(`🔍 Scanned ${candidates.length} candidate tokens`);

    // 2. Score each candidate
    const scored: AgentSignal[] = [];
    for (const candidate of candidates) {
      const signal = await this.scorer.score(candidate);
      if (signal.score >= 40) {
        scored.push(signal);
        logger.debug(`  ${signal.tokenSymbol}: ${signal.score}/100`);
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const aboveThreshold = scored.filter(
      s => s.score >= this.config.agent.momentumScoreThreshold
    );

    logger.info(`📊 ${aboveThreshold.length} tokens above threshold (${this.config.agent.momentumScoreThreshold})`);

    if (aboveThreshold.length === 0) {
      return {
        action: 'NO_SIGNAL',
        candidatesScanned: candidates.length,
        candidatesAboveThreshold: 0,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    // 3. Check existing positions for exits
    await this.checkExits(scored);

    // 4. Decide on top signal
    const topSignal = aboveThreshold[0];
    const portfolio = await this.portfolio.getSnapshot();
    const openPositions = this.positionManager.getOpenPositions();

    const alreadyInPosition = openPositions.some(
      p => p.tokenMint === topSignal.tokenMint
    );

    if (alreadyInPosition) {
      logger.info(`📌 Already in position for ${topSignal.tokenSymbol} — holding`);
      return {
        action: 'HOLD',
        candidatesScanned: candidates.length,
        candidatesAboveThreshold: aboveThreshold.length,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    // 5. Get LLM decision
    const decision = await this.decisionEngine.decide(topSignal, portfolio, openPositions);
    logger.info(`🧠 Decision: ${decision.action} — ${decision.reasoning.slice(0, 80)}...`);

    if (decision.action !== 'ENTER') {
      return {
        action: decision.action,
        candidatesScanned: candidates.length,
        candidatesAboveThreshold: aboveThreshold.length,
        decision,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    // 6. Risk check
    const riskApproved = this.riskManager.approveEntry({
      positionSizeUsd: decision.positionSizeUsd!,
      portfolioValueUsd: portfolio.totalUsd,
      openPositions,
    });

    if (!riskApproved) {
      logger.warn('⚠️  Risk manager rejected trade — skipping');
      return {
        action: 'RISK_REJECTED',
        candidatesScanned: candidates.length,
        candidatesAboveThreshold: aboveThreshold.length,
        decision,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    // 7. Execute trade (or simulate in dry-run)
    let trade: ExecutedTrade;

    if (this.options.dryRun) {
      trade = this.simulateTrade(decision, topSignal);
      logger.info(`💸 [DRY RUN] Would execute: BUY ${topSignal.tokenSymbol} $${decision.positionSizeUsd}`);
    } else {
      trade = await this.jupiterExecutor.executeBuy({
        tokenMint: topSignal.tokenMint,
        tokenSymbol: topSignal.tokenSymbol,
        amountUsd: decision.positionSizeUsd!,
        signal: topSignal,
        reasoning: decision.reasoning,
      });
      logger.info(`✅ Trade executed: ${trade.txid}`);
    }

    // 8. Log trade
    await this.tradeLogger.log(trade);
    this.positionManager.addPosition(trade);

    // 9. Tweet update
    if (!this.options.dryRun) {
      await this.tweetPublisher.publishTrade(trade);
    }

    return {
      action: 'TRADE_EXECUTED',
      candidatesScanned: candidates.length,
      candidatesAboveThreshold: aboveThreshold.length,
      decision,
      trade,
      durationMs: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  private async checkExits(currentScores: AgentSignal[]): Promise<void> {
    const openPositions = this.positionManager.getOpenPositions();

    for (const position of openPositions) {
      const currentSignal = currentScores.find(
        s => s.tokenMint === position.tokenMint
      );

      const currentScore = currentSignal?.score ?? 0;

      if (currentScore < 40) {
        logger.info(`📉 ${position.tokenSymbol} score dropped to ${currentScore} — evaluating exit`);
        // Exit logic would go here in production
      }
    }
  }

  private simulateTrade(decision: AgentDecision, signal: AgentSignal): ExecutedTrade {
    return {
      tradeId: `spark-dry-${Date.now()}`,
      action: 'BUY',
      tokenMint: signal.tokenMint,
      tokenSymbol: signal.tokenSymbol,
      inputToken: 'USDC',
      inputAmount: decision.positionSizeUsd!,
      outputToken: signal.tokenSymbol,
      outputAmount: 0, // simulated
      priceImpactPct: 0,
      txid: 'DRY_RUN',
      solscanUrl: '',
      momentumScore: signal.score,
      signals: signal.signals,
      reasoning: decision.reasoning,
      stopLoss: decision.stopLossPct!,
      status: 'OPEN',
      executedAt: new Date(),
    };
  }

  async chat(message: string): Promise<string> {
    return this.decisionEngine.chat(message, {
      portfolio: await this.portfolio.getSnapshot(),
      openPositions: this.positionManager.getOpenPositions(),
      cycleCount: this.cycleCount,
    });
  }

  async healthCheck(): Promise<HealthCheck> {
    const [wallet, rpc, dexscreener, openai, twitter] = await Promise.allSettled([
      this.wallet.ping(),
      this.wallet.pingRpc(),
      this.scanner.pingDexscreener(),
      this.decisionEngine.ping(),
      this.tweetPublisher.ping(),
    ]);

    return {
      wallet: wallet.status === 'fulfilled',
      rpc: rpc.status === 'fulfilled',
      dexscreener: dexscreener.status === 'fulfilled',
      openai: openai.status === 'fulfilled',
      twitter: twitter.status === 'fulfilled',
    };
  }

  explainLastDecision() {
    return this.decisionEngine.getLastDecision();
  }

  async shutdown(): Promise<void> {
    this.running = false;
    logger.info('Spark agent shut down cleanly.');
  }

  private logCycleResult(result: AgentCycleResult): void {
    logger.info(
      `Cycle complete | Action: ${result.action} | ` +
      `Scanned: ${result.candidatesScanned} | ` +
      `Duration: ${result.durationMs}ms`
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
