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
  STRIPE_BASIC_PRICE_ID: required('STRIPE_BASIC_PRICE_ID'),
  STRIPE_PRO_PRICE_ID: required('STRIPE_PRO_PRICE_ID'),

  // Mpesa
MPESA_CONSUMER_KEY: required('MPESA_CONSUMER_KEY'),
MPESA_CONSUMER_SECRET: required('MPESA_CONSUMER_SECRET'),
MPESA_SHORTCODE: required('MPESA_SHORTCODE'),
MPESA_PASSKEY: required('MPESA_PASSKEY'),
MPESA_CALLBACK_URL: required('MPESA_CALLBACK_URL'),
MPESA_ENVIRONMENT: (process.env.MPESA_ENVIRONMENT ?? 'sandbox') as 'sandbox' | 'production',
} as const;