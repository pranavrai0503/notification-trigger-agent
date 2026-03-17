import { Router, Request, Response, NextFunction } from 'express';
import { ILogRepository, LogRepository } from '../repository/log.repository';

/**
 * Creates a logs router backed by the supplied repository.
 * In production the default (real) {@link LogRepository} is used.
 * Pass a test-double during testing to avoid touching the database.
 * @param repo - Optional repository override for dependency injection
 */
export function createLogsRouter(repo?: ILogRepository): Router {
  const router = Router();
  const logRepo: ILogRepository = repo ?? new LogRepository();

  /**
   * GET /api/logs/:id
   * Returns all logs for a session.
   */
  router.get(
    '/:id',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const logs = await logRepo.findAll(req.params['id']);
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
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const logs = await logRepo.findByEvent(
          req.params['id'],
          req.params['eventName']
        );
        res.json({ data: logs });
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
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const newLogs = Array.isArray(req.body) ? req.body : [req.body];
        await logRepo.append(req.params['id'], newLogs);
        res.status(201).json({ success: true, count: newLogs.length });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

export default createLogsRouter();
