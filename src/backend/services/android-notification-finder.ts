import { NotificationElement } from './notification-verifier';

/**
 * Android-specific notification locator using resource IDs and XPath.
 */
export class AndroidNotificationFinder {
  /**
   * Opens the Android notification shade.
   * @param driver - Appium WebDriver instance
   */
  async openShade(driver: unknown): Promise<void> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<void>>;
    await d['openNotifications']();
  }

  /**
   * Finds a notification in the Android notification shade by text pattern.
   * @param driver - Appium WebDriver instance
   * @param pattern - Text to search for in notification title or body
   */
  async find(driver: unknown, pattern: string): Promise<NotificationElement | null> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<unknown[]>>;
    const selectors = [
      `//android.widget.TextView[contains(@text, '${pattern}')]`,
      `//*[@resource-id='android:id/title'][contains(@text, '${pattern}')]`,
    ];

    for (const selector of selectors) {
      try {
        const elements = await d['findElements']('xpath', selector);
        if (elements.length > 0) {
          const el = elements[0] as Record<string, (...args: unknown[]) => Promise<string>>;
          const text = await el['getText']();
          return { title: text, body: text, element: elements[0] };
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Clears all notifications from the Android notification shade.
   * @param driver - Appium WebDriver instance
   */
  async clearAll(driver: unknown): Promise<void> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<unknown[]>>;
    try {
      const clearButtons = await d['findElements'](
        'id',
        'com.android.systemui:id/dismiss_text'
      );
      if (clearButtons.length > 0) {
        const btn = clearButtons[0] as Record<string, (...args: unknown[]) => Promise<void>>;
        await btn['click']();
      }
    } catch {
      // No clear button visible
    }
  }
}
