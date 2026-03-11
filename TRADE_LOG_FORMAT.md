# 📝 Trade Log Format

Every trade Spark executes is saved to `/logs/trades/` as a JSON file.

## File Naming

```
spark-{NNNN}-{SYMBOL}.json

Examples:
  spark-0001-DOOM.json
  spark-0042-PUNCH.json
```

## Schema

```typescript
interface TradeRecord {
  // Identity
  tradeId: string;          // "spark-0001"
  timestamp: string;        // ISO 8601

  // Token
  token: {
    symbol: string;         // "$DOOM"
    mint: string;           // Solana token mint address
    marketCapUsd: number;   // At time of trade
    holderCount: number;    // At time of trade
  };

  // Trade details
  action: "BUY" | "SELL";
  inputToken: string;       // "USDC" or token symbol
  inputAmount: number;      // Amount in USD
  outputToken: string;
  outputAmount: number;     // Raw token units
  priceImpactPct: number;   // Jupiter reported impact

  // Momentum signals at time of trade
  momentumScore: number;    // 0–100 composite
  signals: {
    twitterVelocity: number;  // 0–35
    holderGrowth: number;     // 0–25
    volumeSpike: number;      // 0–20
    organicScore: number;     // 0–10
    narrativeFit: number;     // 0–10
  };

  // LLM output
  reasoning: string;        // Full LLM reasoning text

  // Execution
  txid: string;             // Solana transaction ID
  solscanUrl: string;       // Direct Solscan link
  executedAt: string;       // ISO 8601

  // Risk
  stopLoss: number;         // Stop loss % (e.g., 0.20)
  targetExit: number | null; // Target exit % if set

  // Outcome (populated on close)
  status: "OPEN" | "CLOSED" | "STOPPED";
  exitedAt?: string;
  exitPrice?: number;
  realizedPnlUsd?: number;
  realizedPnlPct?: number;
}
```

## Example Record

```json
{
  "tradeId": "spark-0001",
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
  "outputAmount": 14534884,
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
  "txid": "5KtF3xqW9mNpRbV2LsYjK8EaZdCuG1HoXvT4AiBfMnP7sOcabXq",
  "solscanUrl": "https://solscan.io/tx/5KtF3xqW9mNpRbV2LsYjK8EaZdCuG1HoXvT4AiBfMnP7sOcabXq",
  "executedAt": "2025-03-11T14:23:04.201Z",
  "stopLoss": 0.20,
  "targetExit": null,
  "status": "OPEN"
}
```

## Master Log

All trades are also appended to `/logs/trades/master.jsonl` — one JSON object per line — for easy streaming/processing.

```bash
# Count all trades
wc -l logs/trades/master.jsonl

# Show all winning trades
cat logs/trades/master.jsonl | jq 'select(.realizedPnlUsd > 0)'

# Calculate total P&L
cat logs/trades/master.jsonl | jq '[.realizedPnlUsd // 0] | add'
```
