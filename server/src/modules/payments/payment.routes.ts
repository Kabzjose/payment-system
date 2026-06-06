import { Router } from 'express';
import { z } from 'zod';
import { paymentController } from './payment.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

// All payment routes require auth
router.use(requireAuth);

const createPaymentIntentSchema = z.object({
  amount: z.coerce
    .number('Amount is required')
    .int('Amount must be an integer (cents)')
    .min(50, 'Minimum amount is 50 cents'),
  currency: z
  .string()
  .length(3)
  .transform(v => v.toLowerCase())
  .refine(
    c => ['usd', 'eur', 'gbp'].includes(c),
    'Unsupported currency'
  ),
   metadata: z.record(z.string(), z.string()).optional(),
});

const refundSchema = z.object({
  amount: z.number().int().positive().optional(),
  reason: z
    .enum(['duplicate', 'fraudulent', 'requested_by_customer'])
    .optional(),
});

router.post('/', validate(createPaymentIntentSchema), paymentController.createPaymentIntent);
router.get('/', paymentController.getUserPayments);
router.get('/:id', paymentController.getPaymentIntent);
router.post('/:id/refund', validate(refundSchema), paymentController.refund);

export default router;