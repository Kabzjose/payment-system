import { Router } from 'express';
import { z } from 'zod';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

// Protected routes
router.get('/me', requireAuth, authController.me);
router.patch('/profile', requireAuth, validate(updateProfileSchema), authController.updateProfile);

export default router;