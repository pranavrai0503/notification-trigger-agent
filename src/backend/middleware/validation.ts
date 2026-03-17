import { Request, Response, NextFunction } from 'express';

type Schema = Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>;

/**
 * Builds a middleware that validates required body fields against a schema.
 * @param schema - Map of field names to expected types
 */
export function validateBody(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    const body = req.body as Record<string, unknown>;

    for (const [field, expectedType] of Object.entries(schema)) {
      if (!(field in body) || body[field] === undefined || body[field] === null) {
        errors.push(`'${field}' is required`);
        continue;
      }

      const actualType = Array.isArray(body[field]) ? 'array' : typeof body[field];
      if (actualType !== expectedType) {
        errors.push(`'${field}' must be of type ${expectedType}, got ${actualType}`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    next();
  };
}

/**
 * Validates that Content-Type is application/json for POST/PUT/PATCH requests.
 */
export function requireJson(req: Request, res: Response, next: NextFunction): void {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'] ?? '';
    if (!contentType.includes('application/json')) {
      res.status(415).json({ error: 'Content-Type must be application/json' });
      return;
    }
  }
  next();
}
