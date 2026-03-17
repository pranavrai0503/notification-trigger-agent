import { Router, Request, Response, NextFunction } from 'express';
import { CurlParser } from '../services/curl-parser';
import { validateCurlCommand, validateParsedCurl } from '../utils/curl-validator';

const router = Router();
const parser = new CurlParser();

/**
 * POST /api/curl/parse
 * Parses a cURL command string and returns structured request data.
 */
router.post(
  '/parse',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { curl } = req.body as { curl?: string };

      if (!curl) {
        res.status(400).json({ error: 'curl field is required' });
        return;
      }

      if (!validateCurlCommand(curl)) {
        res.status(400).json({ error: 'Invalid cURL command' });
        return;
      }

      const parsed = parser.parse(curl);
      const { valid, errors } = validateParsedCurl(parsed);

      if (!valid) {
        res.status(422).json({ error: 'Parsed cURL is invalid', details: errors });
        return;
      }

      res.json({ success: true, data: parsed });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
