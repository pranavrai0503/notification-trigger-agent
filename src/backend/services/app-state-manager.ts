import { AppState } from '../types/app-state';
import { getConfig } from '../config';

/**
 * Controls the foreground/background/killed state of the app under test.
 */
export class AppStateManager {
  /**
   * Brings the app to the foreground.
   * @param driver - Appium WebDriver instance
   */
  async setForeground(driver: unknown): Promise<void> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<void>>;
    const config = getConfig();
    await d['activateApp'](config.app.packageAndroid);
  }

  /**
   * Sends the app to the background for a given duration.
   * @param driver - Appium WebDriver instance
   * @param seconds - How many seconds to keep the app backgrounded
   */
  async setBackground(driver: unknown, seconds: number): Promise<void> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<void>>;
    await d['background'](seconds);
  }

  /**
   * Terminates (kills) the app process.
   * @param driver - Appium WebDriver instance
   */
  async killApp(driver: unknown): Promise<void> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<void>>;
    const config = getConfig();
    await d['terminateApp'](config.app.packageAndroid);
  }

  /**
   * Returns the current AppState of the app.
   * @param driver - Appium WebDriver instance
   */
  async getState(driver: unknown): Promise<AppState> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<number>>;
    const config = getConfig();
    try {
      // Appium queryAppState returns numeric state:
      // 0 = not installed, 1 = not running, 2 = background, 3 = background suspended, 4 = foreground
      const state = await d['queryAppState'](config.app.packageAndroid);
      if (state === 4) return AppState.FOREGROUND;
      if (state === 2 || state === 3) return AppState.BACKGROUND;
      if (state === 1 || state === 0) return AppState.KILLED;
      return AppState.UNKNOWN;
    } catch {
      return AppState.UNKNOWN;
    }
  }
}
