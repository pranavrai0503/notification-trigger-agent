import { Router, Request, Response, NextFunction } from 'express';
import { TestOrchestrator } from '../services/test-orchestrator';
import { TestConfig } from '../types/test-session';

const router = Router();
const orchestrator = new TestOrchestrator();

// In-memory store for demo; replace with DB repository in production
const sessions: Map<string, Awaited<ReturnType<TestOrchestrator['runTest']>>> = new Map();

/**
 * POST /api/tests/start
 * Starts a new test session.
 */
router.post(
  '/start',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = req.body as TestConfig;
      // Run async, return immediately with session id
      const sessionPromise = orchestrator.runTest(config);
      // Grab id before the run completes
      const partialSession = await Promise.race([
        sessionPromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 100)),
      ]).catch(() => null);

      if (partialSession) {
        sessions.set(partialSession.id, partialSession);
        res.status(202).json({ sessionId: partialSession.id, status: partialSession.status });
      } else {
        res.status(202).json({ message: 'Test session started' });
      }
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
