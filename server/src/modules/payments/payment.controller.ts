import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';

export const paymentController = {

  async createPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.createPaymentIntent({
        userId: req.user!.userId,
        amount: req.body.amount,
        currency: req.body.currency,
        metadata: req.body.metadata,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.getPaymentIntent(
        req.params.id as string,
        req.user!.userId
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getUserPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const payments = await paymentService.getUserPayments(req.user!.userId);
      res.json({ success: true, data: payments });
    } catch (err) {
      next(err);
    }
  },

  async refund(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await paymentService.refund({
        paymentIntentId: req.params.id as string,
        userId: req.user!.userId,
        amount: req.body.amount,
        reason: req.body.reason,
      });
      res.json({ success: true, data: transaction });
    } catch (err) {
      next(err);
    }
  },

};