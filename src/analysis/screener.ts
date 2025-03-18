import { PricingResult } from '../core/types';

export class OpportunityFinder {
  private volatilityThreshold: number;
  private minDaysToExpiry: number;
  private targetDeltaRange: [number, number];

  constructor(
    volatilityThreshold: number,
    minDaysToExpiry: number,
    targetDeltaRange: [number, number]
  ) {
    this.volatilityThreshold = volatilityThreshold;
    this.minDaysToExpiry = minDaysToExpiry;
    this.targetDeltaRange = targetDeltaRange;
  }

  /**
   * Finds options that are good for premium selling.
   * @param options - The list of pricing results to filter.
   * @returns A list of options meeting the criteria.
   */
  findPremiumOpportunities(options: PricingResult[]): PricingResult[] {
    return options.filter(option => 
      option.modelUsed === 'black-scholes' &&
      option.greeks.vega > this.volatilityThreshold &&
      option.parameters.timeToExpiration * 365 >= this.minDaysToExpiry &&
      option.greeks.delta >= this.targetDeltaRange[0] &&
      option.greeks.delta <= this.targetDeltaRange[1]
    );
  }

  /**
   * Finds options suitable for hedging strategies.
   * @param options - The list of pricing results to filter.
   * @returns A list of options meeting the criteria.
   */
  findHedgeOpportunities(options: PricingResult[]): PricingResult[] {
    return options.filter(option =>
      option.greeks.gamma > 0.1 &&
      option.parameters.timeToExpiration * 365 <= 30 &&
      option.greeks.theta < -0.05
    );
  }
}
