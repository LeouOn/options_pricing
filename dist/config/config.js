"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfig = exports.ProviderConfig = void 0;
exports.loadConfig = loadConfig;
const class_transformer_1 = require("class-transformer");
const dotenv_1 = __importDefault(require("dotenv"));
const joi_1 = __importDefault(require("joi"));
dotenv_1.default.config();
class ProviderConfig {
    name;
    apiKey;
    baseUrl;
    enabled;
    priority;
    timeout = 5000;
    cacheTtl = 3600;
}
exports.ProviderConfig = ProviderConfig;
class AppConfig {
    providers;
    cacheTtl;
    maxRetries;
    defaultModel;
    static validate(config) {
        const schema = joi_1.default.object({
            providers: joi_1.default.array().items(joi_1.default.object({
                name: joi_1.default.string().required(),
                apiKey: joi_1.default.string().required(),
                baseUrl: joi_1.default.string().uri().required(),
                enabled: joi_1.default.boolean().default(true),
                priority: joi_1.default.number().min(0).max(10).default(5),
                timeout: joi_1.default.number().min(1000).default(5000),
                cacheTtl: joi_1.default.number().min(60).default(3600)
            })).min(1).required(),
            cacheTtl: joi_1.default.number().min(60).default(3600),
            maxRetries: joi_1.default.number().min(0).max(10).default(3),
            defaultModel: joi_1.default.string().valid('black-scholes', 'binomial', 'monte-carlo').default('black-scholes')
        });
        const { error } = schema.validate(config);
        if (error) {
            throw new Error(`Config validation error: ${error.message}`);
        }
    }
}
exports.AppConfig = AppConfig;
function loadConfig() {
    const config = (0, class_transformer_1.plainToClass)(AppConfig, {
        providers: [
            {
                name: 'alpha_vantage',
                apiKey: process.env.ALPHA_VANTAGE_API_KEY,
                baseUrl: 'https://www.alphavantage.co/query',
                enabled: true,
                priority: 1
            },
            {
                name: 'polygon',
                apiKey: process.env.POLYGON_API_KEY,
                baseUrl: 'https://api.polygon.io/v2',
                enabled: true,
                priority: 2
            }
        ],
        cacheTtl: parseInt(process.env.PRICING_CACHE_TTL || '3600', 10),
        maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
        defaultModel: process.env.DEFAULT_MODEL || 'black-scholes'
    });
    AppConfig.validate(config);
    return config;
}
