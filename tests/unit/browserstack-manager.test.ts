import axios from 'axios';
import { BrowserStackManager } from '../../src/backend/services/browserstack-manager';

jest.mock('axios');
jest.mock('../../src/backend/config', () => ({
  getConfig: () => ({
    browserstack: {
      username: 'test-user',
      accessKey: 'test-key',
      apiUrl: 'https://api-cloud.browserstack.com',
    },
    app: { packageAndroid: 'com.example.app', packageIOS: 'com.example.app', activityAndroid: '' },
    test: { defaultTimeoutMs: 30000, sessionTimeoutMs: 300000, maxRetryAttempts: 3, retryDelayMs: 1000 },
  }),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BrowserStackManager', () => {
  let manager: BrowserStackManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new BrowserStackManager();
  });

  describe('createSession()', () => {
    it('creates a session and returns the sessionId', async () => {
      mockedAxios.post = jest.fn().mockResolvedValue({ data: { sessionId: 'sess-123' } });

      const sessionId = await manager.createSession({
        device: 'Samsung Galaxy S21',
        os_version: '11.0',
        app: 'bs://abc123',
        project: 'Test',
        build: '1.0',
        name: 'unit-test',
      });

      expect(sessionId).toBe('sess-123');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api-cloud.browserstack.com/wd/hub/session',
        expect.objectContaining({ desiredCapabilities: expect.any(Object) }),
        expect.any(Object)
      );
    });

    it('propagates errors from axios', async () => {
      mockedAxios.post = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        manager.createSession({ device: 'device', os_version: '11', app: 'bs://x', project: 'p', build: '1', name: 'n' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('closeSession()', () => {
    it('calls DELETE on the session endpoint', async () => {
      mockedAxios.delete = jest.fn().mockResolvedValue({ data: {} });

      await manager.closeSession('sess-456');

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'https://api-cloud.browserstack.com/wd/hub/session/sess-456',
        expect.any(Object)
      );
    });
  });

  describe('getSessionStatus()', () => {
    it('returns the session status', async () => {
      mockedAxios.get = jest.fn().mockResolvedValue({
        data: { automation_session: { status: 'running' } },
      });

      const status = await manager.getSessionStatus('sess-789');
      expect(status).toBe('running');
    });
  });

  describe('provisionDevice()', () => {
    it('returns a WebDriverSession with the created sessionId', async () => {
      mockedAxios.post = jest.fn().mockResolvedValue({ data: { sessionId: 'dev-sess-001' } });

      const session = await manager.provisionDevice({
        device: 'iPhone 13',
        os_version: '15',
        app: 'bs://ios123',
        project: 'iOS Tests',
        build: '2.0',
        name: 'ios-test',
      });

      expect(session.sessionId).toBe('dev-sess-001');
      expect(session.createdAt).toBeInstanceOf(Date);
    });
  });
});
