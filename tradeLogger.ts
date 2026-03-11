import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../config/logger';
import { ExecutedTrade } from '../agent/types';

const logger = createLogger('TradeLogger');

export interface TradeRecord extends ExecutedTrade {
  exitedAt?: Date;
  exitPrice?: number;
  realizedPnlUsd?: number;
  realizedPnlPct?: number;
}

export class TradeLogger {
  private tradesDir: string;
  private tradeCounter = 0;

  constructor(tradesDir: string) {
    this.tradesDir = tradesDir;
    fs.mkdirSync(tradesDir, { recursive: true });

    // Count existing trades for ID continuation
    const existing = fs.readdirSync(tradesDir).filter(f => f.endsWith('.json'));
    this.tradeCounter = existing.length;
  }

  async log(trade: ExecutedTrade): Promise<void> {
    this.tradeCounter++;

    const record: TradeRecord = {
      ...trade,
      tradeId: `spark-${String(this.tradeCounter).padStart(4, '0')}`,
    };

    const filename = `${record.tradeId}-${trade.tokenSymbol}.json`;
    const filepath = path.join(this.tradesDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(record, null, 2), 'utf-8');

    logger.info(`📝 Trade logged: ${filepath}`);

    // Append to master log
    this.appendToMasterLog(record);
  }

  async updateTrade(
    tradeId: string,
    updates: Partial<TradeRecord>
  ): Promise<void> {
    const files = fs.readdirSync(this.tradesDir);
    const file = files.find(f => f.startsWith(tradeId));

    if (!file) {
      logger.warn(`Trade ${tradeId} not found for update`);
      return;
    }

    const filepath = path.join(this.tradesDir, file);
    const existing: TradeRecord = JSON.parse(
      fs.readFileSync(filepath, 'utf-8')
    );
    const updated = { ...existing, ...updates };

    fs.writeFileSync(filepath, JSON.stringify(updated, null, 2), 'utf-8');
    logger.info(`📝 Trade updated: ${tradeId}`);
  }

  getAllTrades(): TradeRecord[] {
    const files = fs
      .readdirSync(this.tradesDir)
      .filter(f => f.endsWith('.json') && f !== 'master.jsonl');

    return files.map(f => {
      const content = fs.readFileSync(
        path.join(this.tradesDir, f),
        'utf-8'
      );
      return JSON.parse(content) as TradeRecord;
    });
  }

  getPerformanceSummary(): {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalPnlUsd: number;
    totalPnlPct: number;
  } {
    const closed = this.getAllTrades().filter(
      t => t.status === 'CLOSED' && t.realizedPnlUsd !== undefined
    );

    const wins = closed.filter(t => (t.realizedPnlUsd ?? 0) > 0);
    const losses = closed.filter(t => (t.realizedPnlUsd ?? 0) <= 0);
    const totalPnlUsd = closed.reduce((s, t) => s + (t.realizedPnlUsd ?? 0), 0);
    const totalEntry = closed.reduce((s, t) => s + t.inputAmount, 0);

    return {
      totalTrades: closed.length,
      wins: wins.length,
      losses: losses.length,
      winRate: closed.length > 0 ? wins.length / closed.length : 0,
      totalPnlUsd,
      totalPnlPct: totalEntry > 0 ? totalPnlUsd / totalEntry : 0,
    };
  }

  private appendToMasterLog(record: TradeRecord): void {
    const masterPath = path.join(this.tradesDir, 'master.jsonl');
    fs.appendFileSync(masterPath, JSON.stringify(record) + '\n', 'utf-8');
  }
}
