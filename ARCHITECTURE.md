# 📐 Spark Architecture

## System Design

Spark is designed around three core principles:

1. **Modularity** — every component is replaceable. Swap DexScreener for Birdeye. Swap GPT-4o for Claude. Swap Jupiter for Raydium.
2. **Transparency** — every decision is logged, every trade is public, every reasoning step is stored.
3. **Safety first** — the risk manager can veto any trade. Stop losses are enforced at code level.

## Component Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         SPARK AGENT RUNTIME                           │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                        AGENT LOOP (60s)                          │ │
│  │                                                                    │ │
│  │   SCAN → SCORE → FILTER → REASON → DECIDE → EXECUTE → LOG/TWEET │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │  MOMENTUM ENGINE │  │  DECISION ENGINE  │  │  EXECUTION ENGINE    │ │
│  │                 │  │                  │  │                      │ │
│  │ NarrativeScorer │  │  OpenAI GPT-4o   │  │  JupiterExecutor     │ │
│  │ VelocityTracker │  │  PromptBuilder   │  │  WalletManager       │ │
│  │ OnChainAnalyzer │  │  ResponseParser  │  │  PositionManager     │ │
│  │ CompositeScorer │  │  ChatInterface   │  │  RiskManager         │ │
│  └────────┬────────┘  └────────┬─────────┘  └──────────┬───────────┘ │
│           │                   │                        │              │
│  ┌────────▼───────────────────▼────────────────────────▼───────────┐ │
│  │                      DATA / STATE LAYER                          │ │
│  │                                                                    │ │
│  │    TradeLogger    PositionStore    PortfolioTracker    Cache      │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                    TRANSPARENCY LAYER                             │ │
│  │                                                                    │ │
│  │           TweetPublisher          TradeLogger                     │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
External Sources                 Internal Pipeline
──────────────                   ─────────────────

Twitter API     ──┐
DexScreener API ──┼──► MomentumScanner ──► CompositeScorer ──► AgentSignal
Helius RPC      ──┘          │
                              │ TokenCandidate[]
                              ▼
                        NarrativeScorer ──► VelocityResult
                        OnChainAnalyzer ──► OnChainSignal
                              │
                              ▼
                        CompositeScorer ──► score: 0–100
                              │
                              │ if score ≥ threshold
                              ▼
                        DecisionEngine (LLM)
                              │
                              │ AgentDecision {action, reasoning, size}
                              ▼
                        RiskManager.approveEntry()
                              │
                              │ if approved
                              ▼
                        JupiterExecutor.executeBuy()
                              │
                        ┌─────┴──────┐
                        ▼            ▼
                  TradeLogger   TweetPublisher
```

## Module Responsibilities

### `src/agent/`

The orchestration layer. `SparkAgent` is the top-level class that coordinates all other modules. `DecisionEngine` wraps the LLM and is responsible for turning signals into decisions.

### `src/momentum/`

Signal generation. Three independent scorers produce signal components that are then merged by `CompositeScorer`:
- `NarrativeScorer` — Twitter velocity and organic detection
- `OnChainAnalyzer` — holder count, volume spikes
- `CompositeScorer` — weighted aggregation of all signals

### `src/trading/`

Execution and position management. `JupiterExecutor` handles all DEX interactions. `RiskManager` is a pure function layer that approves or rejects trades. `PositionManager` tracks open positions in memory (persisted via `TradeLogger`).

### `src/wallet/`

Solana key management and portfolio tracking. The private key is loaded once at startup and never logged.

### `src/twitter/`

Bidirectional Twitter integration. `TwitterMonitor` reads signal data. `TweetPublisher` posts trade updates.

## Error Handling Strategy

- All external API calls are wrapped in try/catch with timeouts
- Failed API calls return safe default values (not exceptions) where possible
- The agent loop catches all cycle-level errors and continues
- Transaction failures are logged and the trade is marked as FAILED (not OPEN)
- Stop losses are checked on every cycle

## Scaling Considerations

For production deployment at scale:

1. **Redis** for position state instead of in-memory Map
2. **PostgreSQL** for trade history instead of JSON files
3. **Message queue** (SQS/RabbitMQ) for decoupling signal detection from execution
4. **Multiple RPC endpoints** with failover for Solana
5. **Rate limit management** across Twitter API tiers
