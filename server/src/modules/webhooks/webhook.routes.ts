import { Router } from 'express';
import { webhookController } from './webhook.controller';

const router = Router();
// Security is handled by signature verification inside the service
router.post('/stripe', webhookController.handleStripe);

export default router;