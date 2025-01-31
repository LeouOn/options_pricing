"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePricingProvider = exports.PricingError = void 0;
const axios_1 = __importDefault(require("axios"));
class PricingError extends Error {
    provider;
    code;
    constructor(provider, message, code) {
        super(`[${provider}] ${message}`);
        this.provider = provider;
        this.code = code;
        this.name = 'PricingError';
    }
}
exports.PricingError = PricingError;
class BasePricingProvider {
    config;
    name;
    // Add concrete implementation class
    static create(config, name) {
        return new SimplePricingProvider(config, name);
    }
    httpClient;
    constructor(config, name) {
        this.config = config;
        this.name = name;
        this.httpClient = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: config.timeout || 5000,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.apiKey}`
            }
        });
    }
    async httpGet(endpoint, params) {
        try {
            const response = await this.httpClient.get(endpoint, {
                params,
                paramsSerializer: { indexes: null }
            });
            return response.data;
        }
        catch (error) {
            throw this.handleApiError(error);
        }
    }
    async httpPost(endpoint, data) {
        try {
            const response = await this.httpClient.post(endpoint, data);
            return response.data;
        }
        catch (error) {
            throw this.handleApiError(error);
        }
    }
    handleApiError(error) {
        if (axios_1.default.isAxiosError(error) && error.response) {
            return new PricingError(this.name, error.response.data?.message
                || error.message
                || 'Unknown API error', error.response.status.toString());
        }
        return new PricingError(this.name, axios_1.default.isAxiosError(error) ? error.message : 'Unknown API error');
    }
    async withRetry(fn, retries = this.config.retries || 3) {
        try {
            return await fn();
        }
        catch (error) {
            if (retries > 0) {
                return this.withRetry(fn, retries - 1);
            }
            throw error;
        }
    }
}
exports.BasePricingProvider = BasePricingProvider;
