export type OptionType = 'call' | 'put';
export type PricingModel = 'black-scholes' | 'binomial' | 'monte-carlo';

export interface OptionParameters {
  underlyingPrice: number;
  strikePrice: number;
  timeToExpiration: number; // In years
  volatility?: number; // Optional if provider calculates
  riskFreeRate?: number; // Optional if provider calculates
  dividendYield?: number;
}

export interface PricingResult {
  price: number;
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };
  parameters: OptionParameters;
  modelUsed: PricingModel;
  calculatedAt: Date;
}