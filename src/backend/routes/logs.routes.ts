import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// Simulated log store (replace with DB in production)
const logStore: Map<string, unknown[]> = new Map();

/**
 * GET /api/logs/:id
 * Returns all logs for a session.
 */
router.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const logs = logStore.get(req.params['id']) ?? [];
      res.json({ data: logs });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/logs/:id/event/:eventName
 * Returns logs filtered by event name.
 */
router.get(
  '/:id/event/:eventName',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const logs = (logStore.get(req.params['id']) ?? []) as Array<{ eventName?: string }>;
      const filtered = logs.filter(
        (l) => l.eventName === req.params['eventName']
      );
      res.json({ data: filtered });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/logs/:id
 * Appends logs for a session.
 */
router.post(
  '/:id',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = req.params['id'];
      const existing = logStore.get(id) ?? [];
      const newLogs = Array.isArray(req.body) ? req.body : [req.body];
      logStore.set(id, [...existing, ...newLogs]);
      res.status(201).json({ success: true, count: newLogs.length });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
