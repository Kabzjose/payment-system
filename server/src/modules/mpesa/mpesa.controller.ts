import { Request, Response, NextFunction } from 'express';
import { mpesaService } from './mpesa.service';

export const mpesaController = {

  async initiateSTKPush(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await mpesaService.initiateSTKPush({
        userId: req.user!.userId,
        phone: req.body.phone,
        amount: req.body.amount,
        accountReference: req.body.account_reference ?? 'Payment',
        description: req.body.description ?? 'Payment',
      });

      res.status(201).json({
        success: true,
        data: payment,
        message: 'STK push sent to your phone. Enter your M-Pesa PIN to complete.',
      });
    } catch (err) {
      next(err);
    }
  },

  // Safaricom calls this — no auth, just Daraja's callback body
  async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      await mpesaService.handleCallback(req.body);
      // Daraja expects a specific acknowledgement format
      res.json({
        ResultCode: 0,
        ResultDesc: 'Confirmation Received Successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  async getPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await mpesaService.getPayment(
        req.params.id as string,
        req.user!.userId
      );
      res.json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  },

  async getUserPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const payments = await mpesaService.getUserPayments(req.user!.userId);
      res.json({ success: true, data: payments });
    } catch (err) {
      next(err);
    }
  },

};