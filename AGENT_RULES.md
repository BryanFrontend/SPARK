# 📋 Spark Agent Rules

These are the hard-coded behavioral rules that govern Spark's trading decisions.
They exist at code level — not as LLM instructions that can be overridden.

## Capital Rules

| Rule | Value | Rationale |
|---|---|---|
| Starting capital | $10,000 USDC | Fixed experiment budget |
| Max position size | $2,500 | Max 25% in one trade |
| Max risk per trade | 5% of portfolio | Protects against ruin |
| Default stop loss | 20% | Hard rule, not LLM-guided |
| Max open positions | 5 | Keeps focus, limits exposure |
| Min portfolio to trade | $500 | Don't trade while near-broke |

## Token Filters (Hard Rejects)

Spark will **never** trade a token that:

- Has market cap below $50,000 (too illiquid / rug risk)
- Has market cap above $20,000,000 (too late, narrative priced in)
- Has less than $10,000 in liquidity
- Has less than $1,000 in volume in the last hour
- Has organic score below 0.30 (likely bot-driven)
- Is an LP token or wrapped asset

## Decision Rules

1. **One position per token** — Spark never doubles into the same token
2. **Score must be ≥ 80** — No exceptions; if the LLM disagrees, the code wins
3. **Risk manager has veto power** — LLM cannot override the risk manager
4. **Stop losses are automatic** — Spark checks stop losses every cycle and exits without LLM confirmation
5. **No revenge trading** — After a stop-loss exit, Spark waits at least 2 cycles before re-evaluating that token

## Transparency Rules

- Every trade decision (including SKIP) is logged
- Every BUY and SELL is tweeted within 60 seconds
- Reasoning is always saved (never truncated in logs)
- P&L is updated in real-time in the repository

## LLM Rules

The LLM (Decision Engine) is used for:
- Converting scored signals into ENTER/SKIP/WATCH decisions
- Generating human-readable reasoning for trades
- Conversational interaction in chat mode

The LLM is **not** allowed to:
- Override stop losses
- Increase position size beyond `MAX_POSITION_SIZE_USD`
- Trade tokens that failed the hard filter
- Execute transactions directly (it only returns decisions)

## Emergency Rules

If the portfolio drops below $3,000 (70% loss):
1. All positions are closed
2. The agent enters PAUSE mode
3. A tweet is posted explaining the situation
4. Human review is required to restart
