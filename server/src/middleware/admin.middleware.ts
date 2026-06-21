import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { AppError } from '../utils/errors';

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // requireAuth must run first — req.user is guaranteed here
    const { rows } = await db.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (!rows[0]?.is_admin) {
      throw new AppError('Admin access required', 403);
    }

    next();
  } catch (err) {
    next(err);
  }
}