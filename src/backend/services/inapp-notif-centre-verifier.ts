export interface InAppVerifyOptions {
  platform: 'android' | 'ios';
  expectedPattern: string;
  navigationPath?: string[];
  timeoutMs?: number;
}

export interface InAppVerifyResult {
  found: boolean;
  notificationText?: string;
  error?: string;
}

/**
 * Verifies push notifications appear in the app's in-app notification centre.
 */
export class InAppNotifCentreVerifier {
  /**
   * Navigates to the in-app notification centre and verifies the notification.
   * @param driver - Appium WebDriver instance
   * @param options - Verification options
   */
  async verify(driver: unknown, options: InAppVerifyOptions): Promise<InAppVerifyResult> {
    try {
      await this.navigateToNotificationCentre(driver);
      const found = await this.findNotificationInCentre(driver, options.expectedPattern);

      return { found, notificationText: options.expectedPattern };
    } catch (error) {
      return {
        found: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Navigates to the app's notification centre screen.
   * @param driver - Appium WebDriver instance
   */
  async navigateToNotificationCentre(driver: unknown): Promise<void> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<unknown[]>>;
    try {
      const bells = await d['findElements']('accessibility id', 'notification_bell');
      if (bells.length > 0) {
        const bell = bells[0] as Record<string, (...args: unknown[]) => Promise<void>>;
        await bell['click']();
      } else {
        const icons = await d['findElements']('accessibility id', 'notification_icon');
        if (icons.length > 0) {
          const icon = icons[0] as Record<string, (...args: unknown[]) => Promise<void>>;
          await icon['click']();
        }
      }
    } catch (error) {
      throw new Error(`Could not navigate to notification centre: ${String(error)}`);
    }
  }

  /**
   * Searches the in-app notification list for an item matching the pattern.
   * @param driver - Appium WebDriver instance
   * @param pattern - Text pattern to search for
   */
  async findNotificationInCentre(driver: unknown, pattern: string): Promise<boolean> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<unknown[]>>;
    try {
      const elements = await d['findElements'](
        'xpath',
        `//*[contains(@text, '${pattern}') or contains(@content-desc, '${pattern}')]`
      );
      return elements.length > 0;
    } catch {
      return false;
    }
  }
}
