import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { userRepository } from '../users/user.repository';
import { AppError } from '../../utils/errors';

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
}

export const authService = {

  async register(data: { email: string; name: string; password: string }) {
    // 1. Check email not already taken
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    // 2. Hash password — bcrypt generates a salt internally
    const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // 3. Create user
    const user = await userRepository.create({
      email: data.email,
      name: data.name,
      password_hash,
    });

    // 4. Issue token
    const token = generateToken({ userId: user.id, email: user.email });

    // 5. Never return the password hash
    const { password_hash: _, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async login(data: { email: string; password: string }) {
    // 1. Find user
    const user = await userRepository.findByEmail(data.email);


    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // 2. Verify password
    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      throw new AppError('Invalid credentials', 401);
    }

    // 3. Issue token
    const token = generateToken({ userId: user.id, email: user.email });

    const { password_hash: _, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const { password_hash: _, ...safeUser } = user;
    return { user: safeUser };
  },

  async updateProfile(
    userId: string,
    data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }
  ) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const updates: Partial<{ name: string; email: string; password_hash: string }> = {};

    if (data.name !== undefined) {
      if (data.name.trim().length < 2) throw new AppError('Name must be at least 2 characters', 400);
      updates.name = data.name.trim();
    }

    if (data.email !== undefined && data.email !== user.email) {
      const existing = await userRepository.findByEmail(data.email);
      if (existing) throw new AppError('Email already in use', 409);
      updates.email = data.email;
    }

    if (data.newPassword) {
      if (!data.currentPassword) throw new AppError('Current password is required to set a new one', 400);
      const valid = await bcrypt.compare(data.currentPassword, user.password_hash);
      if (!valid) throw new AppError('Current password is incorrect', 401);
      if (data.newPassword.length < 8) throw new AppError('New password must be at least 8 characters', 400);
      updates.password_hash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
    }

    const updated = await userRepository.updateById(userId, updates);
    if (!updated) throw new AppError('Update failed', 500);
    const { password_hash: _, ...safeUser } = updated;
    return { user: safeUser };
  },

};

function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}