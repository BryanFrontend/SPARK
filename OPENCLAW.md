# 🦅 OpenClaw Agent Framework

OpenClaw is the autonomous agent framework that powers Spark and future agents.

## Philosophy

Most "AI trading bots" are rule-based systems with an LLM bolted on for marketing purposes.

OpenClaw is different. It is built for agents that:

- **Reason** about their environment, not just react to it
- **Explain** every decision they make, in natural language
- **Adapt** over time as they accumulate a history of decisions
- **Operate publicly** — transparency is a core design constraint, not an afterthought

## Core Primitives

### 1. AgentRuntime

The lifecycle manager. Handles loop scheduling, graceful shutdown, signal handling, and cycle tracking.

```typescript
interface AgentRuntime {
  initialize(): Promise<void>;
  startLoop(): Promise<void>;
  runCycle(): Promise<AgentCycleResult>;
  shutdown(): Promise<void>;
}
```

### 2. SignalBus

A pub/sub event system that decouples signal producers from decision consumers.

```typescript
// Any module can emit a signal
signalBus.emit('momentum.spike', { token: '$DOOM', score: 83 });

// The decision engine subscribes and responds
signalBus.on('momentum.spike', async (signal) => {
  const decision = await decisionEngine.decide(signal);
  // ...
});
```

### 3. ReasoningEngine

The LLM integration layer. Abstracts over different AI providers (OpenAI, Anthropic, Ollama) with a unified interface.

```typescript
interface ReasoningEngine {
  decide(signal: AgentSignal, context: AgentContext): Promise<AgentDecision>;
  explain(decision: AgentDecision): Promise<string>;
  chat(message: string, context: AgentContext): Promise<string>;
}
```

### 4. TransparencyLayer

Every agent built on OpenClaw must publish its decisions. The TransparencyLayer handles logging, Twitter publishing, and audit trail management.

```typescript
interface TransparencyLayer {
  logDecision(decision: AgentDecision): Promise<void>;
  publishTrade(trade: ExecutedTrade): Promise<void>;
  getAuditTrail(fromDate: Date): AuditRecord[];
}
```

### 5. ChainAdapter

Multi-chain abstraction. Spark uses the `SolanaAdapter`. Future agents can use `EthereumAdapter` or `BaseAdapter` with the same interface.

```typescript
interface ChainAdapter {
  getBalance(asset: string): Promise<number>;
  executeSwap(params: SwapParams): Promise<SwapResult>;
  getTokenPrice(mint: string): Promise<number>;
}
```

## Building Your Own Agent

```typescript
import { OpenClawRuntime, SolanaAdapter, OpenAIReasoner } from '@openclaw/core';

const agent = new OpenClawRuntime({
  name: 'MyAgent',
  chain: new SolanaAdapter({ rpcUrl: '...' }),
  reasoner: new OpenAIReasoner({ apiKey: '...' }),
  transparency: new TwitterTransparency({ ... }),
  loopIntervalMs: 60_000,
});

agent.onSignal(async (signal) => {
  // Your custom signal handler
  const decision = await agent.reason(signal);
  if (decision.action === 'ENTER') {
    await agent.execute(decision);
  }
});

await agent.start();
```

## Roadmap for OpenClaw SDK

- [ ] Public NPM package `@openclaw/core`
- [ ] Plugin system for signal sources (Twitter, Telegram, Discord, on-chain)
- [ ] Built-in backtesting harness
- [ ] Multi-agent coordination (agents sharing signals)
- [ ] Web dashboard for monitoring agent fleets
