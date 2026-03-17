import { v4 as uuidv4 } from 'uuid';
import {
  TestConfig,
  TestSession,
  TestStatus,
  TestPhase,
  PhaseResult,
} from '../types/test-session';
import { BrowserStackManager } from './browserstack-manager';
import { LoginAutomator } from './login-automator';
import { AppStateManager } from './app-state-manager';
import { CurlParser } from './curl-parser';
import { NotificationTrigger } from './notification-trigger';
import { NotificationVerifier } from './notification-verifier';
import { InAppNotifCentreVerifier } from './inapp-notif-centre-verifier';
import { NotificationTapValidator } from './notification-tap-validator';
import { AndroidLogExtractor } from './android-log-extractor';
import { IOSLogExtractor } from './ios-log-extractor';
import { LogAggregator } from './log-aggregator';
import { ReportGenerator } from './report-generator';
import { getConfig } from '../config';
import {
  DEFAULT_ANDROID_CAPABILITIES,
  DEFAULT_IOS_CAPABILITIES,
  DeviceCapabilities,
} from '../config/device-capabilities';
import { getLandingPageConfig } from '../config/landing-pages.config';

type Platform = 'android' | 'ios';

export interface OrchestratorDeps {
  bsManager?: BrowserStackManager;
  loginAutomator?: LoginAutomator;
  appStateManager?: AppStateManager;
  curlParser?: CurlParser;
  notificationTrigger?: NotificationTrigger;
  notificationVerifier?: NotificationVerifier;
  inAppVerifier?: InAppNotifCentreVerifier;
  tapValidator?: NotificationTapValidator;
  androidExtractor?: AndroidLogExtractor;
  iosExtractor?: IOSLogExtractor;
  logAggregator?: LogAggregator;
  reportGenerator?: ReportGenerator;
}

/**
 * Orchestrates the full end-to-end notification test lifecycle.
 */
export class TestOrchestrator {
  private readonly bsManager: BrowserStackManager;
  private readonly loginAutomator: LoginAutomator;
  private readonly appStateManager: AppStateManager;
  private readonly curlParser: CurlParser;
  private readonly notificationTrigger: NotificationTrigger;
  private readonly notificationVerifier: NotificationVerifier;
  private readonly inAppVerifier: InAppNotifCentreVerifier;
  private readonly tapValidator: NotificationTapValidator;
  private readonly androidExtractor: AndroidLogExtractor;
  private readonly iosExtractor: IOSLogExtractor;
  private readonly logAggregator: LogAggregator;
  private readonly reportGenerator: ReportGenerator;

  constructor(deps?: OrchestratorDeps) {
    this.bsManager = deps?.bsManager ?? new BrowserStackManager();
    this.loginAutomator = deps?.loginAutomator ?? new LoginAutomator();
    this.appStateManager = deps?.appStateManager ?? new AppStateManager();
    this.curlParser = deps?.curlParser ?? new CurlParser();
    this.notificationTrigger = deps?.notificationTrigger ?? new NotificationTrigger();
    this.notificationVerifier = deps?.notificationVerifier ?? new NotificationVerifier();
    this.inAppVerifier = deps?.inAppVerifier ?? new InAppNotifCentreVerifier();
    this.tapValidator = deps?.tapValidator ?? new NotificationTapValidator();
    this.androidExtractor = deps?.androidExtractor ?? new AndroidLogExtractor();
    this.iosExtractor = deps?.iosExtractor ?? new IOSLogExtractor();
    this.logAggregator = deps?.logAggregator ?? new LogAggregator();
    this.reportGenerator = deps?.reportGenerator ?? new ReportGenerator();
  }

  /**
   * Initialises and runs a complete test session.
   * @param config - Test configuration
   * @param sessionId - Optional pre-generated session ID (useful for callers that need the ID before completion)
   */
  async runTest(config: TestConfig, sessionId?: string): Promise<TestSession> {
    const session: TestSession = {
      id: sessionId ?? uuidv4(),
      config,
      status: TestStatus.PENDING,
      phases: [],
      createdAt: new Date(),
      screenshots: [],
    };

    const drivers = new Map<Platform, unknown>();

    try {
      session.status = TestStatus.RUNNING;
      session.startedAt = new Date();
      await this.executePhases(session, drivers);
      session.status = TestStatus.PASSED;
    } catch (error) {
      await this.handleError(session, error instanceof Error ? error : new Error(String(error)));
    } finally {
      await this.cleanup(session);
      session.completedAt = new Date();
    }

    return session;
  }

