import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction  // must be declared even if unused — Express requires 4 params
): void {
  // Operational errors: expected, safe to expose message
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Unexpected errors: log the full thing, hide details from client
  logger.error({ err, path: req.path, method: req.method }, 'Unexpected error');

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}