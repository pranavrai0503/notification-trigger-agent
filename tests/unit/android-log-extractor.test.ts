import { AndroidLogExtractor } from '../../src/backend/services/android-log-extractor';

jest.mock('../../src/backend/utils/adb-executor', () => ({
  AdbExecutor: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue(''),
  })),
}));

const SAMPLE_LOGCAT = `
03-15 10:23:45.123  1234  5678 I UBA     : {"event":"PUSH_RECEIVED","userId":"user42","referrer":"notification","screen":"home"}
03-15 10:23:46.456  1234  5678 I UBA     : {"event":"CLICK_BANNER","userId":"user99","referrer":"direct","screen":"product"}
03-15 10:23:47.789  1234  5678 I SomeOther: this line should be ignored
03-15 10:23:48.000  1234  5678 I UBA     : {"event":"PUSH_RECEIVED","userId":"user42","referrer":"notification","screen":"cart"}
`;

describe('AndroidLogExtractor', () => {
  let extractor: AndroidLogExtractor;

  beforeEach(() => {
    extractor = new AndroidLogExtractor();
  });

  describe('parseLogcatOutput()', () => {
    it('parses valid UBA log lines', () => {
      const logs = extractor.parseLogcatOutput(SAMPLE_LOGCAT);
      expect(logs).toHaveLength(3);
    });

    it('extracts event name correctly', () => {
      const logs = extractor.parseLogcatOutput(SAMPLE_LOGCAT);
      expect(logs[0].eventName).toBe('PUSH_RECEIVED');
      expect(logs[1].eventName).toBe('CLICK_BANNER');
    });

    it('extracts userId correctly', () => {
      const logs = extractor.parseLogcatOutput(SAMPLE_LOGCAT);
      expect(logs[0].userId).toBe('user42');
    });

    it('extracts referrer correctly', () => {
      const logs = extractor.parseLogcatOutput(SAMPLE_LOGCAT);
      expect(logs[0].referrer).toBe('notification');
    });

    it('extracts timestamp', () => {
      const logs = extractor.parseLogcatOutput(SAMPLE_LOGCAT);
      expect(logs[0].timestamp).toBe('03-15 10:23:45.123');
    });

    it('ignores non-UBA lines', () => {
      const logs = extractor.parseLogcatOutput(SAMPLE_LOGCAT);
      expect(logs.every((l) => l.eventName !== 'SomeOther')).toBe(true);
    });

    it('returns empty array for empty input', () => {
      expect(extractor.parseLogcatOutput('')).toHaveLength(0);
    });

    it('skips malformed JSON lines', () => {
      const badLog = '03-15 10:23:45.000  1234  5678 I UBA     : {invalid json}';
      expect(extractor.parseLogcatOutput(badLog)).toHaveLength(0);
    });
  });

  describe('filterByEvent()', () => {
    it('filters logs by event name (case-insensitive)', () => {
      const logs = extractor.parseLogcatOutput(SAMPLE_LOGCAT);
      const filtered = extractor.filterByEvent(logs, 'push_received');
      expect(filtered).toHaveLength(2);
      expect(filtered.every((l) => l.eventName === 'PUSH_RECEIVED')).toBe(true);
    });

    it('returns empty array when no match', () => {
      const logs = extractor.parseLogcatOutput(SAMPLE_LOGCAT);
      expect(extractor.filterByEvent(logs, 'NONEXISTENT')).toHaveLength(0);
    });
  });

  describe('filterByReferrer()', () => {
    it('filters logs by referrer value', () => {
      const logs = extractor.parseLogcatOutput(SAMPLE_LOGCAT);
      const notifLogs = extractor.filterByReferrer(logs, 'notification');
      expect(notifLogs).toHaveLength(2);
    });

    it('returns empty array for non-matching referrer', () => {
      const logs = extractor.parseLogcatOutput(SAMPLE_LOGCAT);
      expect(extractor.filterByReferrer(logs, 'unknown')).toHaveLength(0);
    });
  });

  describe('extractLogs()', () => {
    it('calls executeLogcat and returns filtered results', async () => {
      // Spy on executeLogcat to return our sample output
      jest.spyOn(extractor, 'executeLogcat').mockResolvedValue(SAMPLE_LOGCAT);

      const logs = await extractor.extractLogs('sess-001', 'PUSH_RECEIVED');
      expect(logs).toHaveLength(2);
    });
  });
});
