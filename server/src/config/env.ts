import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '3000', 10),

  // Database
  DB_HOST: required('DB_HOST'),
  DB_PORT: parseInt(process.env.DB_PORT ?? '5432', 10),
  DB_NAME: required('DB_NAME'),
  DB_USER: required('DB_USER'),
  DB_PASSWORD: required('DB_PASSWORD'),

  // Auth
  JWT_SECRET: required('JWT_SECRET'),

  // Stripe
  STRIPE_SECRET_KEY: required('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: required('STRIPE_WEBHOOK_SECRET'),
} as const;