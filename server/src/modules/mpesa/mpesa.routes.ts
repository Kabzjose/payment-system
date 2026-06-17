import { Router } from 'express';
import { z } from 'zod';
import { mpesaController } from './mpesa.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const stkPushSchema = z.object({
  phone: z.string().min(9, 'Invalid phone number'),
  amount: z
    .number()
    .int('Amount must be a whole number (no cents in M-Pesa)')
    .min(1, 'Minimum amount is KES 1'),
  account_reference: z.string().max(12).optional(),
  description: z.string().max(13).optional(),
});

// Protected — user must be logged in to initiate payment
router.post('/', requireAuth, validate(stkPushSchema), mpesaController.initiateSTKPush);
router.get('/', requireAuth, mpesaController.getUserPayments);
router.get('/:id', requireAuth, mpesaController.getPayment);

// Public — Safaricom calls this, no JWT
router.post('/callback', mpesaController.handleCallback);

export default router;