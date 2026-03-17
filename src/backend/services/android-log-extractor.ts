export interface UBALog {
  timestamp: string;
  eventName: string;
  userId?: string;
  referrer?: string;
  payload: Record<string, unknown>;
  raw: string;
}

/**
 * Extracts and parses UBA (User Behaviour Analytics) logs from Android logcat.
 */
export class AndroidLogExtractor {
  /**
   * Extracts UBA logs from a BrowserStack session filtered by event name.
   * @param sessionId - BrowserStack session ID
   * @param eventName - Event name to filter for
   */
  async extractLogs(sessionId: string, eventName: string): Promise<UBALog[]> {
    const rawOutput = await this.executeLogcat(sessionId);
    const parsed = this.parseLogcatOutput(rawOutput);
    return this.filterByEvent(parsed, eventName);
  }

  /**
   * Executes logcat for the given session.
   * When BrowserStack credentials are configured the device logs are fetched
   * via the BrowserStack App Automate REST API so that no local ADB connection
   * is required.  Falls back to local ADB otherwise (useful for physical
   * devices connected to the host running the agent).
   * @param sessionId - BrowserStack session ID (or local ADB session)
   */
  async executeLogcat(sessionId: string): Promise<string> {
    const { getConfig } = await import('../config');
    const config = getConfig();
    if (config.browserstack.username && config.browserstack.accessKey) {
      const { getDeviceLogs } = await import('../utils/browserstack-api');
      return getDeviceLogs(sessionId);
    }
    const { AdbExecutor } = await import('../utils/adb-executor');
    const adb = new AdbExecutor();
    return adb.execute(sessionId, 'logcat -d -v time UBA:V *:S');
  }

  /**
   * Parses raw logcat output into structured UBALog objects.
   * @param output - Raw logcat string
   */
  parseLogcatOutput(output: string): UBALog[] {
    const logs: UBALog[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      const ubaMatch = line.match(/UBA\s*:\s*(\{.+\})/);
      if (!ubaMatch) continue;

      try {
        const payload = JSON.parse(ubaMatch[1]) as Record<string, unknown>;
        const timestampMatch = line.match(/^(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d+)/);

        logs.push({
          timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
          eventName: typeof payload['event'] === 'string' ? payload['event'] : '',
          userId: typeof payload['userId'] === 'string' ? payload['userId'] : undefined,
          referrer: typeof payload['referrer'] === 'string' ? payload['referrer'] : undefined,
          payload,
          raw: line,
        });
      } catch {
        continue;
      }
    }

    return logs;
  }

  /**
   * Filters logs by event name (case-insensitive).
   * @param logs - Array of UBALog objects
   * @param eventName - Event name to filter by
   */
  filterByEvent(logs: UBALog[], eventName: string): UBALog[] {
    return logs.filter(
      (log) => log.eventName.toLowerCase() === eventName.toLowerCase()
    );
  }

  /**
   * Filters logs by referrer value.
   * @param logs - Array of UBALog objects
   * @param referrer - Referrer string to filter by
   */
  filterByReferrer(logs: UBALog[], referrer: string): UBALog[] {
    return logs.filter((log) => log.referrer === referrer);
  }
}
