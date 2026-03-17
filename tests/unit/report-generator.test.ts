import { ReportGenerator } from '../../src/backend/services/report-generator';
import { TestSession, TestStatus, TestPhase } from '../../src/backend/types/test-session';

jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue('<!DOCTYPE html><html><body>{{report.sessionId}}</body></html>'),
}));

function makeSession(overrides: Partial<TestSession> = {}): TestSession {
  const base: TestSession = {
    id: 'sess-001',
    status: TestStatus.PASSED,
    config: {
      curlCommand: 'curl https://example.com',
      credentials: { username: 'user', password: 'pass' },
      appState: 'FOREGROUND',
      platforms: ['android'],
      checkPushNotification: true,
      checkInAppNotification: false,
      checkLandingPage: false,
      extractLogs: true,
    },
    phases: [
      {
        phase: TestPhase.SETUP,
        status: TestStatus.PASSED,
        startedAt: new Date('2024-01-01T00:00:00Z'),
        completedAt: new Date('2024-01-01T00:00:05Z'),
        durationMs: 5000,
      },
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    startedAt: new Date('2024-01-01T00:00:00Z'),
    completedAt: new Date('2024-01-01T00:01:00Z'),
    screenshots: ['base64screen1', 'base64screen2'],
  };
  return { ...base, ...overrides };
}

describe('ReportGenerator', () => {
  let generator: ReportGenerator;

  beforeEach(() => {
    generator = new ReportGenerator();
  });

  describe('generateJSON()', () => {
    it('generates a valid JSON report from session', () => {
      const session = makeSession();
      const report = generator.generateJSON(session);

      expect(report.sessionId).toBe('sess-001');
      expect(report.status).toBe(TestStatus.PASSED);
      expect(report.duration).toBe(60000);
      expect(report.phases).toHaveLength(1);
      expect(report.phases[0].name).toBe(TestPhase.SETUP);
      expect(report.phases[0].durationMs).toBe(5000);
      expect(report.screenshots).toHaveLength(2);
      expect(report.generatedAt).toBeDefined();
    });

    it('handles session with no completedAt (duration = 0)', () => {
      const session = makeSession({ completedAt: undefined });
      const report = generator.generateJSON(session);
      expect(report.duration).toBe(0);
    });

    it('maps screenshots with correct mimeType', () => {
      const session = makeSession();
      const report = generator.generateJSON(session);
      expect(report.screenshots[0].mimeType).toBe('image/png');
      expect(report.screenshots[0].base64).toBe('base64screen1');
    });

    it('includes phase error when present', () => {
      const session = makeSession({
        phases: [
          {
            phase: TestPhase.LOGIN,
            status: TestStatus.FAILED,
            startedAt: new Date(),
            durationMs: 1000,
            error: 'login failed',
          },
        ],
      });
      const report = generator.generateJSON(session);
      expect(report.phases[0].error).toBe('login failed');
    });
  });

  describe('embedScreenshots()', () => {
    it('replaces placeholders with base64 img tags', () => {
      const html = '{{screenshot_0}} {{screenshot_1}}';
      const screenshots = [
        { phase: 'phase1', base64: 'abc123', mimeType: 'image/png' },
        { phase: 'phase2', base64: 'def456', mimeType: 'image/jpeg' },
      ];
      const result = generator.embedScreenshots(html, screenshots);
      expect(result).toContain('data:image/png;base64,abc123');
      expect(result).toContain('data:image/jpeg;base64,def456');
    });

    it('leaves html unchanged if no placeholders match', () => {
      const html = '<p>No placeholders</p>';
      const result = generator.embedScreenshots(html, []);
      expect(result).toBe(html);
    });

    it('defaults mimeType to image/png when not specified', () => {
      const html = '{{screenshot_0}}';
      const result = generator.embedScreenshots(html, [{ phase: 'p', base64: 'x' }]);
      expect(result).toContain('data:image/png;base64,x');
    });
  });

  describe('generateHTML()', () => {
    it('generates HTML string containing the sessionId', async () => {
      const session = makeSession();
      const html = await generator.generateHTML(session);
      expect(typeof html).toBe('string');
      expect(html).toContain('sess-001');
    });
  });
});
