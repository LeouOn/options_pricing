import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';
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

  static validate(config: AppConfig) {
    const schema = Joi.object({
      providers: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          apiKey: Joi.string().required(),
          baseUrl: Joi.string().uri().required(),
          enabled: Joi.boolean().default(true),
          priority: Joi.number().min(0).max(10).default(5),
          timeout: Joi.number().min(1000).default(5000),
          cacheTtl: Joi.number().min(60).default(3600)
        })
      ).min(1).required(),
      cacheTtl: Joi.number().min(60).default(3600),
      maxRetries: Joi.number().min(0).max(10).default(3),
      defaultModel: Joi.string().valid('black-scholes', 'binomial', 'monte-carlo').default('black-scholes')
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
    defaultModel: process.env.DEFAULT_MODEL || 'black-scholes'
  });

  AppConfig.validate(config);
  return config;
}