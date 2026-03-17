import { UBALog } from './android-log-extractor';

export interface AggregatedLogs {
  android: UBALog[];
  ios: UBALog[];
  combined: UBALog[];
}

export interface FormattedLogs {
  byPlatform: {
    android: FormattedLogEntry[];
    ios: FormattedLogEntry[];
  };
  byEvent: Record<string, FormattedLogEntry[]>;
  summary: {
    totalAndroid: number;
    totalIOS: number;
    uniqueEvents: string[];
  };
}

export interface FormattedLogEntry {
  timestamp: string;
  eventName: string;
  userId?: string;
  platform: 'android' | 'ios';
  payload: Record<string, unknown>;
}

/**
 * Aggregates and formats UBA logs from Android and iOS sources.
 */
export class LogAggregator {
  /**
   * Combines Android and iOS logs into an AggregatedLogs object.
   * @param androidLogs - Logs from Android device
   * @param iosLogs - Logs from iOS device
   */
  aggregate(androidLogs: UBALog[], iosLogs: UBALog[]): AggregatedLogs {
    return {
      android: androidLogs,
      ios: iosLogs,
      combined: [...androidLogs, ...iosLogs].sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp)
      ),
    };
  }

  /**
   * Groups logs by their event name.
   * @param logs - Array of UBALog objects to group
   */
  groupByEvent(logs: UBALog[]): Record<string, UBALog[]> {
    return logs.reduce<Record<string, UBALog[]>>((acc, log) => {
      if (!acc[log.eventName]) acc[log.eventName] = [];
      acc[log.eventName].push(log);
      return acc;
    }, {});
  }

  /**
   * Filters an aggregated log set to only include logs for a specific event.
   * @param aggregated - AggregatedLogs object
   * @param eventName - Event name to filter by
   */
  filterByEvent(aggregated: AggregatedLogs, eventName: string): AggregatedLogs {
    const filter = (logs: UBALog[]): UBALog[] =>
      logs.filter((l) => l.eventName.toLowerCase() === eventName.toLowerCase());

    return {
      android: filter(aggregated.android),
      ios: filter(aggregated.ios),
      combined: filter(aggregated.combined),
    };
  }

  /**
   * Formats aggregated logs for display in the frontend.
   * @param aggregated - AggregatedLogs to format
   */
  formatForDisplay(aggregated: AggregatedLogs): FormattedLogs {
    const format = (logs: UBALog[], platform: 'android' | 'ios'): FormattedLogEntry[] =>
      logs.map((l) => ({
        timestamp: l.timestamp,
        eventName: l.eventName,
        userId: l.userId,
        platform,
        payload: l.payload,
      }));

    const allFormatted = [
      ...format(aggregated.android, 'android'),
      ...format(aggregated.ios, 'ios'),
    ];

    return {
      byPlatform: {
        android: format(aggregated.android, 'android'),
        ios: format(aggregated.ios, 'ios'),
      },
      byEvent: allFormatted.reduce<Record<string, FormattedLogEntry[]>>((acc, entry) => {
        if (!acc[entry.eventName]) acc[entry.eventName] = [];
        acc[entry.eventName].push(entry);
        return acc;
      }, {}),
      summary: {
        totalAndroid: aggregated.android.length,
        totalIOS: aggregated.ios.length,
        uniqueEvents: [...new Set(aggregated.combined.map((l) => l.eventName))],
      },
    };
  }
}
