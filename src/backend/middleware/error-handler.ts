import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  code?: string;
}

/**
 * Central Express error-handling middleware.
 * Formats errors into consistent JSON responses.
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const status = err.status ?? 500;
  const isDev = process.env['NODE_ENV'] !== 'production';

  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code,
      ...(isDev && { stack: err.stack }),
    },
  });
}

/**
 * Creates a typed AppError with a given HTTP status code.
 * @param message - Error message
 * @param status - HTTP status code
 * @param code - Optional error code string
 */
export function createError(message: string, status: number, code?: string): AppError {
  const error = new Error(message) as AppError;
  error.status = status;
  error.code = code;
  return error;
}
