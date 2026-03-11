#!/usr/bin/env ts-node
/**
 * Export Spark trade history to CSV
 * Run: npx ts-node scripts/export-trades.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const TRADES_DIR = process.env.LOG_TRADES_DIR ?? './logs/trades';
const OUTPUT_FILE = `./logs/spark-trades-${new Date().toISOString().split('T')[0]}.csv`;

interface TradeRecord {
  tradeId: string;
  action: string;
  tokenSymbol: string;
  inputAmount: number;
  outputAmount: number;
  momentumScore: number;
  reasoning: string;
  txid: string;
  status: string;
  executedAt: string;
  realizedPnlUsd?: number;
}

function exportTrades(): void {
  if (!fs.existsSync(TRADES_DIR)) {
    console.log('No trades directory found.');
    return;
  }

  const files = fs
    .readdirSync(TRADES_DIR)
    .filter(f => f.endsWith('.json') && f !== 'master.jsonl');

  if (files.length === 0) {
    console.log('No trade files found.');
    return;
  }

  const trades: TradeRecord[] = files.map(f => {
    return JSON.parse(fs.readFileSync(path.join(TRADES_DIR, f), 'utf-8'));
  });

  const header = [
    'Trade ID',
    'Action',
    'Token',
    'Input Amount (USD)',
    'Output Amount (tokens)',
    'Momentum Score',
    'Status',
    'Realized P&L (USD)',
    'TX ID',
    'Executed At',
    'Reasoning',
  ].join(',');

  const rows = trades.map(t => [
    t.tradeId,
    t.action,
    t.tokenSymbol,
    t.inputAmount.toFixed(2),
    t.outputAmount,
    t.momentumScore,
    t.status,
    t.realizedPnlUsd?.toFixed(2) ?? '',
    t.txid,
    t.executedAt,
    `"${t.reasoning.replace(/"/g, '""')}"`,
  ].join(','));

  const csv = [header, ...rows].join('\n');
  fs.mkdirSync('./logs', { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, csv, 'utf-8');

  console.log(`✅ Exported ${trades.length} trades to ${OUTPUT_FILE}`);
}

exportTrades();
