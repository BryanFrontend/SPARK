import { z } from 'zod';

const ConfigSchema = z.object({
  solana: z.object({
    rpcUrl: z.string().url(),
    privateKey: z.string().min(32),
    walletAddress: z.string().optional(),
  }),
  openai: z.object({
    apiKey: z.string().startsWith('sk-'),
    model: z.string().default('gpt-4o'),
  }),
  twitter: z.object({
    apiKey: z.string(),
    apiSecret: z.string(),
    accessToken: z.string(),
    accessTokenSecret: z.string(),
    bearerToken: z.string(),
  }),
  agent: z.object({
    loopIntervalMs: z.number().default(60_000),
    momentumScoreThreshold: z.number().min(1).max(100).default(80),
  }),
  risk: z.object({
    maxPositionSizeUsd: z.number().default(2500),
    maxPortfolioRiskPct: z.number().default(0.05),
    stopLossPct: z.number().default(0.20),
    maxOpenPositions: z.number().default(5),
  }),
  dexscreener: z.object({
    apiUrl: z.string().url().default('https://api.dexscreener.com/latest/dex'),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    tradesDir: z.string().default('./logs/trades'),
  }),
});

export type SparkConfig = z.infer<typeof ConfigSchema>;
export type TwitterConfig = SparkConfig['twitter'];

export function loadConfig(): SparkConfig {
  const raw = {
    solana: {
      rpcUrl: process.env.SOLANA_RPC_URL,
      privateKey: process.env.SOLANA_PRIVATE_KEY,
      walletAddress: process.env.SOLANA_WALLET_ADDRESS,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
    },
    twitter: {
      apiKey: process.env.TWITTER_API_KEY,
      apiSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      bearerToken: process.env.TWITTER_BEARER_TOKEN,
    },
    agent: {
      loopIntervalMs: parseInt(process.env.AGENT_LOOP_INTERVAL_MS ?? '60000'),
      momentumScoreThreshold: parseInt(
        process.env.MOMENTUM_SCORE_THRESHOLD ?? '80'
      ),
    },
    risk: {
      maxPositionSizeUsd: parseFloat(process.env.MAX_POSITION_SIZE_USD ?? '2500'),
      maxPortfolioRiskPct: parseFloat(process.env.MAX_PORTFOLIO_RISK_PCT ?? '0.05'),
      stopLossPct: parseFloat(process.env.STOP_LOSS_PCT ?? '0.20'),
      maxOpenPositions: parseInt(process.env.MAX_OPEN_POSITIONS ?? '5'),
    },
    dexscreener: {
      apiUrl:
        process.env.DEXSCREENER_API_URL ??
        'https://api.dexscreener.com/latest/dex',
    },
    logging: {
      level: process.env.LOG_LEVEL ?? 'info',
      tradesDir: process.env.LOG_TRADES_DIR ?? './logs/trades',
    },
  };

  const result = ConfigSchema.safeParse(raw);

  if (!result.success) {
    console.error('❌ Invalid configuration:');
    result.error.issues.forEach(issue => {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  return result.data;
}
