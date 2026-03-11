// Solana token mints
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Jupiter
export const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';

// DexScreener
export const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';

// Spark scoring weights
export const SCORE_WEIGHTS = {
  twitterVelocity: 35,
  holderGrowth: 25,
  volumeSpike: 20,
  organicScore: 10,
  narrativeFit: 10,
} as const;

// Market cap filter
export const MARKET_CAP_MIN_USD = 50_000;
export const MARKET_CAP_MAX_USD = 20_000_000;

// Liquidity filter
export const MIN_LIQUIDITY_USD = 10_000;

// Agent timing
export const DEFAULT_LOOP_INTERVAL_MS = 60_000;

// Risk defaults
export const DEFAULT_STOP_LOSS_PCT = 0.20;
export const DEFAULT_MAX_POSITION_SIZE_USD = 2_500;
export const DEFAULT_MAX_PORTFOLIO_RISK_PCT = 0.05;
export const DEFAULT_MAX_OPEN_POSITIONS = 5;

// Solscan base URL
export const SOLSCAN_TX_BASE = 'https://solscan.io/tx';
export const SOLSCAN_ACCOUNT_BASE = 'https://solscan.io/account';
