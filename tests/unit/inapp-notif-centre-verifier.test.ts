import { InAppNotifCentreVerifier } from '../../src/backend/services/inapp-notif-centre-verifier';

describe('InAppNotifCentreVerifier', () => {
  let verifier: InAppNotifCentreVerifier;
  let mockBell: Record<string, jest.Mock>;
  let mockDriver: Record<string, jest.Mock>;

  beforeEach(() => {
    verifier = new InAppNotifCentreVerifier();
    mockBell = { click: jest.fn().mockResolvedValue(undefined) };
    mockDriver = {
      findElements: jest.fn().mockResolvedValue([mockBell]),
    };
  });

  describe('navigateToNotificationCentre()', () => {
    it('clicks notification_bell when found', async () => {
      mockDriver.findElements = jest.fn().mockImplementation((_strategy: string, id: string) => {
        if (id === 'notification_bell') return Promise.resolve([mockBell]);
        return Promise.resolve([]);
      });
      await verifier.navigateToNotificationCentre(mockDriver);
      expect(mockBell.click).toHaveBeenCalled();
    });

    it('falls back to notification_icon when bell not found', async () => {
      const mockIcon = { click: jest.fn().mockResolvedValue(undefined) };
      mockDriver.findElements = jest.fn().mockImplementation((_strategy: string, id: string) => {
        if (id === 'notification_icon') return Promise.resolve([mockIcon]);
        return Promise.resolve([]);
      });
      await verifier.navigateToNotificationCentre(mockDriver);
      expect(mockIcon.click).toHaveBeenCalled();
    });

    it('throws when navigation fails', async () => {
      mockDriver.findElements = jest.fn().mockRejectedValue(new Error('driver error'));
      await expect(verifier.navigateToNotificationCentre(mockDriver)).rejects.toThrow(
        'Could not navigate to notification centre'
      );
    });
  });

  describe('findNotificationInCentre()', () => {
    it('returns true when notification element is found', async () => {
      mockDriver.findElements = jest.fn().mockResolvedValue([{ id: 'notif' }]);
      const result = await verifier.findNotificationInCentre(mockDriver, 'Hello');
      expect(result).toBe(true);
    });

    it('returns false when no element is found', async () => {
      mockDriver.findElements = jest.fn().mockResolvedValue([]);
      const result = await verifier.findNotificationInCentre(mockDriver, 'Missing');
      expect(result).toBe(false);
    });

    it('returns false on driver error', async () => {
      mockDriver.findElements = jest.fn().mockRejectedValue(new Error('error'));
      const result = await verifier.findNotificationInCentre(mockDriver, 'Test');
      expect(result).toBe(false);
    });
  });

  describe('verify()', () => {
    it('returns found:true when notification is in centre', async () => {
      mockDriver.findElements = jest.fn().mockImplementation((_strategy: string, id: string) => {
        if (id === 'notification_bell') return Promise.resolve([mockBell]);
        return Promise.resolve([{ id: 'notif' }]);
      });

      const result = await verifier.verify(mockDriver, {
        platform: 'android',
        expectedPattern: 'Hello',
      });
      expect(result.found).toBe(true);
    });

    it('returns error when navigation throws', async () => {
      mockDriver.findElements = jest.fn().mockRejectedValue(new Error('nav error'));
      const result = await verifier.verify(mockDriver, {
        platform: 'ios',
        expectedPattern: 'Test',
      });
      expect(result.found).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
