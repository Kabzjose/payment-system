import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/errors';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // parse() throws ZodError if invalid; returns typed, coerced data if valid
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        // Format Zod's errors into a readable shape
        const messages = err.issues.map(e => `${e.path.join('.')}: ${e.message}`);
        next(new AppError(`Validation failed: ${messages.join(', ')}`, 400));
      } else {
        next(err);
      }
    }
  };
}