import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';

export const adminController = {

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },

  async getAllPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getAllPayments({
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        method: req.query.method as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getAllUsers({
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        search: req.query.search as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getUserDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const detail = await adminService.getUserDetail(req.params.id as string);
      res.json({ success: true, data: detail });
    } catch (err) {
      next(err);
    }
  },

};