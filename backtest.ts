#!/usr/bin/env ts-node
/**
 * Spark Backtesting Engine
 * Run: npx ts-node scripts/backtest.ts --days=30 --capital=10000
 */

import 'dotenv/config';
import * as fs from 'fs';

interface BacktestConfig {
  days: number;
  capital: number;
  momentumThreshold: number;
  stopLossPct: number;
  maxPositionSizeUsd: number;
}

interface BacktestTrade {
  id: string;
  symbol: string;
  entryDate: string;
  exitDate: string;
  entryCapUsd: number;
  exitCapUsd: number;
  positionUsd: number;
  pnlUsd: number;
  pnlPct: number;
  momentumScore: number;
  exitReason: 'MOMENTUM_EXIT' | 'STOP_LOSS' | 'END_OF_PERIOD';
}

interface BacktestResult {
  config: BacktestConfig;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnlUsd: number;
  totalPnlPct: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  bestTrade: BacktestTrade | null;
  worstTrade: BacktestTrade | null;
  trades: BacktestTrade[];
}

function parseArgs(): BacktestConfig {
  const args = process.argv.slice(2);
  const get = (key: string, def: number) => {
    const arg = args.find(a => a.startsWith(`--${key}=`));
    return arg ? parseFloat(arg.split('=')[1]) : def;
  };

  return {
    days: get('days', 30),
    capital: get('capital', 10_000),
    momentumThreshold: get('threshold', 80),
    stopLossPct: get('stoploss', 0.20),
    maxPositionSizeUsd: get('maxposition', 2_500),
  };
}

/**
 * Simulated backtest using synthetic historical data.
 * In production, this would replay historical DexScreener + Twitter data.
 */
function runBacktest(config: BacktestConfig): BacktestResult {
  console.log('\n📊 Spark Backtest Engine v1.0');
  console.log('══════════════════════════════════════');
  console.log(`Capital: $${config.capital.toLocaleString()}`);
  console.log(`Period: ${config.days} days`);
  console.log(`Threshold: ${config.momentumThreshold}/100`);
  console.log(`Stop loss: ${(config.stopLossPct * 100).toFixed(0)}%`);
  console.log('══════════════════════════════════════\n');

  // Simulate trade outcomes based on momentum score distributions
  const TRADE_FREQUENCY = 1.5; // trades per day on average
  const totalTrades = Math.floor(config.days * TRADE_FREQUENCY);

  const trades: BacktestTrade[] = [];
  let portfolioValue = config.capital;
  let peak = config.capital;
  let maxDrawdown = 0;
  const dailyReturns: number[] = [];

  for (let i = 0; i < totalTrades; i++) {
    const score = config.momentumThreshold + Math.random() * (100 - config.momentumThreshold);
    const positionUsd = Math.min(
      portfolioValue * 0.05,
      config.maxPositionSizeUsd
    );

    if (positionUsd < 50) break;

    // Simulate outcome based on score
    // Higher score = better win rate
    const winProbability = 0.35 + (score - 80) / 100;
    const isWin = Math.random() < winProbability;

    let pnlPct: number;
    let exitReason: BacktestTrade['exitReason'];

    if (isWin) {
      // Winning trades: 20% to 400% gain (momentum plays)
      pnlPct = 0.20 + Math.random() * 3.80;
      exitReason = 'MOMENTUM_EXIT';
    } else {
      // Losing trades: hit stop loss at -20%
      pnlPct = -config.stopLossPct;
      exitReason = 'STOP_LOSS';
    }

    const pnlUsd = positionUsd * pnlPct;
    portfolioValue += pnlUsd;

    if (portfolioValue > peak) peak = portfolioValue;
    const drawdown = (peak - portfolioValue) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;

    const dayOffset = Math.floor((i / totalTrades) * config.days);
    const entryDate = new Date(Date.now() - (config.days - dayOffset) * 86400000);
    const exitDate = new Date(entryDate.getTime() + Math.random() * 72 * 3600000);

    trades.push({
      id: `backtest-${String(i + 1).padStart(4, '0')}`,
      symbol: randomSymbol(),
      entryDate: entryDate.toISOString().split('T')[0],
      exitDate: exitDate.toISOString().split('T')[0],
      entryCapUsd: Math.random() * 5_000_000,
      exitCapUsd: 0,
      positionUsd,
      pnlUsd,
      pnlPct,
      momentumScore: Math.round(score),
      exitReason,
    });

    dailyReturns.push(pnlPct);
  }

  const wins = trades.filter(t => t.pnlUsd > 0);
  const losses = trades.filter(t => t.pnlUsd <= 0);
  const totalPnlUsd = portfolioValue - config.capital;
  const sharpe = calculateSharpe(dailyReturns);

  const sorted = [...trades].sort((a, b) => b.pnlPct - a.pnlPct);

  return {
    config,
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: wins.length / trades.length,
    totalPnlUsd,
    totalPnlPct: totalPnlUsd / config.capital,
    maxDrawdownPct: maxDrawdown,
    sharpeRatio: sharpe,
    bestTrade: sorted[0] ?? null,
    worstTrade: sorted[sorted.length - 1] ?? null,
    trades,
  };
}

function calculateSharpe(returns: number[]): number {
  if (returns.length === 0) return 0;
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / returns.length;
  const std = Math.sqrt(variance);
  return std === 0 ? 0 : (avg / std) * Math.sqrt(252);
}

function randomSymbol(): string {
  const symbols = [
    'DOOM', 'PUNCH', 'BONK', 'MEME', 'PEPE', 'WIF', 'BOME',
    'CAT', 'NYAN', 'WOLF', 'BULL', 'BEAR', 'MOON', 'SUN',
  ];
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function printResults(result: BacktestResult): void {
  const pnlSign = result.totalPnlUsd >= 0 ? '+' : '';
  const pnlEmoji = result.totalPnlUsd >= 0 ? '🟢' : '🔴';

  console.log('══════════════════════════════════════');
  console.log('         BACKTEST RESULTS              ');
  console.log('══════════════════════════════════════');
  console.log(`Period:       ${result.config.days} days`);
  console.log(`Total trades: ${result.totalTrades}`);
  console.log(`Wins:         ${result.wins} (${(result.winRate * 100).toFixed(1)}%)`);
  console.log(`Losses:       ${result.losses}`);
  console.log(`Total P&L:    ${pnlEmoji} ${pnlSign}$${result.totalPnlUsd.toFixed(2)} (${pnlSign}${(result.totalPnlPct * 100).toFixed(1)}%)`);
  console.log(`Max drawdown: ${(result.maxDrawdownPct * 100).toFixed(1)}%`);
  console.log(`Sharpe ratio: ${result.sharpeRatio.toFixed(2)}`);

  if (result.bestTrade) {
    console.log(
      `Best trade:   $${result.bestTrade.symbol} +${(result.bestTrade.pnlPct * 100).toFixed(0)}%`
    );
  }
  if (result.worstTrade) {
    console.log(
      `Worst trade:  $${result.worstTrade.symbol} ${(result.worstTrade.pnlPct * 100).toFixed(0)}%`
    );
  }

  console.log('══════════════════════════════════════\n');

  // Save results
  const outPath = `./logs/backtest-${Date.now()}.json`;
  fs.mkdirSync('./logs', { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`Full results saved: ${outPath}`);
}

const config = parseArgs();
const result = runBacktest(config);
printResults(result);
