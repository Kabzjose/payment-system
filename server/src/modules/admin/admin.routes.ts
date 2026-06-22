import { Router } from 'express';
import { z } from 'zod';
import { adminController } from './admin.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

// Both middlewares run on every admin route
// requireAuth first (verify JWT), then requireAdmin (verify is_admin)
router.use(requireAuth);
router.use(requireAdmin);

// ── Read routes ───────────────────────────────────────────────────────────────
router.get('/stats',            adminController.getStats);
router.get('/payments',         adminController.getAllPayments);
router.get('/users',            adminController.getAllUsers);
router.get('/users/:id',        adminController.getUserDetail);

// ── Action schemas ────────────────────────────────────────────────────────────
const refundSchema = z.object({
  amount: z.number().int().positive().optional(),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional(),
});

const cancelSubSchema = z.object({
  immediately: z.boolean().optional(),
});

const suspendSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

// ── Mutating routes ───────────────────────────────────────────────────────────
router.post('/payments/:id/refund',       validate(refundSchema),    adminController.adminRefund);
router.post('/subscriptions/:id/cancel',  validate(cancelSubSchema), adminController.adminCancelSubscription);
router.post('/users/:id/suspend',         validate(suspendSchema),   adminController.suspendUser);
router.post('/users/:id/unsuspend',                                  adminController.unsuspendUser);

export default router;