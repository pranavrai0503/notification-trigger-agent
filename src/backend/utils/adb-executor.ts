import { execSync } from 'child_process';

/**
 * Executes ADB commands for Android device interaction.
 */
export class AdbExecutor {
  /**
   * Executes an ADB command on the device associated with a session.
   * @param sessionId - BrowserStack session ID (used for device targeting)
   * @param command - ADB sub-command string (e.g., 'logcat -d')
   */
  execute(sessionId: string, command: string): string {
    void sessionId; // In a real implementation, map sessionId to a device serial
    try {
      return execSync(`adb ${command}`, {
        encoding: 'utf8',
        timeout: 30000,
      });
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error(`ADB command failed: ${String(error)}`);
    }
  }

  /**
   * Clears the logcat buffer on the device.
   * @param sessionId - BrowserStack session ID
   */
  clearLogcat(sessionId: string): void {
    this.execute(sessionId, 'logcat -c');
  }

  /**
   * Checks whether ADB is available on the host machine.
   */
  isAvailable(): boolean {
    try {
      execSync('adb version', { encoding: 'utf8' });
      return true;
    } catch {
      return false;
    }
  }
}
