import nodemailer from 'nodemailer';
import { env } from './env';

/**
 * Nodemailer transporter singleton.
 *
 * Gmail notes:
 *  - Port 465  → secure: true  (implicit TLS / SMTPS)
 *  - Port 587  → secure: false (STARTTLS, the typical app-password setup)
 *  - SMTP_USER must be your full Gmail address.
 *  - SMTP_PASS must be a 16-character Google "App Password" — NOT your
 *    regular account password.  Generate one at:
 *    Google Account → Security → 2-Step Verification → App passwords
 */
export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,   // true → port 465 | false → port 587
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  // Optional: enable connection pooling for high email volume
  // pool: true,
  // maxConnections: 5,
  // maxMessages: 100,
});