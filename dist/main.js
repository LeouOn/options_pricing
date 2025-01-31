"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config/config");
const simple_provider_1 = require("./providers/simple.provider");
async function main() {
    try {
        const config = (0, config_1.loadConfig)();
        const providers = config.providers
            .filter(p => p.enabled)
            .map(p => new simple_provider_1.SimplePricingProvider(p, p.name));
        console.log(`Starting options pricing service with ${providers.length} providers`);
        // TODO: Add API server initialization
        // TODO: Implement provider health checks
        // TODO: Add websocket support for real-time updates
        console.log('Service ready - Press CTRL+C to exit');
    }
    catch (error) {
        console.error('Failed to start service:');
        console.error(error);
        process.exit(1);
    }
}
main();
