import { execSync } from 'child_process';

/**
 * Maps a test session ID to the corresponding local Android device serial number.
 * Call {@link registerDeviceSerial} during device provisioning so that ADB
 * commands are targeted at the correct device when multiple are attached.
 */
const sessionSerialMap = new Map<string, string>();

/**
 * Registers a local Android device serial number for a given session ID.
 * The serial is included as `adb -s <serial>` in subsequent commands so that
 * multi-device environments target the correct device.
 * @param sessionId - Test session identifier
 * @param serial - Android device serial from `adb devices`
 */
export function registerDeviceSerial(sessionId: string, serial: string): void {
  sessionSerialMap.set(sessionId, serial);
}

/**
 * Removes the serial mapping for a session (call during teardown).
 * @param sessionId - Test session identifier
 */
export function unregisterDeviceSerial(sessionId: string): void {
  sessionSerialMap.delete(sessionId);
}

/**
 * Executes ADB commands for Android device interaction.
 */
export class AdbExecutor {
  /**
   * Executes an ADB command on the device associated with a session.
   * When a device serial has been registered via {@link registerDeviceSerial}
   * the `-s <serial>` flag is automatically prepended so the command targets
   * the correct device in multi-device environments.
   * @param sessionId - Test session identifier
   * @param command - ADB sub-command string (e.g., 'logcat -d')
   */
  execute(sessionId: string, command: string): string {
    const serial = sessionSerialMap.get(sessionId);
    const prefix = serial ? `-s ${serial} ` : '';
    try {
      return execSync(`adb ${prefix}${command}`, {
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
