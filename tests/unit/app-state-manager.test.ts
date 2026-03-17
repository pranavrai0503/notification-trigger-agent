import { AppStateManager } from '../../src/backend/services/app-state-manager';
import { AppState } from '../../src/backend/types/app-state';

jest.mock('../../src/backend/config', () => ({
  getConfig: () => ({
    app: { packageAndroid: 'com.example.app', packageIOS: 'com.example.app', activityAndroid: '' },
    browserstack: { username: '', accessKey: '', apiUrl: '' },
    test: { defaultTimeoutMs: 30000, sessionTimeoutMs: 300000, maxRetryAttempts: 3, retryDelayMs: 1000 },
  }),
}));

describe('AppStateManager', () => {
  let manager: AppStateManager;
  let mockDriver: Record<string, jest.Mock>;

  beforeEach(() => {
    manager = new AppStateManager();
    mockDriver = {
      activateApp: jest.fn().mockResolvedValue(undefined),
      background: jest.fn().mockResolvedValue(undefined),
      terminateApp: jest.fn().mockResolvedValue(undefined),
      queryAppState: jest.fn().mockResolvedValue(4),
    };
  });

  describe('setForeground()', () => {
    it('calls activateApp with the android package', async () => {
      await manager.setForeground(mockDriver);
      expect(mockDriver.activateApp).toHaveBeenCalledWith('com.example.app');
    });
  });

  describe('setBackground()', () => {
    it('calls background with the given seconds', async () => {
      await manager.setBackground(mockDriver, 5);
      expect(mockDriver.background).toHaveBeenCalledWith(5);
    });
  });

  describe('killApp()', () => {
    it('calls terminateApp with the android package', async () => {
      await manager.killApp(mockDriver);
      expect(mockDriver.terminateApp).toHaveBeenCalledWith('com.example.app');
    });
  });

  describe('getState()', () => {
    it('returns FOREGROUND when queryAppState returns 4', async () => {
      mockDriver.queryAppState.mockResolvedValue(4);
      expect(await manager.getState(mockDriver)).toBe(AppState.FOREGROUND);
    });

    it('returns BACKGROUND when queryAppState returns 2', async () => {
      mockDriver.queryAppState.mockResolvedValue(2);
      expect(await manager.getState(mockDriver)).toBe(AppState.BACKGROUND);
    });

    it('returns BACKGROUND when queryAppState returns 3', async () => {
      mockDriver.queryAppState.mockResolvedValue(3);
      expect(await manager.getState(mockDriver)).toBe(AppState.BACKGROUND);
    });

    it('returns KILLED when queryAppState returns 1', async () => {
      mockDriver.queryAppState.mockResolvedValue(1);
      expect(await manager.getState(mockDriver)).toBe(AppState.KILLED);
    });

    it('returns KILLED when queryAppState returns 0', async () => {
      mockDriver.queryAppState.mockResolvedValue(0);
      expect(await manager.getState(mockDriver)).toBe(AppState.KILLED);
    });

    it('returns UNKNOWN on error', async () => {
      mockDriver.queryAppState.mockRejectedValue(new Error('driver error'));
      expect(await manager.getState(mockDriver)).toBe(AppState.UNKNOWN);
    });
  });
});
