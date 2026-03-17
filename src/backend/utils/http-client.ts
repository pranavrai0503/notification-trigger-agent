import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getConfig } from '../config';

/**
 * HTTP client wrapper with configurable retry logic and timeout handling.
 */
export class HttpClient {
  private readonly client: AxiosInstance;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(maxRetries?: number, retryDelay?: number) {
    const config = getConfig();
    this.maxRetries = maxRetries ?? config.test.maxRetryAttempts;
    this.retryDelay = retryDelay ?? config.test.retryDelayMs;

    this.client = axios.create({
      timeout: config.test.defaultTimeoutMs,
    });
  }

  /**
   * Executes an HTTP request with retry on network errors or 5xx responses.
   * @param config - Axios request configuration
   */
  async request<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    let lastError: Error = new Error('No attempts made');

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.request<T>(config);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const isRetryable =
          axios.isAxiosError(error) &&
          (!error.response || error.response.status >= 500);

        if (!isRetryable || attempt === this.maxRetries) throw lastError;

        await this.delay(this.retryDelay * Math.pow(2, attempt));
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
