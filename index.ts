import 'dotenv/config';
import { SparkAgent } from './agent/sparkAgent';
import { loadConfig } from './config/config';
import { createLogger } from './config/logger';
import * as readline from 'readline';

const logger = createLogger('main');

async function main() {
  const args = process.argv.slice(2);
  const mode = args.find(a => a.startsWith('--mode='))?.split('=')[1] ?? 'agent';
  const dryRun = args.includes('--dry-run') || process.env.DRY_RUN === 'true';

  logger.info('⚡ Spark Agent v1.0.0 starting...');
  logger.info(`Mode: ${mode} | Dry run: ${dryRun}`);

  const config = loadConfig();
  const agent = new SparkAgent(config, { dryRun });

  await agent.initialize();

  if (mode === 'check') {
    await runHealthCheck(agent);
    process.exit(0);
  } else if (mode === 'chat') {
    await runChatMode(agent);
  } else {
    await runAgentMode(agent);
  }
}

async function runAgentMode(agent: SparkAgent): Promise<void> {
  logger.info('Starting agent loop...');

  process.on('SIGINT', async () => {
    logger.info('Received SIGINT — shutting down gracefully...');
    await agent.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM — shutting down gracefully...');
    await agent.shutdown();
    process.exit(0);
  });

  await agent.startLoop();
}

async function runChatMode(agent: SparkAgent): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n⚡ Spark Agent v1.0.0 — Interactive Mode');
  console.log("Type 'exit' to quit.\n");

  const ask = () => {
    rl.question('> ', async (input) => {
      const trimmed = input.trim();
      if (trimmed === 'exit') {
        console.log('\nSpark: Shutting down interactive mode. Agent loop continues in background.');
        rl.close();
        return;
      }

      if (trimmed) {
        const response = await agent.chat(trimmed);
        console.log(`\nSpark: ${response}\n`);
      }

      ask();
    });
  };

  ask();
}

async function runHealthCheck(agent: SparkAgent): Promise<void> {
  console.log('\n🔍 Running Spark health check...\n');
  const health = await agent.healthCheck();

  const statusIcon = (ok: boolean) => (ok ? '✅' : '❌');

  console.log(`${statusIcon(health.wallet)}      Wallet connection`);
  console.log(`${statusIcon(health.rpc)}         Solana RPC`);
  console.log(`${statusIcon(health.dexscreener)} DexScreener API`);
  console.log(`${statusIcon(health.openai)}      OpenAI API`);
  console.log(`${statusIcon(health.twitter)}     Twitter API`);

  const allOk = Object.values(health).every(Boolean);
  console.log(`\n${allOk ? '✅ All systems operational.' : '⚠️  Some checks failed. Review your .env config.'}\n`);
}

main().catch((err) => {
  logger.error('Fatal error:', err);
  process.exit(1);
});
