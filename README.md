<div align="center">

<img src="spark.png" alt="Spark Logo" width="180"/>

# ⚡ Spark

### Autonomous Solana Momentum Trading Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Mainnet-purple?logo=solana)](https://solana.com/)
[![Jupiter](https://img.shields.io/badge/DEX-Jupiter_v6-orange)](https://jup.ag/)
[![Built on OpenClaw](https://img.shields.io/badge/Built_on-OpenClaw_Framework-red)](./docs/OPENCLAW.md)
[![Wallet](https://img.shields.io/badge/Funded-$10%2C000_USDC-brightgreen)](#wallet--transparency)
[![Trades](https://img.shields.io/badge/Trades-Public-blue)](#trade-transparency)
[![Status](https://img.shields.io/badge/Status-Live-success)]()
[![Twitter](https://img.shields.io/badge/Twitter-@BryanFrontend-1DA1F2?logo=twitter&logoColor=white)](https://twitter.com/BryanFrontend)

---

> **Spark is a live, autonomous momentum trading agent running on Solana.**
> It was funded with $10,000 USDC, trades from its own public wallet, and every decision is logged transparently.
> The goal: find out if an AI agent — built purely on narrative momentum signals — can become consistently profitable.

---

[ Quick Start](#-getting-started) · [ Architecture](#-architecture) · [ Live Trades](#-example-trades) · [ Roadmap](#️-roadmap) · [ OpenClaw Framework](#-openclaw-agent-framework) · [📖 Docs](./docs/)

</div>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Agent Concept](#-agent-concept)
- [Architecture](#-architecture)
- [Spark Decision Model](#-spark-decision-model)
- [Momentum Detection Logic](#-momentum-detection-logic)
- [Wallet Execution System](#-wallet-execution-system)
- [Trade Transparency](#-trade-transparency)
- [Public Wallet Tracking](#-public-wallet-tracking)
- [OpenClaw Agent Framework](#-openclaw-agent-framework)
- [Example Agent Interaction](#-example-agent-interaction)
- [Example Trades](#-example-trades)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
- [Running Spark Locally](#-running-spark-locally)
- [Configuration](#-configuration)
- [Roadmap](#️-roadmap)
- [Future Agents](#-future-agents)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Project Overview

**Spark** is the first publicly deployed agent in the **OpenClaw** autonomous agent framework ecosystem. It operates exclusively on the Solana blockchain and uses a proprietary momentum detection pipeline to identify early-stage token narratives before they reach mainstream attention.

Spark does not use price-only signals. Instead, it synthesizes:

-  **Social narrative velocity** — how fast a story is spreading across Twitter/X, Telegram, and on-chain holder growth
-  **On-chain momentum** — volume surges, holder count growth rate, wallet concentration metrics
-  **Community strength** — organic vs. bot-driven engagement scoring
-  **Narrative classification** — LLM-powered categorization of what *type* of narrative is forming

When enough signals converge, Spark autonomously executes a trade via **Jupiter DEX**, logs the reasoning publicly, and posts a summary to Twitter.

```
Every trade Spark makes is:
  ✅ Logged on-chain
  ✅ Posted to Twitter in real-time
  ✅ Explained with full reasoning
  ✅ Tracked against P&L
```

This is an experiment. Spark may lose money. Spark may make money. The point is to find out — in public, with full transparency.

---

## 🤖 Agent Concept

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│   Spark is not a trading bot.                                     │
│   Spark is a trading AGENT.                                       │
│                                                                   │
│   The difference:                                                 │
│   • A bot executes rules.                                         │
│   • An agent reasons, explains, and adapts.                       │
│                                                                   │
│   Spark reads narratives. Spark forms opinions.                   │
│   Spark places trades and tells you exactly why.                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Why Momentum Trading?

Solana's memecoin and micro-cap ecosystem is uniquely driven by narrative momentum. Token prices in the $100K–$10M market cap range are highly sensitive to:

| Signal Type | Weight | Description |
|---|---|---|
| Twitter narrative velocity | 35% | Rate of new unique accounts mentioning token |
| Holder growth rate | 25% | New wallets acquiring token per hour |
| Volume spike | 20% | Volume vs. 24h average ratio |
| Community engagement score | 10% | Organic vs. artificial engagement ratio |
| Narrative category match | 10% | Does narrative fit known profitable patterns? |

### Spark's Edge

Most traders miss **early narrative momentum** because:
1. They only watch charts
2. They don't monitor narrative velocity across social channels simultaneously
3. They don't distinguish organic from bot-driven momentum
4. They enter after the momentum is already priced in

Spark enters **before** the chart moves, by detecting narrative formation at its origin.

---

## 📐 Architecture

### System Overview

```
╔══════════════════════════════════════════════════════════════════╗
║                        SPARK AGENT SYSTEM                        ║
╚══════════════════════════════════════════════════════════════════╝

  External Data Sources
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │   Twitter/X  │  │  Helius RPC  │  │  DexScreener │
  │   Streaming  │  │  On-Chain    │  │  Price Feed  │
  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Data Aggregation     │
              │   & Normalization      │
              │   Layer                │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Momentum Detection   │
              │   Engine               │
              │                        │
              │  • NarrativeScorer     │
              │  • VelocityTracker     │
              │  • HolderAnalyzer      │
              │  • VolumeDetector      │
              └────────────┬───────────┘
                           │
                    ┌──────┴──────┐
                    │  Score ≥    │
                    │  Threshold? │
                    └──────┬──────┘
                      YES  │   NO
                    ┌──────┘   └──────┐
                    ▼                 ▼
         ┌──────────────────┐  ┌─────────────┐
         │  Spark Decision  │  │  Continue   │
         │  Engine (LLM)    │  │  Monitoring │
         └────────┬─────────┘  └─────────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Risk Manager    │
         │  • Position size │
         │  • Stop loss     │
         │  • Max exposure  │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Solana Wallet   │
         │  Execution Layer │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Jupiter DEX     │
         │  Swap Router     │
         └────────┬─────────┘
                  │
                  ├──────────────────────────┐
                  ▼                          ▼
         ┌──────────────────┐      ┌──────────────────┐
         │  Trade Logger    │      │  Twitter Poster  │
         │  (On-chain + DB) │      │  (Public Update) │
         └──────────────────┘      └──────────────────┘
```

### Component Map

```
spark-agent/
│
├── 🧠 src/agent/          — Core Spark reasoning loop
├── 📡 src/momentum/       — Signal detection & scoring
├── 💱 src/trading/        — Jupiter execution & position management
├── 👛 src/wallet/         — Solana wallet & signing
├── 🐦 src/twitter/        — Social monitoring & posting
└── ⚙️  src/config/         — Environment & agent configuration
```

---

## 🧠 Spark Decision Model

Spark's reasoning loop runs on a configurable interval (default: **60 seconds**). Each cycle:

```
╔══════════════════════════════════════════╗
║         SPARK REASONING LOOP             ║
╠══════════════════════════════════════════╣
║                                          ║
║  1. SCAN     → Fetch candidate tokens    ║
║  2. SCORE    → Run momentum scoring      ║
║  3. FILTER   → Apply risk filters        ║
║  4. REASON   → LLM explains top signal   ║
║  5. DECIDE   → Enter, skip, or exit      ║
║  6. EXECUTE  → Submit transaction        ║
║  7. LOG      → Record reasoning + tx     ║
║  8. PUBLISH  → Tweet the decision        ║
║                                          ║
╚══════════════════════════════════════════╝
```

### Decision Matrix

| Condition | Action |
|---|---|
| Score ≥ 80, no open position | **ENTER** — buy with calculated position size |
| Score ≥ 80, position already open | **HOLD** — add to position if risk allows |
| Score 60–79 | **WATCH** — add to watchlist, monitor closely |
| Score < 60 | **SKIP** — not enough signal |
| Open position, score drops < 40 | **EXIT** — sell and take profit/loss |
| Open position hits stop loss | **EMERGENCY EXIT** — sell immediately |

### Position Sizing Formula

```
positionSize = (portfolioValue × riskPercent) / stopLossPercent

where:
  portfolioValue = current USDC balance
  riskPercent    = 0.05 (5% max risk per trade)
  stopLossPercent = 0.20 (20% stop loss default)

→ Max position = $10,000 × 5% / 20% = $2,500 per trade
```

---

## 📡 Momentum Detection Logic

### Narrative Velocity Score

Spark tracks how fast a token's narrative is spreading across Twitter. It calculates a **velocity score** based on:

```typescript
// Simplified scoring logic from src/momentum/narrativeScorer.ts

export function calculateNarrativeVelocity(
  mentions: TwitterMention[]
): VelocityResult {
  const now = Date.now();
  const window1h = mentions.filter(m => now - m.timestamp < 3_600_000);
  const window6h = mentions.filter(m => now - m.timestamp < 21_600_000);

  const recentRate = window1h.length;
  const baseRate = window6h.length / 6;

  const velocityMultiplier = baseRate > 0
    ? recentRate / baseRate
    : recentRate > 0 ? 10 : 0;

  const uniqueAccounts = new Set(window1h.map(m => m.authorId)).size;
  const organicScore = uniqueAccounts / Math.max(window1h.length, 1);

  return {
    velocityMultiplier,
    recentMentions: recentRate,
    organicScore,
    score: Math.min(100, velocityMultiplier * organicScore * 20),
  };
}
```

### On-Chain Signal Detection

```typescript
// From src/momentum/onChainAnalyzer.ts

export async function analyzeOnChainMomentum(
  tokenMint: string,
  rpcClient: Connection
): Promise<OnChainSignal> {
  const [holders, volume, liquidity] = await Promise.all([
    fetchHolderCount(tokenMint, rpcClient),
    fetch24hVolume(tokenMint),
    fetchLiquidityDepth(tokenMint),
  ]);

  const holderGrowthRate = await calculateHolderGrowthRate(tokenMint, holders);
  const volumeSpikeRatio = volume.current / Math.max(volume.avg24h, 1);

  return {
    holderCount: holders.total,
    holderGrowthRatePerHour: holderGrowthRate,
    volumeSpikeRatio,
    liquidityUsd: liquidity.totalUsd,
    score: computeOnChainScore({ holderGrowthRate, volumeSpikeRatio, liquidity }),
  };
}
```

### Composite Scoring

```
┌────────────────────────────────────────────────────────┐
│                 COMPOSITE MOMENTUM SCORE                │
├────────────────┬───────────┬────────────────────────── │
│ Signal         │ Weight    │ Max Points                 │
├────────────────┼───────────┼────────────────────────── │
│ Twitter Vel.   │  35%      │ 35                         │
│ Holder Growth  │  25%      │ 25                         │
│ Volume Spike   │  20%      │ 20                         │
│ Organic Score  │  10%      │ 10                         │
│ Narrative Fit  │  10%      │ 10                         │
├────────────────┼───────────┼────────────────────────── │
│ TOTAL          │  100%     │ 100                        │
└────────────────┴───────────┴────────────────────────── │
```

---

## 👛 Wallet Execution System

### Solana Wallet Architecture

Spark operates from a **dedicated Solana wallet**. The private key is loaded from environment variables and never exposed in logs or tweets.

```typescript
// From src/wallet/walletManager.ts

export class SparkWallet {
  private keypair: Keypair;
  private connection: Connection;

  constructor(config: WalletConfig) {
    const secretKey = bs58.decode(config.privateKey);
    this.keypair = Keypair.fromSecretKey(secretKey);
    this.connection = new Connection(config.rpcUrl, 'confirmed');
  }

  get publicKey(): PublicKey {
    return this.keypair.publicKey;
  }

  async getPortfolioValue(): Promise<PortfolioSnapshot> {
    const [sol, tokens] = await Promise.all([
      this.getSOLBalance(),
      this.getTokenBalances(),
    ]);
    return { sol, tokens, totalUsd: await this.calculateTotalUsd(sol, tokens) };
  }

  async signAndSendTransaction(
    transaction: Transaction,
    signers: Signer[] = []
  ): Promise<string> {
    transaction.recentBlockhash = (
      await this.connection.getLatestBlockhash()
    ).blockhash;
    transaction.feePayer = this.keypair.publicKey;
    transaction.sign(this.keypair, ...signers);
    return this.connection.sendRawTransaction(transaction.serialize());
  }
}
```

### Jupiter DEX Integration

All swaps route through **Jupiter Aggregator v6** to guarantee best execution:

```typescript
// From src/trading/jupiterExecutor.ts

export class JupiterExecutor {
  private readonly BASE_URL = 'https://quote-api.jup.ag/v6';

  async executeSwap(params: SwapParams): Promise<SwapResult> {
    // 1. Get quote
    const quote = await this.getQuote({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: params.amountLamports,
      slippageBps: params.slippageBps ?? 300, // 3% default
    });

    // 2. Get swap transaction
    const { swapTransaction } = await this.getSwapTransaction({
      quoteResponse: quote,
      userPublicKey: params.wallet.publicKey.toString(),
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    });

    // 3. Deserialize and sign
    const tx = VersionedTransaction.deserialize(
      Buffer.from(swapTransaction, 'base64')
    );
    tx.sign([params.wallet.keypair]);

    // 4. Send with confirmation
    const txid = await params.connection.sendTransaction(tx);
    await params.connection.confirmTransaction(txid, 'confirmed');

    return {
      txid,
      inputAmount: quote.inAmount,
      outputAmount: quote.outAmount,
      priceImpactPct: parseFloat(quote.priceImpactPct),
      executedAt: new Date(),
    };
  }
}
```

---

## 📊 Trade Transparency

Every trade Spark makes is:

```
╔══════════════════════════════════════════════════════════════╗
║  SPARK TRADE TRANSPARENCY PROTOCOL                           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📝 REASONING LOG                                            ║
║     Full LLM reasoning exported to /logs/trades/            ║
║     Includes all signal scores, weights, and narrative text  ║
║                                                              ║
║  ⛓️  ON-CHAIN RECORD                                          ║
║     Every transaction is on Solana mainnet                   ║
║     Viewable on Solscan / SolanaFM                           ║
║                                                              ║
║  🐦 TWITTER UPDATE                                           ║
║     Tweet posted within 30 seconds of trade execution        ║
║     Includes: token, size, reason, tx link                   ║
║                                                              ║
║  📈 P&L TRACKING                                             ║
║     Running P&L updated in real-time in this repo            ║
║     Performance dashboard at /docs/PERFORMANCE.md            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### Trade Log Format

```json
{
  "tradeId": "spark-0042",
  "timestamp": "2025-03-11T14:23:01.000Z",
  "token": {
    "symbol": "$DOOM",
    "mint": "DoomXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "marketCapUsd": 368000,
    "holderCount": 2281
  },
  "action": "BUY",
  "inputToken": "USDC",
  "inputAmount": 500,
  "outputToken": "$DOOM",
  "outputAmount": 14520000,
  "priceImpactPct": 0.87,
  "momentumScore": 83,
  "signals": {
    "twitterVelocity": 28,
    "holderGrowth": 22,
    "volumeSpike": 19,
    "organicScore": 8,
    "narrativeFit": 6
  },
  "reasoning": "Doom Neuron narrative gaining traction via @vytalow community. Holder growth rate 4.2x above baseline. Volume spike ratio 3.1x. Early entry opportunity before narrative reaches broader CT.",
  "txid": "5KtF3...abXq",
  "solscanUrl": "https://solscan.io/tx/5KtF3...abXq",
  "stopLoss": 0.20,
  "targetExit": null,
  "status": "OPEN"
}
```

---

## 👁️ Public Wallet Tracking

Spark's wallet is fully public. Track every transaction in real-time:

| Resource | Link |
|---|---|
| 🔍 Solscan | `https://solscan.io/account/SPARK_WALLET_ADDRESS` |
| 📊 SolanaFM | `https://solana.fm/address/SPARK_WALLET_ADDRESS` |
| 💹 Portfolio | `/docs/PERFORMANCE.md` |
| 🐦 Twitter | `@SparkAgent_SOL` |

### Live Portfolio Snapshot

> *Updated automatically via GitHub Actions on each trade*

| Asset | Amount | USD Value | % Portfolio |
|---|---|---|---|
| USDC | 8,421.00 | $8,421.00 | 84.2% |
| $DOOM | 14,520,000 | $1,058.00 | 10.6% |
| $PUNCH | 2,210,000 | $521.00 | 5.2% |
| **TOTAL** | — | **$10,000.00** | 100% |

> Starting balance: **$10,000.00 USDC** — Current P&L: **$0.00 (0.00%)**

---

## 🦅 OpenClaw Agent Framework

Spark is built on **OpenClaw** — an autonomous agent framework designed specifically for crypto-native AI agents.

```
╔══════════════════════════════════════════════════════════════════╗
║                    OPENCLAW FRAMEWORK                            ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   OpenClaw provides the foundational infrastructure for          ║
║   building autonomous, on-chain AI agents that:                  ║
║                                                                  ║
║   ⚡ React to real-world events                                   ║
║   🧠 Reason using LLMs                                           ║
║   💰 Execute financial transactions                              ║
║   📢 Communicate their actions publicly                          ║
║   🔄 Learn from outcomes                                         ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### Framework Architecture

```
OpenClaw Core
│
├── AgentRuntime          — Lifecycle management, loop scheduling
├── MemoryStore           — Persistent agent state & history
├── SignalBus             — Pub/sub event system for signals
├── ToolRegistry          — Pluggable external action modules
├── ReasoningEngine       — LLM integration layer (OpenAI / Anthropic)
├── TransparencyLayer     — Logging, publishing, audit trail
└── ChainAdapter          — Multi-chain execution abstraction
    ├── SolanaAdapter     ← Spark uses this
    ├── EthereumAdapter
    └── BaseAdapter
```

### Building an Agent on OpenClaw

OpenClaw follows an **agent primitive** pattern. Any agent built on OpenClaw must implement:

```typescript
// From src/agent/sparkAgent.ts

export interface OpenClawAgent {
  // Core lifecycle
  initialize(): Promise<void>;
  runCycle(): Promise<AgentCycleResult>;
  shutdown(): Promise<void>;

  // Signal handling
  onSignal(signal: AgentSignal): Promise<void>;

  // Transparency
  explainLastDecision(): DecisionExplanation;
  getPerformanceHistory(): PerformanceRecord[];
}

// Spark implements this interface:
export class SparkAgent implements OpenClawAgent {
  async runCycle(): Promise<AgentCycleResult> {
    const candidates = await this.scanner.getCandidates();
    const scored = await this.momentum.scoreAll(candidates);
    const topSignal = scored.filter(s => s.score >= 80)[0];

    if (topSignal) {
      const decision = await this.reasoningEngine.decide(topSignal);
      if (decision.action === 'ENTER') {
        const trade = await this.trader.execute(decision);
        await this.transparency.publish(trade);
        return { action: 'TRADE_EXECUTED', trade };
      }
    }

    return { action: 'NO_TRADE', candidates: scored.length };
  }
}
```

### Agents Built on OpenClaw

| Agent | Status | Strategy | Chain |
|---|---|---|---|
| ⚡ **Spark** | 🟢 Live | Momentum / Narrative | Solana |
| 🌊 **Tide** | 🔵 Planned | Mean reversion | Solana |
| 🔥 **Ember** | 🔵 Planned | NFT floor arbitrage | Solana |
| 🎯 **Arrow** | 🔵 Planned | Options hedging | Ethereum |
| 🌙 **Luna** | 🔵 Planned | Yield optimization | Multi-chain |

---

## 💬 Example Agent Interaction

Spark has a conversational interface you can query locally. Here's an example session:

```
$ spark chat

⚡ Spark Agent v1.0.0 — Interactive Mode
Type 'exit' to quit.

> What are you looking at right now?

Spark: I'm currently monitoring 3 tokens that have passed my initial filters:

  1. $DOOM  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Narrative: Community rallying around @vytalow and Doom Neuron
     Market cap: ~$368K | Holders: ~2,281
     Momentum score: 83/100 ⬆️
     Signal: Holder growth 4.2x above baseline, velocity spike last 2h

  2. $WHITEHOUSE  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Narrative: White House official meme accounts posting war content
     Market cap: ~$474K | Holders: ~8,122
     Momentum score: 61/100 →
     Signal: Volume spike but organic score low (possible bot activity)

  3. $PUNCH  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Narrative: Viral bullied monkey meme spreading across Twitter
     Market cap: ~$6.7M | Holders: ~24,058
     Momentum score: 54/100 ⬇️
     Signal: Already priced in, late stage narrative

> Why are you favoring $DOOM?

Spark: $DOOM has the highest composite momentum score at 83/100.

  Here's my breakdown:

  Twitter Velocity  ████████████████████████░░░░░░░  28/35
  Holder Growth     ████████████████████░░░░░░░░░░░  22/25
  Volume Spike      ███████████████████░░░░░░░░░░░░  19/20
  Organic Score     ████████░░░░░░░░░░░░░░░░░░░░░░░   8/10
  Narrative Fit     ██████░░░░░░░░░░░░░░░░░░░░░░░░░   6/10
  ─────────────────────────────────────────────────
  TOTAL             ████████████████████████░░░░░░░  83/100

  The narrative is in EARLY formation. @vytalow has 47K followers and
  posted about Doom Neuron 3 hours ago. Holder count grew by 312 in
  the last hour — that's 4.2x the 7-day baseline.

  $WHITEHOUSE looks interesting but the organic score is 0.41, which
  suggests coordinated buying. I don't trade bot-driven momentum.

  $PUNCH is a great meme but at $6.7M market cap with 24K holders,
  the narrative has already matured. Risk/reward isn't there for entry.

> Are you going to trade $DOOM?

Spark: Yes. I'm preparing a $500 position in $DOOM.

  Position sizing:
  Portfolio value:   $10,000.00
  Risk per trade:     5% = $500.00
  Stop loss:         -20%
  Max loss on trade: -$100.00

  I'll route through Jupiter with 3% slippage tolerance.
  Transaction will be on-chain and tweeted within 30 seconds.

  Executing now...

  ✅ Trade executed.
  TX: 5KtF3xqW9mNpRbV2LsYjK8EaZdCuG1HoXvT4AiBfMnP7sOc
  Solscan: https://solscan.io/tx/5KtF3...

> What's your overall P&L?

Spark: Portfolio snapshot as of now:

  Starting balance:   $10,000.00
  Current value:      $10,000.00
  Unrealized P&L:     $0.00 (0.00%)
  Realized P&L:       $0.00 (0.00%)

  Open positions:
  • $DOOM — $500 entry — unrealized: +$0 (trade just executed)

  Win rate: — (0 closed trades)
  Avg trade duration: —

> exit

Spark: Shutting down interactive mode. Agent loop continues in background.
```

---

## 📈 Example Trades

### Trade #001 — $DOOM Entry

```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ SPARK TRADE #001                                         │
│  Action: BUY $DOOM                                          │
├─────────────────────────────────────────────────────────────┤
│  Date:        2025-03-11 14:23:01 UTC                       │
│  Entry price: $0.0000344                                    │
│  Position:    $500 USDC → 14,534,884 $DOOM                 │
│  Market cap:  $368,000                                      │
│  Holders:     2,281                                         │
│  Score:       83/100                                        │
├─────────────────────────────────────────────────────────────┤
│  Reasoning:   Early Doom Neuron narrative via @vytalow.     │
│               4.2x holder growth baseline. Volume spike     │
│               3.1x 24h avg. Organic engagement 0.78.        │
├─────────────────────────────────────────────────────────────┤
│  Stop loss:   -20% ($400 exit)                              │
│  Target:      None set (narrative trailing)                 │
│  TX:          5KtF3xqW9m...Pc                               │
│  Status:      🟢 OPEN                                       │
└─────────────────────────────────────────────────────────────┘
```

### Trade #002 — $WHITEHOUSE Skip

```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ SPARK DECISION #002                                      │
│  Action: SKIP $WHITEHOUSE                                   │
├─────────────────────────────────────────────────────────────┤
│  Date:        2025-03-11 15:01:44 UTC                       │
│  Score:       61/100                                        │
│  Reason:      Organic score 0.41 — coordinated buying       │
│               detected. Momentum is artificial. Skip.       │
│  Status:      ⏭️ SKIPPED                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Repository Structure

```
spark-agent/
│
├── 📄 README.md                    ← You are here
├── 📄 ARCHITECTURE.md              ← Deep system design docs
├── 📄 AGENT_RULES.md               ← Spark's behavioral rules & constraints
├── 📄 TRADE_LOG_FORMAT.md          ← Trade log schema reference
├── 📄 package.json
├── 📄 tsconfig.json
├── 📄 .env.example
├── 📄 .gitignore
│
├── 📁 src/
│   ├── 📄 index.ts                 ← Entry point
│   │
│   ├── 📁 agent/
│   │   ├── 📄 sparkAgent.ts        ← Core agent class
│   │   ├── 📄 agentLoop.ts         ← Main reasoning loop
│   │   ├── 📄 decisionEngine.ts    ← LLM-powered decision making
│   │   └── 📄 types.ts             ← Agent type definitions
│   │
│   ├── 📁 momentum/
│   │   ├── 📄 momentumScanner.ts   ← Token candidate scanner
│   │   ├── 📄 narrativeScorer.ts   ← Twitter narrative scoring
│   │   ├── 📄 onChainAnalyzer.ts   ← On-chain signal detection
│   │   ├── 📄 compositeScorer.ts   ← Signal aggregation
│   │   └── 📄 types.ts
│   │
│   ├── 📁 trading/
│   │   ├── 📄 jupiterExecutor.ts   ← Jupiter DEX swap execution
│   │   ├── 📄 positionManager.ts  ← Open position tracking
│   │   ├── 📄 riskManager.ts       ← Risk rules & position sizing
│   │   ├── 📄 tradeLogger.ts       ← Trade record keeping
│   │   └── 📄 types.ts
│   │
│   ├── 📁 wallet/
│   │   ├── 📄 walletManager.ts     ← Solana keypair & signing
│   │   ├── 📄 portfolioTracker.ts  ← Balance & token tracking
│   │   └── 📄 types.ts
│   │
│   ├── 📁 twitter/
│   │   ├── 📄 twitterMonitor.ts    ← Stream & search Twitter
│   │   ├── 📄 tweetPublisher.ts    ← Post trade updates
│   │   ├── 📄 sentimentAnalyzer.ts ← Organic vs bot scoring
│   │   └── 📄 types.ts
│   │
│   └── 📁 config/
│       ├── 📄 config.ts            ← Config loader & validator
│       └── 📄 constants.ts         ← System constants
│
├── 📁 scripts/
│   ├── 📄 start.sh                 ← Start agent in production
│   ├── 📄 backtest.ts              ← Historical backtesting
│   └── 📄 export-trades.ts         ← Export trade history
│
├── 📁 docs/
│   ├── 📄 OPENCLAW.md              ← OpenClaw framework guide
│   ├── 📄 PERFORMANCE.md           ← Live P&L dashboard
│   ├── 📄 SIGNALS.md               ← Signal documentation
│   └── 📄 DEPLOYMENT.md            ← Production deployment guide
│
├── 📁 assets/
│   ├── 📁 logo/
│   │   └── 🖼️  spark_logo.png
│   ├── 📁 diagrams/
│   │   └── 🖼️  architecture.png
│   └── 📁 screenshots/
│       └── 🖼️  terminal_demo.png
│
└── 📁 logs/                        ← Auto-generated, git-ignored
    └── 📁 trades/
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20.x+ | LTS recommended |
| npm | 9.x+ | Comes with Node |
| Solana CLI | 1.18.x+ | For wallet management |
| A Solana wallet | — | Funded with USDC |
| OpenAI API key | — | For reasoning engine |
| Twitter API v2 | — | For monitoring & posting |
| Helius RPC | — | Premium RPC access |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/openclaw/spark-agent.git
cd spark-agent

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Configure your environment (see Configuration section)
nano .env

# 5. Build TypeScript
npm run build

# 6. Run health check
npm run check
```

---

## ⚙️ Configuration

Copy `.env.example` to `.env` and fill in:

```env
# ── Solana ────────────────────────────────────────────────────
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
SOLANA_PRIVATE_KEY=your_base58_encoded_private_key
SOLANA_WALLET_ADDRESS=your_public_key

# ── OpenAI (Reasoning Engine) ──────────────────────────────────
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# ── Twitter API v2 ─────────────────────────────────────────────
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_TOKEN_SECRET=...
TWITTER_BEARER_TOKEN=...

# ── Agent Configuration ────────────────────────────────────────
AGENT_LOOP_INTERVAL_MS=60000         # How often to scan (ms)
MOMENTUM_SCORE_THRESHOLD=80          # Min score to consider trade
MAX_POSITION_SIZE_USD=2500           # Max $ per trade
MAX_PORTFOLIO_RISK_PCT=0.05          # Max % portfolio at risk
STOP_LOSS_PCT=0.20                   # Default stop loss

# ── DexScreener ────────────────────────────────────────────────
DEXSCREENER_API_URL=https://api.dexscreener.com/latest/dex

# ── Logging ────────────────────────────────────────────────────
LOG_LEVEL=info
LOG_TRADES_DIR=./logs/trades
```

---

## 🏃 Running Spark Locally

### Development Mode (dry run — no real trades)

```bash
# Run with dry-run flag — logs decisions but doesn't execute
npm run dev -- --dry-run

# Output:
# ⚡ Spark Agent v1.0.0 starting...
# 🔍 Scanning 847 tokens...
# 📊 Scored 23 candidates above threshold...
# 🎯 Top signal: $DOOM (score: 83)
# 🧠 Reasoning: Early narrative...
# 💸 [DRY RUN] Would execute: BUY $DOOM $500
# 📝 Trade logged to ./logs/trades/dry-run-001.json
```

### Production Mode (live trading)

```bash
# Start the agent (live trading with real funds)
npm run start

# Or use the production shell script:
bash scripts/start.sh
```

### Interactive Chat Mode

```bash
# Start the conversational interface
npm run chat
```

### Backtesting

```bash
# Run historical backtest against last 30 days
npm run backtest -- --days=30 --capital=10000

# Output:
# 📊 Backtest Results (30 days)
# ──────────────────────────────
# Trades executed: 47
# Win rate: 61.7%
# Total P&L: +$2,841.22 (+28.4%)
# Best trade: $BONK +312%
# Worst trade: $RUG -20%
# Sharpe ratio: 1.84
```

### NPM Scripts Reference

| Script | Description |
|---|---|
| `npm run dev` | Development mode with hot reload |
| `npm run dev -- --dry-run` | Development with no real trades |
| `npm run start` | Production agent loop |
| `npm run build` | Compile TypeScript |
| `npm run chat` | Interactive agent chat |
| `npm run backtest` | Historical backtesting |
| `npm run check` | System health check |
| `npm run export-trades` | Export trade history to CSV |
| `npm run lint` | Run ESLint |
| `npm run test` | Run test suite |

---

## 🗺️ Roadmap

```
2025 Q1  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Spark v1.0 — Core momentum agent live
  ✅ Twitter monitoring & trade publishing
  ✅ Jupiter v6 swap integration
  ✅ Public wallet transparency
  🔄 Performance dashboard (in progress)

2025 Q2  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⬜ Telegram group monitoring
  ⬜ On-chain wallet copy detection (smart money tracking)
  ⬜ Spark v1.1 — Adaptive position sizing based on confidence
  ⬜ Discord narrative monitoring
  ⬜ Backtesting dashboard (web UI)

2025 Q3  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⬜ Tide agent (mean reversion) — OpenClaw agent #2
  ⬜ Ember agent (NFT floor arb) — OpenClaw agent #3
  ⬜ Multi-agent portfolio management
  ⬜ Agent-to-agent signal sharing

2025 Q4  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⬜ OpenClaw Framework public SDK release
  ⬜ Community agent builder (anyone can deploy an OpenClaw agent)
  ⬜ Cross-chain expansion (Base, Ethereum)
  ⬜ Spark v2.0 — Reinforcement learning from trade history
```

---

## 🔭 Future Agents

The OpenClaw framework is designed to support a growing ecosystem of autonomous crypto agents:

### 🌊 Tide — Mean Reversion Agent
> *Coming Q3 2025*

Tide identifies tokens that have dropped significantly from their recent high but retain strong fundamentals (holder count, liquidity depth). It enters on oversold conditions and exits on recovery.

### 🔥 Ember — NFT Floor Arbitrage Agent
> *Coming Q3 2025*

Ember monitors Solana NFT collection floor prices across Magic Eden and Tensor simultaneously, identifying and executing arbitrage opportunities.

### 🎯 Arrow — Options Hedging Agent
> *Coming Q4 2025*

Arrow manages options positions on Ethereum to hedge Spark's Solana exposure, maintaining portfolio-level risk balance.

### 🌙 Luna — Yield Optimization Agent
> *Coming Q4 2025*

Luna automatically moves idle USDC across DeFi protocols to maximize yield while maintaining liquidity for trading agents.

---

## 🤝 Contributing

Contributions are welcome! Spark and the OpenClaw framework are open source.

```bash
# Fork and clone
git fork https://github.com/openclaw/spark-agent
git clone https://github.com/YOUR_USERNAME/spark-agent

# Create a feature branch
git checkout -b feature/my-new-signal

# Make your changes, then:
npm run lint
npm run test

# Submit a pull request
```

### Contribution Areas

- 📡 New signal detectors in `/src/momentum/`
- 💹 New DEX integrations in `/src/trading/`
- 🐦 New social monitoring sources in `/src/twitter/`
- 📖 Documentation improvements
- 🧪 Test coverage

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting PRs.

---

## ⚠️ Disclaimer

```
┌─────────────────────────────────────────────────────────────────┐
│                        ⚠️  DISCLAIMER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Spark is an experimental autonomous trading agent.             │
│  It may lose money. It may make money. This is an experiment.   │
│                                                                  │
│  Nothing in this repository constitutes financial advice.        │
│  The $10,000 funding is a public experiment in AI trading,       │
│  not a recommendation to trade memecoins or follow Spark.        │
│                                                                  │
│  Cryptocurrency trading is highly risky. You can lose           │
│  everything. Do your own research. Never trade what you          │
│  can't afford to lose.                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

<div align="center">

**Built with ⚡ by Bryan**

[![Twitter](https://img.shields.io/badge/Twitter-@BryanFrontend-1DA1F2?logo=twitter&logoColor=white)](https://twitter.com/BryanFrontend)


*Every trade. Public. Every decision. Explained.*

</div>
