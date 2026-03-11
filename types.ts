export type AgentAction = 'ENTER' | 'EXIT' | 'HOLD' | 'SKIP' | 'WATCH';

export interface AgentSignal {
  tokenMint: string;
  tokenSymbol: string;
  score: number;
  signals: SignalBreakdown;
  narrative: string;
  marketCapUsd: number;
  holderCount: number;
  timestamp: Date;
}

export interface SignalBreakdown {
  twitterVelocity: number;    // 0–35
  holderGrowth: number;       // 0–25
  volumeSpike: number;        // 0–20
  organicScore: number;       // 0–10
  narrativeFit: number;       // 0–10
}

export interface AgentDecision {
  action: AgentAction;
  signal: AgentSignal;
  reasoning: string;
  positionSizeUsd?: number;
  stopLossPct?: number;
  confidence: number;
}

export interface AgentCycleResult {
  action: string;
  candidatesScanned: number;
  candidatesAboveThreshold: number;
  decision?: AgentDecision;
  trade?: ExecutedTrade;
  durationMs: number;
  timestamp: Date;
}

export interface ExecutedTrade {
  tradeId: string;
  action: 'BUY' | 'SELL';
  tokenMint: string;
  tokenSymbol: string;
  inputToken: string;
  inputAmount: number;
  outputToken: string;
  outputAmount: number;
  priceImpactPct: number;
  txid: string;
  solscanUrl: string;
  momentumScore: number;
  signals: SignalBreakdown;
  reasoning: string;
  stopLoss: number;
  status: 'OPEN' | 'CLOSED' | 'STOPPED';
  executedAt: Date;
}

export interface HealthCheck {
  wallet: boolean;
  rpc: boolean;
  dexscreener: boolean;
  openai: boolean;
  twitter: boolean;
}

export interface AgentOptions {
  dryRun: boolean;
}
