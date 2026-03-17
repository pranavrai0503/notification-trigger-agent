import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TestOrchestrator } from '../services/test-orchestrator';
import { TestConfig, TestSession, TestStatus } from '../types/test-session';
import {
  ITestSessionRepository,
  TestSessionRepository,
} from '../repository/test-session.repository';

/**
 * Creates a tests router backed by the supplied repository and orchestrator.
 * In production the defaults (real implementations) are used.
 * Pass test-doubles during testing to avoid database and BrowserStack calls.
 * @param repo - Optional repository override for dependency injection
 * @param orchestratorInstance - Optional orchestrator override for dependency injection
 */
export function createTestsRouter(
  repo?: ITestSessionRepository,
  orchestratorInstance?: TestOrchestrator
): Router {
  const router = Router();
  const sessionRepo: ITestSessionRepository = repo ?? new TestSessionRepository();
  const orchestrator = orchestratorInstance ?? new TestOrchestrator();

  /**
   * POST /api/tests/start
   * Starts a new test session asynchronously and returns the session ID immediately.
   */
  router.post(
    '/start',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const config = req.body as TestConfig;
        const sessionId = uuidv4();

        const pendingSession: TestSession = {
          id: sessionId,
          config,
          status: TestStatus.PENDING,
          phases: [],
          createdAt: new Date(),
          screenshots: [],
        };

        // Persist the pending session immediately so callers can poll for status
        await sessionRepo.create(pendingSession);

        // Run the test asynchronously; persist the result when complete
        orchestrator.runTest(config, sessionId).then((completedSession) => {
          return sessionRepo.update(completedSession);
        }).catch(() => {
          // runTest handles all errors internally and returns the FAILED session.
          // This catch only fires on truly unexpected rejections – mark as failed.
          return sessionRepo.update({ ...pendingSession, status: TestStatus.FAILED });
        });

        res.status(202).json({ sessionId, status: TestStatus.PENDING });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/tests/:id
   * Returns the status and metadata of a test session.
   */
  router.get(
    '/:id',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const session = await sessionRepo.findById(req.params['id']);
        if (!session) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }
        res.json({ data: session });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/tests/:id/results
   * Returns the full results of a completed test session.
   */
  router.get(
    '/:id/results',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const session = await sessionRepo.findById(req.params['id']);
        if (!session) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }
        res.json({ data: { session, phases: session.phases, logs: session.logs } });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

export default createTestsRouter();
