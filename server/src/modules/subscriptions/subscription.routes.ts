import { Router } from 'express';
import { z } from 'zod';
import { subscriptionController } from './subscription.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

router.use(requireAuth);

const createSchema = z.object({
  plan_id: z.string().uuid('Invalid plan ID'),
  payment_method_id: z.string().min(1, 'Payment method required'),
});

const cancelSchema = z.object({
  immediately: z.boolean().optional(),
});

const changePlanSchema = z.object({
  plan_id: z.string().uuid('Invalid plan ID'),
});

router.get('/plans', subscriptionController.getPlans);
router.post('/', validate(createSchema), subscriptionController.createSubscription);
router.get('/', subscriptionController.getUserSubscriptions);
router.get('/:id', subscriptionController.getSubscription);
router.post('/:id/cancel', validate(cancelSchema), subscriptionController.cancelSubscription);
router.post('/:id/change-plan', validate(changePlanSchema), subscriptionController.changePlan);

export default router;