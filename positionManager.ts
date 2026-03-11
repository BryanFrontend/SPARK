import { createLogger } from '../config/logger';
import { OpenPosition } from './types';
import { ExecutedTrade } from '../agent/types';

const logger = createLogger('PositionManager');

export class PositionManager {
  private positions = new Map<string, OpenPosition>();

  addPosition(trade: ExecutedTrade): void {
    const position: OpenPosition = {
      tradeId: trade.tradeId,
      tokenMint: trade.tokenMint,
      tokenSymbol: trade.tokenSymbol,
      entryAmountUsd: trade.inputAmount,
      tokenAmount: trade.outputAmount,
      entryPrice: trade.inputAmount / Math.max(trade.outputAmount, 1),
      entryAt: trade.executedAt,
      stopLossPct: trade.stopLoss,
      status: 'OPEN',
    };

    this.positions.set(trade.tokenMint, position);
    logger.info(`Position opened: ${trade.tokenSymbol} — $${trade.inputAmount}`);
  }

  closePosition(tokenMint: string, exitPriceUsd: number): OpenPosition | null {
    const position = this.positions.get(tokenMint);
    if (!position) return null;

    const currentValue = position.tokenAmount * exitPriceUsd;
    const pnlUsd = currentValue - position.entryAmountUsd;
    const pnlPct = pnlUsd / position.entryAmountUsd;

    logger.info(
      `Position closed: ${position.tokenSymbol} — ` +
      `P&L: $${pnlUsd.toFixed(2)} (${(pnlPct * 100).toFixed(1)}%)`
    );

    position.status = 'CLOSED';
    this.positions.delete(tokenMint);
    return position;
  }

  getOpenPositions(): OpenPosition[] {
    return Array.from(this.positions.values()).filter(
      p => p.status === 'OPEN'
    );
  }

  getPosition(tokenMint: string): OpenPosition | undefined {
    return this.positions.get(tokenMint);
  }

  isStopLossTriggered(tokenMint: string, currentPriceUsd: number): boolean {
    const position = this.positions.get(tokenMint);
    if (!position) return false;

    const currentValue = position.tokenAmount * currentPriceUsd;
    const pnlPct = (currentValue - position.entryAmountUsd) / position.entryAmountUsd;

    if (pnlPct <= -position.stopLossPct) {
      logger.warn(
        `🛑 Stop loss triggered for ${position.tokenSymbol}: ` +
        `${(pnlPct * 100).toFixed(1)}% < -${(position.stopLossPct * 100).toFixed(0)}%`
      );
      return true;
    }

    return false;
  }

  getSummary(): { openCount: number; totalExposureUsd: number } {
    const open = this.getOpenPositions();
    return {
      openCount: open.length,
      totalExposureUsd: open.reduce((sum, p) => sum + p.entryAmountUsd, 0),
    };
  }
}
