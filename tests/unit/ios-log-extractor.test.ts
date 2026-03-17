import { IOSLogExtractor } from '../../src/backend/services/ios-log-extractor';

const SAMPLE_SYSLOG = `
Mar 15 10:23:45 MyApp[1234]: [UBA] {"event":"PUSH_RECEIVED","userId":"ios-user","referrer":"notification"}
Mar 15 10:23:46 MyApp[1234]: [UBA] {"event":"SCREEN_VIEW","userId":"ios-user","screen":"home"}
Mar 15 10:23:47 MyApp[1234]: Some other log line
Mar 15 10:23:48 MyApp[1234]: [UBA] {"event":"PUSH_RECEIVED","userId":"ios-user2","referrer":"notification"}
`;

describe('IOSLogExtractor', () => {
  let extractor: IOSLogExtractor;

  beforeEach(() => {
    extractor = new IOSLogExtractor();
  });

  describe('extractUBAPayloads()', () => {
    it('parses UBA log lines from syslog', () => {
      const logs = extractor.extractUBAPayloads(SAMPLE_SYSLOG);
      expect(logs).toHaveLength(3);
    });

    it('extracts event name correctly', () => {
      const logs = extractor.extractUBAPayloads(SAMPLE_SYSLOG);
      expect(logs[0].eventName).toBe('PUSH_RECEIVED');
      expect(logs[1].eventName).toBe('SCREEN_VIEW');
    });

    it('extracts userId correctly', () => {
      const logs = extractor.extractUBAPayloads(SAMPLE_SYSLOG);
      expect(logs[0].userId).toBe('ios-user');
    });

    it('extracts referrer correctly', () => {
      const logs = extractor.extractUBAPayloads(SAMPLE_SYSLOG);
      expect(logs[0].referrer).toBe('notification');
    });

    it('extracts timestamp from syslog format', () => {
      const logs = extractor.extractUBAPayloads(SAMPLE_SYSLOG);
      expect(logs[0].timestamp).toBe('Mar 15 10:23:45');
    });

    it('ignores non-UBA lines', () => {
      const logs = extractor.extractUBAPayloads(SAMPLE_SYSLOG);
      expect(logs.every((l) => l.eventName !== '')).toBe(true);
    });

    it('returns empty array for empty input', () => {
      expect(extractor.extractUBAPayloads('')).toHaveLength(0);
    });

    it('skips malformed JSON in UBA lines', () => {
      const bad = 'Mar 15 10:00:00 App[1]: [UBA] {not valid json}';
      expect(extractor.extractUBAPayloads(bad)).toHaveLength(0);
    });
  });

  describe('filterByEvent()', () => {
    it('filters logs by event name (case-insensitive)', () => {
      const logs = extractor.extractUBAPayloads(SAMPLE_SYSLOG);
      const filtered = extractor.filterByEvent(logs, 'push_received');
      expect(filtered).toHaveLength(2);
    });

    it('returns empty for non-matching event', () => {
      const logs = extractor.extractUBAPayloads(SAMPLE_SYSLOG);
      expect(extractor.filterByEvent(logs, 'MISSING_EVENT')).toHaveLength(0);
    });
  });

  describe('getDeviceLogs()', () => {
    it('calls getLogs and joins messages', async () => {
      const mockDriver = {
        getLogs: jest.fn().mockResolvedValue([
          { message: 'line one' },
          { message: 'line two' },
        ]),
      };

      const result = await extractor.getDeviceLogs(mockDriver);
      expect(result).toBe('line one\nline two');
    });
  });

  describe('extractLogs()', () => {
    it('integrates getDeviceLogs, parse and filterByEvent', async () => {
      const mockDriver = {
        getLogs: jest.fn().mockResolvedValue(
          SAMPLE_SYSLOG.split('\n').map((m) => ({ message: m }))
        ),
      };

      const logs = await extractor.extractLogs(mockDriver, 'PUSH_RECEIVED');
      expect(logs).toHaveLength(2);
    });
  });
});
