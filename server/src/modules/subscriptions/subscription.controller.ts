import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from './subscription.service';

export const subscriptionController = {

  async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await subscriptionService.getPlans();
      res.json({ success: true, data: plans });
    } catch (err) {
      next(err);
    }
  },

  async createSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await subscriptionService.createSubscription({
        userId: req.user!.userId,
        planId: req.body.plan_id,
        paymentMethodId: req.body.payment_method_id,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getUserSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const subs = await subscriptionService.getUserSubscriptions(req.user!.userId);
      res.json({ success: true, data: subs });
    } catch (err) {
      next(err);
    }
  },

  async getSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionService.getSubscription(
        req.params.id as string,
        req.user!.userId
      );
      res.json({ success: true, data: sub });
    } catch (err) {
      next(err);
    }
  },

  async cancelSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionService.cancelSubscription({
        userId: req.user!.userId,
        subscriptionId: req.params.id as string,
        immediately: req.body.immediately ?? false,
      });
      res.json({ success: true, data: sub });
    } catch (err) {
      next(err);
    }
  },

  async changePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionService.changePlan({
        userId: req.user!.userId,
        subscriptionId: req.params.id as string,
        newPlanId: req.body.plan_id,
      });
      res.json({ success: true, data: sub });
    } catch (err) {
      next(err);
    }
  },

};