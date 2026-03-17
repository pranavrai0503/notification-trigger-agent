import axios, { AxiosRequestConfig } from 'axios';
import { ParsedCurl } from './curl-parser';
import { HttpClient } from '../utils/http-client';

export interface TriggerParams {
  parsedCurl: ParsedCurl;
  userId?: string;
  eventCode?: string;
}

export interface TriggerResult {
  success: boolean;
  statusCode: number;
  responseBody: unknown;
  durationMs: number;
  error?: string;
}

/**
 * Executes the push notification HTTP trigger and captures results.
 */
export class NotificationTrigger {
  private readonly httpClient: HttpClient;

  constructor(httpClient?: HttpClient) {
    this.httpClient = httpClient ?? new HttpClient();
  }

  /**
   * Triggers a notification by executing the HTTP request derived from parsedCurl.
   * @param params - Trigger parameters including parsed curl and optional overrides
   */
  async trigger(params: TriggerParams): Promise<TriggerResult> {
    const config = this.buildRequest(params);
    return this.executeRequest(config);
  }

  /**
   * Builds an AxiosRequestConfig from TriggerParams.
   * @param params - Trigger parameters
   */
  buildRequest(params: TriggerParams): AxiosRequestConfig {
    const { parsedCurl, userId, eventCode } = params;

    const body = parsedCurl.body ? { ...parsedCurl.body } : undefined;
    if (body && userId) (body as Record<string, unknown>)['userId'] = userId;
    if (body && eventCode) (body as Record<string, unknown>)['eventCode'] = eventCode;

    return {
      method: parsedCurl.method as AxiosRequestConfig['method'],
      url: parsedCurl.url,
      headers: parsedCurl.headers,
      data: body,
      timeout: 30000,
    };
  }

  /**
   * Executes the HTTP request and returns a structured TriggerResult.
   * @param config - AxiosRequestConfig to execute
   */
  async executeRequest(config: AxiosRequestConfig): Promise<TriggerResult> {
    const start = Date.now();
    try {
      const response = await this.httpClient.request(config);
      return {
        success: response.status >= 200 && response.status < 300,
        statusCode: response.status,
        responseBody: response.data,
        durationMs: Date.now() - start,
      };
    } catch (error) {
      const durationMs = Date.now() - start;
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          statusCode: error.response.status,
          responseBody: error.response.data,
          durationMs,
          error: error.message,
        };
      }
      return {
        success: false,
        statusCode: 0,
        responseBody: null,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
