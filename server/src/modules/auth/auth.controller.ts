import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';

export const authController = {

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err); // passes to errorHandler
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  // Protected route — requireAuth already verified the token
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.me(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

};