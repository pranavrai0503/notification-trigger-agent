import {
  NotificationTapValidator,
  LandingPageValidator,
} from '../../src/backend/services/notification-tap-validator';
import { LandingPageConfig } from '../../src/backend/config/landing-pages.config';

const mockPage: LandingPageConfig = {
  eventCode: 'PROMO_OFFER',
  screenName: 'ProductPage',
  title: 'Product Details',
  requiredElements: ['add_to_cart', 'product_title'],
};

describe('LandingPageValidator', () => {
  let validator: LandingPageValidator;
  let mockDriver: Record<string, jest.Mock>;

  beforeEach(() => {
    validator = new LandingPageValidator();
    mockDriver = {
      findElements: jest.fn().mockResolvedValue([{ id: 'el' }]),
    };
  });

  describe('verifyTitle()', () => {
    it('returns true when title element found', async () => {
      mockDriver.findElements.mockResolvedValue([{ id: 'title' }]);
      const result = await validator.verifyTitle(mockDriver, 'Product Details');
      expect(result).toBe(true);
    });

    it('returns false when title element not found', async () => {
      mockDriver.findElements.mockResolvedValue([]);
      const result = await validator.verifyTitle(mockDriver, 'Missing Title');
      expect(result).toBe(false);
    });

    it('returns false on driver error', async () => {
      mockDriver.findElements.mockRejectedValue(new Error('driver error'));
      const result = await validator.verifyTitle(mockDriver, 'Title');
      expect(result).toBe(false);
    });
  });

  describe('verifyElements()', () => {
    it('returns true when all selectors are present', async () => {
      mockDriver.findElements.mockResolvedValue([{ id: 'el' }]);
      const result = await validator.verifyElements(mockDriver, ['btn1', 'btn2']);
      expect(result).toBe(true);
    });

    it('returns false when at least one selector is missing', async () => {
      mockDriver.findElements
        .mockResolvedValueOnce([{ id: 'el' }])
        .mockResolvedValueOnce([]);
      const result = await validator.verifyElements(mockDriver, ['present', 'missing']);
      expect(result).toBe(false);
    });

    it('returns true for empty selectors array', async () => {
      const result = await validator.verifyElements(mockDriver, []);
      expect(result).toBe(true);
    });
  });

  describe('validate()', () => {
    it('returns valid:true when title and elements match', async () => {
      mockDriver.findElements.mockResolvedValue([{ id: 'el' }]);
      const result = await validator.validate(mockDriver, mockPage);
      expect(result.valid).toBe(true);
      expect(result.actualScreen).toBe('ProductPage');
    });

    it('returns valid:false when title check fails', async () => {
      mockDriver.findElements.mockResolvedValue([]);
      const result = await validator.validate(mockDriver, mockPage);
      expect(result.valid).toBe(false);
    });

    it('returns valid:true when no title and no required elements', async () => {
      const result = await validator.validate(mockDriver, { eventCode: 'TEST', screenName: 'Home' });
      expect(result.valid).toBe(true);
    });
  });
});

describe('NotificationTapValidator', () => {
  let tapValidator: NotificationTapValidator;
  let mockDriver: Record<string, jest.Mock>;
  let mockElement: Record<string, jest.Mock>;

  beforeEach(() => {
    tapValidator = new NotificationTapValidator();
    mockElement = { click: jest.fn().mockResolvedValue(undefined) };
    mockDriver = {
      waitUntil: jest.fn().mockResolvedValue(undefined),
      findElements: jest.fn().mockResolvedValue([{ id: 'el' }]),
    };
  });

  describe('tapNotification()', () => {
    it('calls click on the notification element', async () => {
      await tapValidator.tapNotification(mockDriver, mockElement);
      expect(mockElement.click).toHaveBeenCalled();
    });
  });

  describe('tapAndValidate()', () => {
    it('returns tapped:true on success', async () => {
      const result = await tapValidator.tapAndValidate(mockDriver, {
        notificationElement: mockElement,
        expectedPage: mockPage,
      });
      expect(result.tapped).toBe(true);
    });

    it('returns tapped:false on element click error', async () => {
      mockElement.click.mockRejectedValue(new Error('click failed'));
      const result = await tapValidator.tapAndValidate(mockDriver, {
        notificationElement: mockElement,
        expectedPage: mockPage,
      });
      expect(result.tapped).toBe(false);
      expect(result.error).toMatch(/click failed/);
    });
  });
});
