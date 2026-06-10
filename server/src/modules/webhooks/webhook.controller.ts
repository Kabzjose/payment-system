import { Request, Response, NextFunction } from 'express';
import { webhookService } from './webhook.service';
import { logger } from '../../utils/logger';

export const webhookController = {

  async handleStripe(req: Request, res: Response, next: NextFunction) {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      res.status(400).json({ error: 'Missing Stripe-Signature header' });
      return;
    }

    try {
      // req.body is a raw Buffer here — set up in app.ts Phase 1
      await webhookService.processEvent(
        req.body as Buffer,
        signature as string
      );

      // Always respond 200 quickly — Stripe expects this within 30s
      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  },

};