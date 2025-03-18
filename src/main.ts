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
    const optionParamsConfig = config.optionParameters;
    const options: PricingResult[] = [];
    const opportunityFinder = new OpportunityFinder(
      config.opportunityFinder.volatilityThreshold,
      config.opportunityFinder.minDaysToExpiry,
      config.opportunityFinder.targetDeltaRange
    );

    for (const provider of providers) {
      try {
        const symbols = await provider.getTopVolumeSymbols(days, limit);
        console.log(`Top ${limit} symbols from ${provider.name} in the past ${days} day(s):`, symbols);

        for (const symbol of symbols) {
          try {
            const historicalData = await provider.getHistoricalData(symbol, 1);
            const underlyingPrice = historicalData[0];
            for (const strike of optionParamsConfig.strikePrices) {
              for (const expiration of optionParamsConfig.expirations) {
                const optionParams = {
                  underlyingPrice,
                  strikePrice: strike,
                  timeToExpiration: expiration,
                  volatility: optionParamsConfig.volatility,
                  riskFreeRate: optionParamsConfig.riskFreeRate,
                  dividendYield: optionParamsConfig.dividendYield
                };

                const pricingResult = await provider.calculatePrice(optionParams);
                options.push(pricingResult);
              }
            }
          } catch (error) {
            console.error(`Error processing symbol ${symbol} with provider ${provider.name}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error fetching data from provider ${provider.name}:`, error);
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