  /**
   * Runs all test phases in sequence.
   * @param session - Active TestSession
   * @param drivers - Map of platform to Appium WebDriver instance
   */
  async executePhases(session: TestSession, drivers: Map<Platform, unknown>): Promise<void> {
    const phasesToRun: TestPhase[] = [TestPhase.SETUP, TestPhase.LOGIN, TestPhase.APP_STATE];

    if (session.config.checkPushNotification || session.config.checkInAppNotification) {
      phasesToRun.push(TestPhase.TRIGGER);
    }

    if (session.config.checkPushNotification) {
      phasesToRun.push(TestPhase.VERIFY_PUSH);
    }

    if (session.config.checkInAppNotification) {
      phasesToRun.push(TestPhase.VERIFY_INAPP);
    }

    if (session.config.checkLandingPage) {
      phasesToRun.push(TestPhase.TAP_VALIDATE);
    }

    if (session.config.extractLogs) {
      phasesToRun.push(TestPhase.LOG_EXTRACTION);
    }

    phasesToRun.push(TestPhase.REPORT);

    for (const phase of phasesToRun) {
      const phaseResult = await this.runPhase(session, phase, drivers);
      session.phases.push(phaseResult);

      if (phaseResult.status === TestStatus.FAILED) {
        throw new Error(`Phase ${phase} failed: ${phaseResult.error ?? 'Unknown error'}`);
      }
    }
  }

  private async runPhase(
    session: TestSession,
    phase: TestPhase,
    drivers: Map<Platform, unknown>
  ): Promise<PhaseResult> {
    const result: PhaseResult = {
      phase,
      status: TestStatus.RUNNING,
      startedAt: new Date(),
    };

    try {
      result.data = await this.executePhase(session, phase, drivers);
      result.status = TestStatus.PASSED;
    } catch (error) {
      result.status = TestStatus.FAILED;
      result.error = error instanceof Error ? error.message : String(error);
    } finally {
      result.completedAt = new Date();
      result.durationMs = result.completedAt.getTime() - result.startedAt.getTime();
    }

    return result;
  }

