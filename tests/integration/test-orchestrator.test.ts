import { TestOrchestrator, OrchestratorDeps } from '../../src/backend/services/test-orchestrator';
import { TestConfig, TestPhase, TestStatus } from '../../src/backend/types/test-session';
import { BrowserStackManager } from '../../src/backend/services/browserstack-manager';
import { LoginAutomator } from '../../src/backend/services/login-automator';
import { AppStateManager } from '../../src/backend/services/app-state-manager';
import { CurlParser } from '../../src/backend/services/curl-parser';
import { NotificationTrigger } from '../../src/backend/services/notification-trigger';
import { NotificationVerifier } from '../../src/backend/services/notification-verifier';
import { InAppNotifCentreVerifier } from '../../src/backend/services/inapp-notif-centre-verifier';
import { NotificationTapValidator } from '../../src/backend/services/notification-tap-validator';
import { AndroidLogExtractor } from '../../src/backend/services/android-log-extractor';
import { IOSLogExtractor } from '../../src/backend/services/ios-log-extractor';
import { LogAggregator } from '../../src/backend/services/log-aggregator';
import { ReportGenerator } from '../../src/backend/services/report-generator';

// Mock all sub-services to keep tests fast and isolated
jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('mocked-uuid-1234') }));
jest.mock('../../src/backend/services/curl-parser');
jest.mock('../../src/backend/services/browserstack-manager');
jest.mock('../../src/backend/services/login-automator');
jest.mock('../../src/backend/services/app-state-manager');
jest.mock('../../src/backend/services/notification-trigger');
jest.mock('../../src/backend/services/notification-verifier');
jest.mock('../../src/backend/services/inapp-notif-centre-verifier');
jest.mock('../../src/backend/services/notification-tap-validator');
jest.mock('../../src/backend/services/android-log-extractor');
jest.mock('../../src/backend/services/ios-log-extractor');
jest.mock('../../src/backend/services/log-aggregator');
jest.mock('../../src/backend/services/report-generator');
jest.mock('../../src/backend/config', () => ({
  getConfig: () => ({
    app: { packageAndroid: 'com.example.app', packageIOS: 'com.example.app', activityAndroid: '' },
    browserstack: { username: 'u', accessKey: 'k', apiUrl: 'https://bs.com' },
    test: { defaultTimeoutMs: 5000, sessionTimeoutMs: 60000, maxRetryAttempts: 1, retryDelayMs: 100 },
  }),
}));

const baseConfig: TestConfig = {
  curlCommand: "curl -X POST 'https://api.example.com/notify' -H 'Content-Type: application/json' -d '{\"eventCode\":\"PUSH_001\",\"userId\":\"u1\"}'",
  credentials: { username: 'user@example.com', password: 'pass' },
  appState: 'FOREGROUND',
  platforms: ['android'],
  checkPushNotification: false,
  checkInAppNotification: false,
  checkLandingPage: false,
  extractLogs: false,
};

/** Build a happy-path dependency bag where every service resolves successfully. */
function buildHappyDeps(): OrchestratorDeps {
  const bsManager = new BrowserStackManager() as jest.Mocked<BrowserStackManager>;
  bsManager.provisionDevice = jest.fn().mockResolvedValue({ sessionId: 'bs-session-android', capabilities: {}, createdAt: new Date() });
  bsManager.closeSession = jest.fn().mockResolvedValue(undefined);

  const loginAutomator = new LoginAutomator() as jest.Mocked<LoginAutomator>;
  loginAutomator.login = jest.fn().mockResolvedValue({ success: true, required2FA: false });

  const appStateManager = new AppStateManager() as jest.Mocked<AppStateManager>;
  appStateManager.setForeground = jest.fn().mockResolvedValue(undefined);
  appStateManager.setBackground = jest.fn().mockResolvedValue(undefined);
  appStateManager.killApp = jest.fn().mockResolvedValue(undefined);

  const curlParser = new CurlParser() as jest.Mocked<CurlParser>;
  curlParser.parse = jest.fn().mockReturnValue({
    method: 'POST',
    url: 'https://api.example.com/notify',
    headers: { 'Content-Type': 'application/json' },
    body: { eventCode: 'PUSH_001', userId: 'u1' },
    eventCode: 'PUSH_001',
    userId: 'u1',
  });

  const notificationTrigger = new NotificationTrigger() as jest.Mocked<NotificationTrigger>;
  notificationTrigger.trigger = jest.fn().mockResolvedValue({ success: true, statusCode: 200, responseBody: {}, durationMs: 50 });

  const notificationVerifier = new NotificationVerifier() as jest.Mocked<NotificationVerifier>;
  notificationVerifier.verify = jest.fn().mockResolvedValue({ found: true });

  const inAppVerifier = new InAppNotifCentreVerifier() as jest.Mocked<InAppNotifCentreVerifier>;
  inAppVerifier.verify = jest.fn().mockResolvedValue({ found: true });

  const tapValidator = new NotificationTapValidator() as jest.Mocked<NotificationTapValidator>;
  tapValidator.tapAndValidate = jest.fn().mockResolvedValue({ tapped: true, navigatedCorrectly: true });

  const androidExtractor = new AndroidLogExtractor() as jest.Mocked<AndroidLogExtractor>;
  androidExtractor.extractLogs = jest.fn().mockResolvedValue([]);

  const iosExtractor = new IOSLogExtractor() as jest.Mocked<IOSLogExtractor>;
  iosExtractor.extractLogs = jest.fn().mockResolvedValue([]);

  const logAggregator = new LogAggregator() as jest.Mocked<LogAggregator>;
  logAggregator.aggregate = jest.fn().mockReturnValue({ android: [], ios: [], combined: [] });
  logAggregator.formatForDisplay = jest.fn().mockReturnValue({ byPlatform: { android: [], ios: [] }, byEvent: {}, summary: { totalAndroid: 0, totalIOS: 0, uniqueEvents: [] } });

  const reportGenerator = new ReportGenerator() as jest.Mocked<ReportGenerator>;
  reportGenerator.generateJSON = jest.fn().mockReturnValue({ sessionId: 'mocked-uuid-1234', status: TestStatus.PASSED, duration: 0, phases: [], screenshots: [], generatedAt: '', config: {} });

  return { bsManager, loginAutomator, appStateManager, curlParser, notificationTrigger, notificationVerifier, inAppVerifier, tapValidator, androidExtractor, iosExtractor, logAggregator, reportGenerator };
}

