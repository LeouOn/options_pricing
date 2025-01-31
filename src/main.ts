import { loadConfig } from './config/config';
import { SimplePricingProvider } from './providers/simple.provider';

async function main() {
  try {
    const config = loadConfig();
    const providers = config.providers
      .filter(p => p.enabled)
      .map(p => new SimplePricingProvider(p, p.name));

    console.log(`Starting options pricing service with ${providers.length} providers`);
    
    // TODO: Add API server initialization
    // TODO: Implement provider health checks
    // TODO: Add websocket support for real-time updates
    
    console.log('Service ready - Press CTRL+C to exit');
    
  } catch (error) {
    console.error('Failed to start service:');
    console.error(error);
    process.exit(1);
  }
}

main();