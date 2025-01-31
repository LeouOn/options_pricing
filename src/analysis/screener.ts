import { PricingResult } from '../core/types';

export class OpportunityFinder {
  private volatilityThreshold: number;
  private minDaysToExpiry: number;
  private targetDeltaRange: [number, number];

  constructor(
    volatilityThreshold = 0.3,
    minDaysToExpiry = 14,
    targetDeltaRange: [number, number] = [0.3, 0.7]
  ) {
    this.volatilityThreshold = volatilityThreshold;
    this.minDaysToExpiry = minDaysToExpiry;
    this.targetDeltaRange = targetDeltaRange;
  }

  findPremiumOpportunities(options: PricingResult[]): PricingResult[] {
    return options.filter(option => 
      option.modelUsed === 'black-scholes' &&
      option.greeks.vega > this.volatilityThreshold &&
      option.parameters.timeToExpiration * 365 >= this.minDaysToExpiry &&
      option.greeks.delta >= this.targetDeltaRange[0] &&
      option.greeks.delta <= this.targetDeltaRange[1]
    );
  }

  findHedgeOpportunities(options: PricingResult[]): PricingResult[] {
    return options.filter(option =>
      option.greeks.gamma > 0.1 &&
      option.parameters.timeToExpiration * 365 <= 30 &&
      option.greeks.theta < -0.05
    );
  }
}