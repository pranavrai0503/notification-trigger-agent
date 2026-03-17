import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TestOrchestrator } from '../services/test-orchestrator';
import { TestConfig, TestSession, TestStatus } from '../types/test-session';

const router = Router();
const orchestrator = new TestOrchestrator();

// In-memory store for demo; replace with DB repository in production
const sessions: Map<string, TestSession> = new Map();

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

      // Store a pending session immediately so callers can poll for status
      const pendingSession: TestSession = {
        id: sessionId,
        config,
        status: TestStatus.PENDING,
        phases: [],
        createdAt: new Date(),
        screenshots: [],
      };
      sessions.set(sessionId, pendingSession);

      // Run the test asynchronously; update the store when it completes
      orchestrator.runTest(config, sessionId).then((completedSession) => {
        sessions.set(completedSession.id, completedSession);
      }).catch(() => {
        // runTest handles all errors internally and returns the FAILED session,
        // so this catch only fires on truly unexpected rejections.
        const existing = sessions.get(sessionId);
        if (existing) {
          sessions.set(sessionId, { ...existing, status: TestStatus.FAILED });
        }
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
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const session = sessions.get(req.params['id']);
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
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const session = sessions.get(req.params['id']);
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

export default router;
