import { v4 as uuidv4 } from 'uuid';
import {
  TestConfig,
  TestSession,
  TestStatus,
  TestPhase,
  PhaseResult,
} from '../types/test-session';

/**
 * Orchestrates the full end-to-end notification test lifecycle.
 */
export class TestOrchestrator {
  /**
   * Initialises and runs a complete test session.
   * @param config - Test configuration
   */
  async runTest(config: TestConfig): Promise<TestSession> {
    const session: TestSession = {
      id: uuidv4(),
      config,
      status: TestStatus.PENDING,
      phases: [],
      createdAt: new Date(),
      screenshots: [],
    };

    try {
      session.status = TestStatus.RUNNING;
      session.startedAt = new Date();
      await this.executePhases(session);
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
   */
  async executePhases(session: TestSession): Promise<void> {
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
      const phaseResult = await this.runPhase(session, phase);
      session.phases.push(phaseResult);

      if (phaseResult.status === TestStatus.FAILED) {
        throw new Error(`Phase ${phase} failed: ${phaseResult.error ?? 'Unknown error'}`);
      }
    }
  }

  private async runPhase(session: TestSession, phase: TestPhase): Promise<PhaseResult> {
    const result: PhaseResult = {
      phase,
      status: TestStatus.RUNNING,
      startedAt: new Date(),
    };

    try {
      // Phase-specific logic would be injected via dependency injection in a real implementation
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
    // Close any open device sessions
    const { BrowserStackManager } = await import('./browserstack-manager');
    const manager = new BrowserStackManager();

    const closePromises: Promise<void>[] = [];
    if (session.androidSessionId) {
      closePromises.push(
        manager.closeSession(session.androidSessionId).catch(() => undefined)
      );
    }
    if (session.iosSessionId) {
      closePromises.push(
        manager.closeSession(session.iosSessionId).catch(() => undefined)
      );
    }

    await Promise.all(closePromises);
  }
}
