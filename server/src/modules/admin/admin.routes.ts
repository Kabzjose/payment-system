import { Router } from 'express';
import { adminController } from './admin.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';

const router = Router();

// Both middlewares run on every admin route
// requireAuth first (verify JWT), then requireAdmin (verify is_admin)
router.use(requireAuth);
router.use(requireAdmin);

router.get('/stats',            adminController.getStats);
router.get('/payments',         adminController.getAllPayments);
router.get('/users',            adminController.getAllUsers);
router.get('/users/:id',        adminController.getUserDetail);

export default router;