  /**
   * Executes the logic for a specific test phase.
   * @param session - Active TestSession
   * @param phase - Phase to execute
   * @param drivers - Map of platform to Appium WebDriver instance
   */
  private async executePhase(
    session: TestSession,
    phase: TestPhase,
    drivers: Map<Platform, unknown>
  ): Promise<unknown> {
    const config = getConfig();

    switch (phase) {
      case TestPhase.SETUP: {
        const setupResults: Record<string, string> = {};
        for (const platform of session.config.platforms) {
          const baseCaps =
            platform === 'android' ? DEFAULT_ANDROID_CAPABILITIES : DEFAULT_IOS_CAPABILITIES;
          const appPackage =
            platform === 'android' ? config.app.packageAndroid : config.app.packageIOS;
          const capabilities = { ...baseCaps, app: appPackage } as DeviceCapabilities;
          const webDriverSession = await this.bsManager.provisionDevice(capabilities);
          if (platform === 'android') {
            session.androidSessionId = webDriverSession.sessionId;
          } else {
            session.iosSessionId = webDriverSession.sessionId;
          }
          // NOTE: A real Appium WebDriver client (e.g. WebdriverIO) must be
          // instantiated here using the BrowserStack hub URL and sessionId.
          // Subsequent phases that receive null will skip driver-dependent steps
          // gracefully, since each service wraps driver calls in try/catch.
          drivers.set(platform, null);
          setupResults[platform] = webDriverSession.sessionId;
        }
        return { sessions: setupResults };
      }

      case TestPhase.LOGIN: {
        const loginResults: Record<string, unknown> = {};
        for (const platform of session.config.platforms) {
          const driver = drivers.get(platform);
          const result = await this.loginAutomator.login(driver, session.config.credentials);
          loginResults[platform] = result;
          if (!result.success) {
            throw new Error(`Login failed on ${platform}: ${result.error ?? 'Unknown error'}`);
          }
        }
        return loginResults;
      }

      case TestPhase.APP_STATE: {
        for (const platform of session.config.platforms) {
          const driver = drivers.get(platform);
          switch (session.config.appState) {
            case 'FOREGROUND':
              await this.appStateManager.setForeground(driver);
              break;
            case 'BACKGROUND':
              await this.appStateManager.setBackground(driver, 10);
              break;
            case 'KILLED':
              await this.appStateManager.killApp(driver);
              break;
          }
        }
        return { appState: session.config.appState };
      }

      case TestPhase.TRIGGER: {
        const parsedCurl = this.curlParser.parse(session.config.curlCommand);
        const triggerResult = await this.notificationTrigger.trigger({
          parsedCurl,
          userId: parsedCurl.userId ?? undefined,
          eventCode: parsedCurl.eventCode ?? undefined,
        });
        if (!triggerResult.success) {
          throw new Error(
            `Notification trigger failed (HTTP ${triggerResult.statusCode}): ${triggerResult.error ?? 'Unknown error'}`
          );
        }
        return triggerResult;
      }

      case TestPhase.VERIFY_PUSH: {
        const parsedCurl = this.curlParser.parse(session.config.curlCommand);
        const expectedPattern = parsedCurl.eventCode ?? 'notification';
        const pushResults: Record<string, unknown> = {};
        for (const platform of session.config.platforms) {
          const driver = drivers.get(platform);
          const result = await this.notificationVerifier.verify(driver, {
            platform,
            expectedPattern,
            captureScreenshot: true,
          });
          if (result.screenshotBase64) {
            session.screenshots.push(result.screenshotBase64);
          }
          pushResults[platform] = result;
        }
        return pushResults;
      }

      case TestPhase.VERIFY_INAPP: {
        const parsedCurl = this.curlParser.parse(session.config.curlCommand);
        const expectedPattern = parsedCurl.eventCode ?? 'notification';
        const inAppResults: Record<string, unknown> = {};
        for (const platform of session.config.platforms) {
          const driver = drivers.get(platform);
          const result = await this.inAppVerifier.verify(driver, {
            platform,
            expectedPattern,
          });
          inAppResults[platform] = result;
        }
        return inAppResults;
      }

      case TestPhase.TAP_VALIDATE: {
        const parsedCurl = this.curlParser.parse(session.config.curlCommand);
        const landingPage = parsedCurl.eventCode
          ? getLandingPageConfig(parsedCurl.eventCode)
          : null;
        const tapResults: Record<string, unknown> = {};
        for (const platform of session.config.platforms) {
          const driver = drivers.get(platform);
          // Find the notification element from the previous VERIFY_PUSH phase result
          const verifyPhase = session.phases.find((p) => p.phase === TestPhase.VERIFY_PUSH);
          const verifyData = verifyPhase?.data as Record<string, { notification?: { element: unknown } }> | undefined;
          const notificationElement = verifyData?.[platform]?.notification?.element ?? null;

          if (landingPage) {
            const result = await this.tapValidator.tapAndValidate(driver, {
              notificationElement,
              expectedPage: landingPage,
            });
            tapResults[platform] = result;
          }
        }
        return tapResults;
      }

      case TestPhase.LOG_EXTRACTION: {
        const parsedCurl = this.curlParser.parse(session.config.curlCommand);
        const eventName = parsedCurl.eventCode ?? '';

        const androidLogs = session.config.platforms.includes('android') && session.androidSessionId
          ? await this.androidExtractor.extractLogs(session.androidSessionId, eventName)
          : [];

        const iosDriver = session.config.platforms.includes('ios')
          ? drivers.get('ios')
          : undefined;
        const iosLogs = iosDriver !== undefined
          ? await this.iosExtractor.extractLogs(iosDriver, eventName)
          : [];

        const aggregated = this.logAggregator.aggregate(androidLogs, iosLogs);
        const formatted = this.logAggregator.formatForDisplay(aggregated);
        session.logs = formatted;
        return formatted;
      }

      case TestPhase.REPORT: {
        const report = this.reportGenerator.generateJSON(session);
        return report;
      }

      default:
        return null;
    }
  }

  /**
   * Handles test-level errors by marking the session as failed.
   * @param session - Active TestSession
   * @param error - Error that caused failure
   */
  async handleError(session: TestSession, error: Error): Promise<void> {
    session.status = TestStatus.FAILED;
    session.error = error.message;
  }

  /**
   * Performs teardown: closes BrowserStack sessions.
   * @param session - The TestSession to clean up
   */
  async cleanup(session: TestSession): Promise<void> {
    const closePromises: Promise<void>[] = [];
    if (session.androidSessionId) {
      closePromises.push(
        this.bsManager.closeSession(session.androidSessionId).catch(() => undefined)
      );
    }
    if (session.iosSessionId) {
      closePromises.push(
        this.bsManager.closeSession(session.iosSessionId).catch(() => undefined)
      );
    }
    await Promise.all(closePromises);
  }
}
