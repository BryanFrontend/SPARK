import { createLogger } from '../config/logger';
import { RiskApprovalParams, RiskConfig } from './types';

const logger = createLogger('RiskManager');

export class RiskManager {
  private config: RiskConfig;

  constructor(config: RiskConfig) {
    this.config = config;
  }

  approveEntry(params: RiskApprovalParams): boolean {
    const { positionSizeUsd, portfolioValueUsd, openPositions } = params;

    // Rule 1: Max open positions
    if (openPositions.length >= this.config.maxOpenPositions) {
      logger.warn(
        `Risk rejected: max open positions (${this.config.maxOpenPositions}) reached`
      );
      return false;
    }

    // Rule 2: Position size cap
    if (positionSizeUsd > this.config.maxPositionSizeUsd) {
      logger.warn(
        `Risk rejected: position size $${positionSizeUsd} exceeds max $${this.config.maxPositionSizeUsd}`
      );
      return false;
    }

    // Rule 3: Total portfolio risk
    const currentExposure = openPositions.reduce(
      (sum, p) => sum + p.entryAmountUsd, 0
    );
    const newTotalExposure = currentExposure + positionSizeUsd;
    const totalRiskPct = newTotalExposure / portfolioValueUsd;

    if (totalRiskPct > 0.30) {
      logger.warn(
        `Risk rejected: total exposure ${(totalRiskPct * 100).toFixed(1)}% exceeds 30% limit`
      );
      return false;
    }

    // Rule 4: Minimum portfolio value (don't trade if almost broke)
    if (portfolioValueUsd < 500) {
      logger.warn(`Risk rejected: portfolio value $${portfolioValueUsd} too low`);
      return false;
    }

    logger.info(
      `✅ Risk approved: $${positionSizeUsd} position ` +
      `(${((positionSizeUsd / portfolioValueUsd) * 100).toFixed(1)}% of portfolio)`
    );
    return true;
  }

  calculatePositionSize(portfolioValueUsd: number, confidence: number): number {
    // Scale position size with confidence (60–100% → 0.5x–1x of max)
    const confidenceMultiplier = 0.5 + ((confidence - 60) / 40) * 0.5;
    const baseSize = portfolioValueUsd * this.config.maxPortfolioRiskPct;
    const scaledSize = baseSize * Math.max(0.5, Math.min(1, confidenceMultiplier));

    return Math.min(scaledSize, this.config.maxPositionSizeUsd);
  }
}
