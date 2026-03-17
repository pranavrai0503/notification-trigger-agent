export interface NotificationElement {
  title: string;
  body: string;
  element: unknown;
}

export interface VerifyOptions {
  platform: 'android' | 'ios';
  expectedPattern: string;
  timeoutMs?: number;
  captureScreenshot?: boolean;
}

export interface VerifyResult {
  found: boolean;
  notification?: NotificationElement;
  screenshotBase64?: string;
  error?: string;
}

/**
 * Verifies that a push notification appears in the device notification shade.
 */
export class NotificationVerifier {
  /**
   * Opens the notification shade and searches for a notification matching the pattern.
   * @param driver - Appium WebDriver instance
   * @param options - Verification options including platform and search pattern
   */
  async verify(driver: unknown, options: VerifyOptions): Promise<VerifyResult> {
    try {
      await this.openNotificationShade(driver, options.platform);
      const notification = await this.findNotification(driver, options.expectedPattern);

      let screenshotBase64: string | undefined;
      if (options.captureScreenshot) {
        screenshotBase64 = await this.captureScreenshot(driver);
      }

      return {
        found: notification !== null,
        notification: notification ?? undefined,
        screenshotBase64,
      };
    } catch (error) {
      return {
        found: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Opens the notification shade using platform-specific gestures.
   * @param driver - Appium WebDriver instance
   * @param platform - 'android' or 'ios'
   */
  async openNotificationShade(driver: unknown, platform: 'android' | 'ios'): Promise<void> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<void>>;
    if (platform === 'android') {
      await d['openNotifications']();
    } else {
      // iOS: swipe down from top of screen
      await d['execute']('mobile: swipe', [{ direction: 'down', element: null }]);
    }
  }

  /**
   * Searches for a notification matching the given regex/string pattern.
   * @param driver - Appium WebDriver instance
   * @param pattern - Text pattern to match notification title or body
   */
  async findNotification(driver: unknown, pattern: string): Promise<NotificationElement | null> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<unknown[]>>;
    try {
      const elements = await d['findElements']('xpath', `//*[contains(@text, '${pattern}')]`);
      if (elements.length === 0) return null;

      const el = elements[0] as Record<string, (...args: unknown[]) => Promise<string>>;
      const text = await el['getText']();
      return { title: text, body: text, element: elements[0] };
    } catch {
      return null;
    }
  }

  /**
   * Captures a base64-encoded screenshot of the current screen.
   * @param driver - Appium WebDriver instance
   */
  async captureScreenshot(driver: unknown): Promise<string> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<string>>;
    return d['takeScreenshot']();
  }
}
