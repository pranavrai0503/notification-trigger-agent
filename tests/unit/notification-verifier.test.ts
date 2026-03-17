import { NotificationVerifier, VerifyOptions } from '../../src/backend/services/notification-verifier';

describe('NotificationVerifier', () => {
  let verifier: NotificationVerifier;
  let mockDriver: Record<string, jest.Mock>;
  let mockElement: Record<string, jest.Mock>;

  beforeEach(() => {
    verifier = new NotificationVerifier();
    mockElement = { getText: jest.fn().mockResolvedValue('Test Notification') };
    mockDriver = {
      openNotifications: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn().mockResolvedValue(undefined),
      findElements: jest.fn().mockResolvedValue([mockElement]),
      takeScreenshot: jest.fn().mockResolvedValue('base64screenshot'),
    };
  });

  describe('openNotificationShade()', () => {
    it('calls openNotifications on Android', async () => {
      await verifier.openNotificationShade(mockDriver, 'android');
      expect(mockDriver.openNotifications).toHaveBeenCalled();
    });

    it('calls swipe execute on iOS', async () => {
      await verifier.openNotificationShade(mockDriver, 'ios');
      expect(mockDriver.execute).toHaveBeenCalledWith(
        'mobile: swipe',
        expect.any(Array)
      );
    });
  });

  describe('findNotification()', () => {
    it('returns NotificationElement when found', async () => {
      const result = await verifier.findNotification(mockDriver, 'Test');
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Test Notification');
    });

    it('returns null when no elements found', async () => {
      mockDriver.findElements.mockResolvedValue([]);
      const result = await verifier.findNotification(mockDriver, 'Nope');
      expect(result).toBeNull();
    });

    it('returns null on driver error', async () => {
      mockDriver.findElements.mockRejectedValue(new Error('driver error'));
      const result = await verifier.findNotification(mockDriver, 'Test');
      expect(result).toBeNull();
    });
  });

  describe('captureScreenshot()', () => {
    it('returns base64 screenshot from driver', async () => {
      const screenshot = await verifier.captureScreenshot(mockDriver);
      expect(screenshot).toBe('base64screenshot');
    });
  });

  describe('verify()', () => {
    const options: VerifyOptions = {
      platform: 'android',
      expectedPattern: 'Test',
      captureScreenshot: true,
    };

    it('returns found:true when notification exists', async () => {
      const result = await verifier.verify(mockDriver, options);
      expect(result.found).toBe(true);
      expect(result.screenshotBase64).toBe('base64screenshot');
    });

    it('returns found:false when notification is missing', async () => {
      mockDriver.findElements.mockResolvedValue([]);
      const result = await verifier.verify(mockDriver, { ...options, captureScreenshot: false });
      expect(result.found).toBe(false);
    });

    it('returns error when driver throws', async () => {
      mockDriver.openNotifications.mockRejectedValue(new Error('shade error'));
      const result = await verifier.verify(mockDriver, options);
      expect(result.found).toBe(false);
      expect(result.error).toMatch(/shade error/);
    });

    it('does not capture screenshot when captureScreenshot is false', async () => {
      const result = await verifier.verify(mockDriver, { ...options, captureScreenshot: false });
      expect(result.screenshotBase64).toBeUndefined();
    });
  });
});
