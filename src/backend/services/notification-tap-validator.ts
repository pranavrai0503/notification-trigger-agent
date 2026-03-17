import { LandingPageConfig } from '../config/landing-pages.config';

export interface TapOptions {
  notificationElement: unknown;
  expectedPage: LandingPageConfig;
  waitTimeoutMs?: number;
}

export interface TapResult {
  tapped: boolean;
  navigatedCorrectly: boolean;
  actualScreen?: string;
  error?: string;
}

/**
 * Taps a push notification and validates the landing page navigation.
 */
export class NotificationTapValidator {
  /**
   * Taps a notification and validates that the correct page is displayed.
   * @param driver - Appium WebDriver instance
   * @param options - Tap and validation options
   */
  async tapAndValidate(driver: unknown, options: TapOptions): Promise<TapResult> {
    try {
      await this.tapNotification(driver, options.notificationElement);
      await this.waitForNavigation(driver);

      const validator = new LandingPageValidator();
      const result = await validator.validate(driver, options.expectedPage);

      return {
        tapped: true,
        navigatedCorrectly: result.valid,
        actualScreen: result.actualScreen,
      };
    } catch (error) {
      return {
        tapped: false,
        navigatedCorrectly: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Taps on the notification element.
   * @param driver - Appium WebDriver instance
   * @param element - The notification UI element to tap
   */
  async tapNotification(driver: unknown, element: unknown): Promise<void> {
    void driver;
    const el = element as Record<string, (...args: unknown[]) => Promise<void>>;
    await el['click']();
  }

  /**
   * Waits for the app to navigate after tapping a notification.
   * @param driver - Appium WebDriver instance
   */
  async waitForNavigation(driver: unknown): Promise<void> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<void>>;
    // Wait for any loading indicators to disappear
    try {
      await d['waitUntil'](
        async () => {
          const dd = driver as Record<string, (...args: unknown[]) => Promise<unknown[]>>;
          const loaders = await dd['findElements']('accessibility id', 'loading_indicator');
          return loaders.length === 0;
        }
      );
    } catch {
      // Timeout waiting — proceed anyway
    }
  }
}

export interface ValidationResult {
  valid: boolean;
  actualScreen?: string;
  missingElements?: string[];
  error?: string;
}

/**
 * Validates that the app has navigated to the expected landing page.
 */
export class LandingPageValidator {
  /**
   * Validates the current screen against an expected landing page config.
   * @param driver - Appium WebDriver instance
   * @param expectedPage - Expected page configuration
   */
  async validate(driver: unknown, expectedPage: LandingPageConfig): Promise<ValidationResult> {
    try {
      const titleOk = expectedPage.title
        ? await this.verifyTitle(driver, expectedPage.title)
        : true;

      const elementsOk = expectedPage.requiredElements
        ? await this.verifyElements(driver, expectedPage.requiredElements)
        : true;

      return {
        valid: titleOk && elementsOk,
        actualScreen: expectedPage.screenName,
        missingElements: [],
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Verifies the screen title matches the expected value.
   * @param driver - Appium WebDriver instance
   * @param expected - Expected title text
   */
  async verifyTitle(driver: unknown, expected: string): Promise<boolean> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<unknown[]>>;
    try {
      const titles = await d['findElements'](
        'xpath',
        `//*[contains(@text, '${expected}') or contains(@label, '${expected}')]`
      );
      return titles.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Verifies that all required accessibility-id selectors are present.
   * @param driver - Appium WebDriver instance
   * @param selectors - List of accessibility IDs to verify
   */
  async verifyElements(driver: unknown, selectors: string[]): Promise<boolean> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<unknown[]>>;
    const results = await Promise.all(
      selectors.map(async (selector) => {
        try {
          const elements = await d['findElements']('accessibility id', selector);
          return elements.length > 0;
        } catch {
          return false;
        }
      })
    );
    return results.every(Boolean);
  }
}
