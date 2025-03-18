import { loadConfig } from './config/config';
import { SimplePricingProvider } from './providers/simple.provider';
import { OpportunityFinder } from './analysis/screener';
import { PricingResult } from './core/types';

async function main() {
  try {
    const config = loadConfig();
    const providers = config.providers
      .filter(p => p.enabled)
      .map(p => new SimplePricingProvider(p, p.name));

    console.log(`Starting options pricing service with ${providers.length} providers`);
    
    if (providers.length === 0) {
      console.error('No enabled providers. Exiting.');
      process.exit(1);
    }

    const days = 1;
    const limit = 10;
    const symbols = await providers[0].getTopVolumeSymbols(days, limit);
    console.log(`Top ${limit} symbols in the past ${days} day(s):`, symbols);

    const opportunityFinder = new OpportunityFinder();
    const options: PricingResult[] = [];

    for (const symbol of symbols) {
      const underlyingPrice = 100;
      const strikePrices = [90, 100, 110];
      const expirations = [0.5, 1];

      for (const strike of strikePrices) {
        for (const expiration of expirations) {
          const optionParams = {
            underlyingPrice,
            strikePrice: strike,
            timeToExpiration: expiration,
            volatility: 0.2,
            riskFreeRate: 0.01,
            dividendYield: 0
          };

          const pricingResult = await providers[0].calculatePrice(optionParams);
          options.push(pricingResult);
        }
      }
    }

    const opportunities = opportunityFinder.findPremiumOpportunities(options);
    console.log('Found opportunities:', opportunities);

  } catch (error) {
    console.error('Failed to start service:');
    console.error(error);
    process.exit(1);
  }
}

main();
