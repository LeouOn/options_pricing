import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

export class ProviderConfig {
  name!: string;
  apiKey!: string;
  baseUrl!: string;
  enabled!: boolean;
  priority!: number;
  timeout?: number = 5000;
  cacheTtl?: number = 3600;
}

export class AppConfig {
  providers!: ProviderConfig[];
  cacheTtl!: number;
  maxRetries!: number;
  defaultModel!: string;
  opportunityFinder?: {
    volatilityThreshold: number;
    minDaysToExpiry: number;
    targetDeltaRange: [number, number];
  } = {
    volatilityThreshold: 0.3,
    minDaysToExpiry: 14,
    targetDeltaRange: [0.3, 0.7]
  };
  optionParameters?: {
    strikePrices: number[];
    expirations: number[];
    volatility: number;
    riskFreeRate: number;
    dividendYield: number;
  } = {
    strikePrices: [90, 100, 110],
    expirations: [0.5, 1],
    volatility: 0.2,
    riskFreeRate: 0.01,
    dividendYield: 0
  };

  static validate(config: AppConfig) {
    const schema = Joi.object({
      providers: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required(),
            apiKey: Joi.string().required(),
            baseUrl: Joi.string().uri().required(),
            enabled: Joi.boolean().default(true),
            priority: Joi.number().min(0).max(10).default(5),
            timeout: Joi.number().min(1000).default(5000),
            cacheTtl: Joi.number().min(60).default(3600)
          })
        )
        .min(1)
        .required(),
      cacheTtl: Joi.number().min(60).default(3600),
      maxRetries: Joi.number().min(0).max(10).default(3),
      defaultModel: Joi.string()
        .valid('black-scholes', 'binomial', 'monte-carlo')
        .default('black-scholes'),
      opportunityFinder: Joi.object({
        volatilityThreshold: Joi.number().min(0).max(1).default(0.3),
        minDaysToExpiry: Joi.number().min(1).max(365).default(14),
        targetDeltaRange: Joi.array()
          .length(2)
          .ordered(Joi.number().min(0).max(1), Joi.number().min(0).max(1))
          .default([0.3, 0.7])
      }).default(),
      optionParameters: Joi.object({
        strikePrices: Joi.array().items(Joi.number()).min(1).default([90, 100, 110]),
        expirations: Joi.array().items(Joi.number()).min(1).default([0.5, 1]),
        volatility: Joi.number().min(0).default(0.2),
        riskFreeRate: Joi.number().min(0).default(0.01),
        dividendYield: Joi.number().min(0).default(0)
      }).default()
    });

    const { error } = schema.validate(config);
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
  }
}

export function loadConfig(): AppConfig {
  const config = plainToClass(AppConfig, {
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
    defaultModel: process.env.DEFAULT_MODEL || 'black-scholes',
    opportunityFinder: {
      volatilityThreshold: parseFloat(process.env.OPPORTUNITY_VOLATILITY_THRESHOLD || '0.3'),
      minDaysToExpiry: parseInt(process.env.OPPORTUNITY_MIN_DAYS || '14', 10),
      targetDeltaRange: [parseFloat(process.env.OPPORTUNITY_DELTA_MIN || '0.3'), parseFloat(process.env.OPPORTUNITY_DELTA_MAX || '0.7')]
    },
    optionParameters: {
      strikePrices: process.env.STRIKE_PRICES ? JSON.parse(process.env.STRIKE_PRICES) : [90, 100, 110],
      expirations: process.env.EXPIRATIONS ? JSON.parse(process.env.EXPIRATIONS) : [0.5, 1],
      volatility: parseFloat(process.env.VOLATILITY || '0.2'),
      riskFreeRate: parseFloat(process.env.RISK_FREE_RATE || '0.01'),
      dividendYield: parseFloat(process.env.DIVIDEND_YIELD || '0')
    }
  });

  AppConfig.validate(config);
  return config;
}
