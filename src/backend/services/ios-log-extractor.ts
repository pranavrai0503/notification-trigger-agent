import { UBALog } from './android-log-extractor';

/**
 * Extracts and parses UBA logs from iOS devices via Appium.
 */
export class IOSLogExtractor {
  /**
   * Extracts UBA logs from an iOS device filtered by event name.
   * @param driver - Appium WebDriver instance
   * @param eventName - Event name to filter for
   */
  async extractLogs(driver: unknown, eventName: string): Promise<UBALog[]> {
    const rawLogs = await this.getDeviceLogs(driver);
    const parsed = this.extractUBAPayloads(rawLogs);
    return this.filterByEvent(parsed, eventName);
  }

  /**
   * Retrieves raw device logs via Appium.
   * @param driver - Appium WebDriver instance
   */
  async getDeviceLogs(driver: unknown): Promise<string> {
    const d = driver as Record<string, (...args: unknown[]) => Promise<Array<{ message: string }>>>;
    const logEntries = await d['getLogs']('syslog');
    return logEntries.map((e) => e.message).join('\n');
  }

  /**
   * Parses device log string and extracts UBA payloads.
   * @param logs - Raw device log string
   */
  extractUBAPayloads(logs: string): UBALog[] {
    const result: UBALog[] = [];
    const lines = logs.split('\n');

    for (const line of lines) {
      const ubaMatch = line.match(/\[UBA\]\s*(\{.+\})/);
      if (!ubaMatch) continue;

      try {
        const payload = JSON.parse(ubaMatch[1]) as Record<string, unknown>;
        const timestampMatch = line.match(/^([A-Z][a-z]+\s+\d+\s+\d{2}:\d{2}:\d{2})/);

        result.push({
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

    return result;
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
}
