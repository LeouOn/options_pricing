import axios from 'axios';
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError
} from 'axios';

import { OptionParameters, PricingResult } from './types';

export interface PricingProvider {
  readonly name: string;
  calculatePrice(optionParams: OptionParameters): Promise<PricingResult>;
  getHistoricalData(symbol: string, days: number): Promise<number[]>;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
  cacheTtl?: number;
}

export class PricingError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
    public readonly code?: string
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'PricingError';
  }
}

export abstract class BasePricingProvider implements PricingProvider {
  // Add concrete implementation class
  static create(config: ApiConfig, name: string): PricingProvider {
    return new SimplePricingProvider(config, name);
  }
  protected readonly httpClient: AxiosInstance;
  
  constructor(
    protected readonly config: ApiConfig,
    public readonly name: string
  ) {
    this.httpClient = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 5000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      }
    });
  }

  abstract calculatePrice(optionParams: OptionParameters): Promise<PricingResult>;
  abstract getHistoricalData(symbol: string, days: number): Promise<number[]>;

  protected async httpGet<T>(endpoint: string, params?: object): Promise<T> {
    try {
      const response = await this.httpClient.get<T>(endpoint, {
        params,
        paramsSerializer: { indexes: null }
      });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  protected async httpPost<T>(endpoint: string, data: object): Promise<T> {
    try {
      const response = await this.httpClient.post<T>(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  private handleApiError(error: unknown): PricingError {
    if (axios.isAxiosError(error) && error.response) {
      return new PricingError(
        this.name,
        (error.response.data as { message?: string })?.message
          || error.message
          || 'Unknown API error',
        error.response.status.toString()
      );
    }
    return new PricingError(
      this.name,
      axios.isAxiosError(error) ? error.message : 'Unknown API error'
    );
  }

  protected async withRetry<T>(
    fn: () => Promise<T>,
    retries = this.config.retries || 3
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        return this.withRetry(fn, retries - 1);
      }
      throw error;
    }
  }
}