import { LogAggregator } from '../../src/backend/services/log-aggregator';
import { UBALog } from '../../src/backend/services/android-log-extractor';

const makeLog = (
  eventName: string,
  platform: 'android' | 'ios',
  timestamp = '2024-01-01T00:00:00Z',
  referrer = 'notification'
): UBALog => ({
  timestamp,
  eventName,
  userId: 'user1',
  referrer,
  payload: { event: eventName },
  raw: '',
});

describe('LogAggregator', () => {
  let aggregator: LogAggregator;

  const androidLogs: UBALog[] = [
    makeLog('PUSH_RECEIVED', 'android', '2024-01-01T00:00:01Z'),
    makeLog('SCREEN_VIEW', 'android', '2024-01-01T00:00:03Z'),
  ];

  const iosLogs: UBALog[] = [
    makeLog('PUSH_RECEIVED', 'ios', '2024-01-01T00:00:02Z'),
    makeLog('TAP_NOTIFICATION', 'ios', '2024-01-01T00:00:04Z'),
  ];

  beforeEach(() => {
    aggregator = new LogAggregator();
  });

  describe('aggregate()', () => {
    it('combines android and iOS logs', () => {
      const result = aggregator.aggregate(androidLogs, iosLogs);
      expect(result.android).toHaveLength(2);
      expect(result.ios).toHaveLength(2);
      expect(result.combined).toHaveLength(4);
    });

    it('sorts combined logs by timestamp', () => {
      const result = aggregator.aggregate(androidLogs, iosLogs);
      const ts = result.combined.map((l) => l.timestamp);
      expect(ts).toEqual([...ts].sort());
    });

    it('handles empty android logs', () => {
      const result = aggregator.aggregate([], iosLogs);
      expect(result.android).toHaveLength(0);
      expect(result.combined).toHaveLength(2);
    });

    it('handles empty iOS logs', () => {
      const result = aggregator.aggregate(androidLogs, []);
      expect(result.ios).toHaveLength(0);
      expect(result.combined).toHaveLength(2);
    });

    it('handles both empty', () => {
      const result = aggregator.aggregate([], []);
      expect(result.combined).toHaveLength(0);
    });
  });

  describe('groupByEvent()', () => {
    it('groups logs by event name', () => {
      const combined = [...androidLogs, ...iosLogs];
      const groups = aggregator.groupByEvent(combined);
      expect(groups['PUSH_RECEIVED']).toHaveLength(2);
      expect(groups['SCREEN_VIEW']).toHaveLength(1);
      expect(groups['TAP_NOTIFICATION']).toHaveLength(1);
    });

    it('returns empty object for empty input', () => {
      expect(aggregator.groupByEvent([])).toEqual({});
    });
  });

  describe('filterByEvent()', () => {
    it('filters aggregated logs by event name (case-insensitive)', () => {
      const aggregated = aggregator.aggregate(androidLogs, iosLogs);
      const result = aggregator.filterByEvent(aggregated, 'push_received');
      expect(result.android).toHaveLength(1);
      expect(result.ios).toHaveLength(1);
      expect(result.combined).toHaveLength(2);
    });

    it('returns empty arrays for non-matching event', () => {
      const aggregated = aggregator.aggregate(androidLogs, iosLogs);
      const result = aggregator.filterByEvent(aggregated, 'NONEXISTENT');
      expect(result.combined).toHaveLength(0);
    });
  });

  describe('formatForDisplay()', () => {
    it('formats logs into the display structure', () => {
      const aggregated = aggregator.aggregate(androidLogs, iosLogs);
      const formatted = aggregator.formatForDisplay(aggregated);

      expect(formatted.byPlatform.android).toHaveLength(2);
      expect(formatted.byPlatform.ios).toHaveLength(2);
      expect(formatted.summary.totalAndroid).toBe(2);
      expect(formatted.summary.totalIOS).toBe(2);
      expect(formatted.summary.uniqueEvents).toContain('PUSH_RECEIVED');
      expect(formatted.summary.uniqueEvents).toHaveLength(3);
    });

    it('sets the correct platform field on formatted entries', () => {
      const aggregated = aggregator.aggregate(androidLogs, []);
      const formatted = aggregator.formatForDisplay(aggregated);
      expect(formatted.byPlatform.android.every((e) => e.platform === 'android')).toBe(true);
    });

    it('groups formatted entries by event in byEvent map', () => {
      const aggregated = aggregator.aggregate(androidLogs, iosLogs);
      const formatted = aggregator.formatForDisplay(aggregated);
      expect(formatted.byEvent['PUSH_RECEIVED']).toHaveLength(2);
    });
  });
});
