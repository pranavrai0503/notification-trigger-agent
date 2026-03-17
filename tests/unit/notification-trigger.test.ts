import { NotificationTrigger, TriggerParams } from '../../src/backend/services/notification-trigger';
import { HttpClient } from '../../src/backend/utils/http-client';

jest.mock('../../src/backend/utils/http-client');
jest.mock('../../src/backend/config', () => ({
  getConfig: () => ({
    test: { defaultTimeoutMs: 30000, maxRetryAttempts: 3, retryDelayMs: 1000 },
    browserstack: { username: '', accessKey: '', apiUrl: '' },
    app: { packageAndroid: 'com.example.app', packageIOS: 'com.example.app', activityAndroid: '' },
  }),
}));

const MockHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe('NotificationTrigger', () => {
  let trigger: NotificationTrigger;
  let mockHttpClient: jest.Mocked<HttpClient>;

  const baseParsedCurl = {
    method: 'POST',
    url: 'https://api.example.com/notify',
    headers: { 'Content-Type': 'application/json' },
    body: { eventCode: 'PUSH_001', userId: 'user42' },
    eventCode: 'PUSH_001',
    userId: 'user42',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    MockHttpClient.mockImplementation(() => ({
      request: jest.fn(),
    } as unknown as HttpClient));
    mockHttpClient = new MockHttpClient() as jest.Mocked<HttpClient>;
    trigger = new NotificationTrigger(mockHttpClient);
  });

  describe('buildRequest()', () => {
    it('builds a valid AxiosRequestConfig from parsedCurl', () => {
      const params: TriggerParams = { parsedCurl: baseParsedCurl };
      const config = trigger.buildRequest(params);
      expect(config.method).toBe('POST');
      expect(config.url).toBe('https://api.example.com/notify');
      expect(config.headers).toEqual(baseParsedCurl.headers);
    });

    it('overrides userId in the body when provided', () => {
      const params: TriggerParams = { parsedCurl: baseParsedCurl, userId: 'newUser' };
      const config = trigger.buildRequest(params);
      expect((config.data as Record<string, unknown>)['userId']).toBe('newUser');
    });

    it('overrides eventCode in the body when provided', () => {
      const params: TriggerParams = { parsedCurl: baseParsedCurl, eventCode: 'NEW_EVENT' };
      const config = trigger.buildRequest(params);
      expect((config.data as Record<string, unknown>)['eventCode']).toBe('NEW_EVENT');
    });

    it('handles parsedCurl with no body', () => {
      const params: TriggerParams = {
        parsedCurl: { ...baseParsedCurl, body: null },
      };
      const config = trigger.buildRequest(params);
      expect(config.data).toBeUndefined();
    });
  });

  describe('executeRequest()', () => {
    it('returns success true on 2xx response', async () => {
      (mockHttpClient.request as jest.Mock).mockResolvedValue({
        status: 200,
        data: { message: 'ok' },
      });

      const result = await trigger.executeRequest({ method: 'POST', url: 'https://api.example.com' });
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.responseBody).toEqual({ message: 'ok' });
    });

    it('returns success false on 4xx axios error', async () => {
      const axiosError = Object.assign(new Error('Not Found'), {
        isAxiosError: true,
        response: { status: 404, data: { error: 'not found' } },
      });
      (mockHttpClient.request as jest.Mock).mockRejectedValue(axiosError);

      const result = await trigger.executeRequest({ method: 'GET', url: 'https://api.example.com' });
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it('returns status 0 on network error', async () => {
      (mockHttpClient.request as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await trigger.executeRequest({ method: 'POST', url: 'https://api.example.com' });
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(0);
      expect(result.error).toMatch(/ECONNREFUSED/);
    });
  });

  describe('trigger()', () => {
    it('combines buildRequest and executeRequest', async () => {
      (mockHttpClient.request as jest.Mock).mockResolvedValue({
        status: 201,
        data: { id: 'notif-1' },
      });

      const result = await trigger.trigger({ parsedCurl: baseParsedCurl });
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
    });
  });
});
