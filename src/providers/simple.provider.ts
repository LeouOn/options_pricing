import { BasePricingProvider } from '../core/pricing.provider';
import { PricingResult } from '../core/types';

export class SimplePricingProvider extends BasePricingProvider {
  async calculatePrice(optionParams: any): Promise<PricingResult> {
    return {
      price: 0,
      greeks: {
        delta: 0.5,
        gamma: 0.1,
        theta: -0.05,
        vega: 0.2,
        rho: 0.01
      },
      parameters: optionParams,
      modelUsed: 'black-scholes',
      calculatedAt: new Date()
    };
  }

  async getHistoricalData(symbol: string, days: number): Promise<number[]> {
    return Array(days).fill(0).map(() => Math.random() * 100);
  }

  async getTopVolumeSymbols(days: number, limit: number): Promise<string[]> {
    return ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'].slice(0, limit);
  }
}