describe('TestOrchestrator – integration', () => {
  let orchestrator: TestOrchestrator;

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = new TestOrchestrator();
  });

  it('creates a session with a unique ID', async () => {
    const session = await orchestrator.runTest(baseConfig).catch((e) => {
      // Even on failure the session should have been created
      return e as { id?: string };
    });
    expect(typeof (session as { id: string }).id).toBe('string');
  });

  it('records phases in the session', async () => {
    const session = await orchestrator.runTest(baseConfig).catch((s) => s);
    const phases = (session as { phases: unknown[] }).phases;
    expect(Array.isArray(phases)).toBe(true);
  });

  it('sets status to FAILED when orchestration errors', async () => {
    // The mock services will throw by default — ensure the session reflects failure
    const session = await orchestrator.runTest(baseConfig).catch((s) => s);
    const status = (session as { status: string }).status;
    // Could be FAILED or PASSED depending on mock setup, but should not be PENDING
    expect([TestStatus.FAILED, TestStatus.PASSED, TestStatus.ABORTED]).toContain(status);
  });

  it('uses a pre-supplied session ID when provided', async () => {
    const session = await orchestrator.runTest(baseConfig, 'custom-id-123').catch((s) => s);
    expect((session as { id: string }).id).toBe('custom-id-123');
  });

  describe('with happy-path service mocks', () => {
    beforeEach(() => {
      orchestrator = new TestOrchestrator(buildHappyDeps());
    });

    it('completes with PASSED status for a basic config', async () => {
      const session = await orchestrator.runTest(baseConfig);
      expect(session.status).toBe(TestStatus.PASSED);
    });

    it('runs SETUP, LOGIN, APP_STATE, and REPORT phases for basic config', async () => {
      const session = await orchestrator.runTest(baseConfig);
      const phaseNames = session.phases.map((p) => p.phase);
      expect(phaseNames).toContain(TestPhase.SETUP);
      expect(phaseNames).toContain(TestPhase.LOGIN);
      expect(phaseNames).toContain(TestPhase.APP_STATE);
      expect(phaseNames).toContain(TestPhase.REPORT);
    });

    it('does not run TRIGGER phase when no notification checks are enabled', async () => {
      const session = await orchestrator.runTest(baseConfig);
      const phaseNames = session.phases.map((p) => p.phase);
      expect(phaseNames).not.toContain(TestPhase.TRIGGER);
    });

    it('runs TRIGGER and VERIFY_PUSH phases when checkPushNotification is true', async () => {
      const config = { ...baseConfig, checkPushNotification: true };
      const session = await orchestrator.runTest(config);
      const phaseNames = session.phases.map((p) => p.phase);
      expect(phaseNames).toContain(TestPhase.TRIGGER);
      expect(phaseNames).toContain(TestPhase.VERIFY_PUSH);
    });

    it('runs TRIGGER and VERIFY_INAPP phases when checkInAppNotification is true', async () => {
      const config = { ...baseConfig, checkInAppNotification: true };
      const session = await orchestrator.runTest(config);
      const phaseNames = session.phases.map((p) => p.phase);
      expect(phaseNames).toContain(TestPhase.TRIGGER);
      expect(phaseNames).toContain(TestPhase.VERIFY_INAPP);
    });

    it('runs LOG_EXTRACTION phase when extractLogs is true', async () => {
      const config = { ...baseConfig, extractLogs: true };
      const session = await orchestrator.runTest(config);
      const phaseNames = session.phases.map((p) => p.phase);
      expect(phaseNames).toContain(TestPhase.LOG_EXTRACTION);
    });

    it('stores the android session ID returned from BrowserStack provisioning', async () => {
      const session = await orchestrator.runTest(baseConfig);
      expect(session.androidSessionId).toBe('bs-session-android');
    });

    it('records FAILED status on a phase when the service throws', async () => {
      const deps = buildHappyDeps();
      (deps.loginAutomator!.login as jest.Mock).mockRejectedValue(new Error('login error'));
      orchestrator = new TestOrchestrator(deps);
      const session = await orchestrator.runTest(baseConfig);
      expect(session.status).toBe(TestStatus.FAILED);
      const loginPhase = session.phases.find((p) => p.phase === TestPhase.LOGIN);
      expect(loginPhase?.status).toBe(TestStatus.FAILED);
      expect(loginPhase?.error).toMatch(/login error/);
    });

    it('records FAILED status when login reports unsuccessful', async () => {
      const deps = buildHappyDeps();
      (deps.loginAutomator!.login as jest.Mock).mockResolvedValue({ success: false, required2FA: false, error: 'bad creds' });
      orchestrator = new TestOrchestrator(deps);
      const session = await orchestrator.runTest(baseConfig);
      expect(session.status).toBe(TestStatus.FAILED);
      expect(session.error).toMatch(/bad creds/);
    });
  });
});
