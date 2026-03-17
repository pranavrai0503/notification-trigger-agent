import { NotificationElement } from './notification-verifier';

/**
 * iOS-specific notification locator using XCUITest predicates.
 */
export class IOSNotificationFinder {
  /**
   * Opens the iOS notification centre by swiping down from the top.
   * @param driver - Appium WebDriver instance
   */
  async openShade(driver: unknown): Promise<void> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<void>>;
    await d['execute']('mobile: swipe', [{ direction: 'down' }]);
  }

  /**
   * Finds a notification in the iOS notification centre by text pattern.
   * @param driver - Appium WebDriver instance
   * @param pattern - Text to search for in notification title or body
   */
  async find(driver: unknown, pattern: string): Promise<NotificationElement | null> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<unknown[]>>;
    const selectors = [
      `-ios predicate string:label CONTAINS '${pattern}'`,
      `-ios class chain:**/XCUIElementTypeStaticText[\`label CONTAINS '${pattern}'\`]`,
    ];

    for (const [strategy, value] of selectors.map((s, i) => [i === 0 ? '-ios predicate string' : '-ios class chain', s] as [string, string])) {
      try {
        const elements = await d['findElements'](strategy, value);
        if (elements.length > 0) {
          const el = elements[0] as Record<string, (...args: unknown[]) => Promise<string>>;
          const text = await el['getAttribute']('label');
          return { title: text, body: text, element: elements[0] };
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Dismisses the iOS notification centre by swiping up.
   * @param driver - Appium WebDriver instance
   */
  async dismissShade(driver: unknown): Promise<void> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<void>>;
    await d['execute']('mobile: swipe', [{ direction: 'up' }]);
  }
}
