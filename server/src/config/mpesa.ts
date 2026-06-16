import { env } from './env';

// Daraja API base URLs
export const MPESA_BASE_URL =
  env.MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

// Generates the password Daraja expects for each STK push request.
// Format: Base64(Shortcode + Passkey + Timestamp)
// The timestamp must be in YYYYMMDDHHmmss format.
export function generateMpesaPassword(timestamp: string): string {
  const raw = `${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(raw).toString('base64');
}

export function getMpesaTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14); // YYYYMMDDHHmmss
}

// Normalize phone number to Safaricom's required format: 254XXXXXXXXX
// Accepts: 0712345678, +254712345678, 254712345678
export function normalizeMpesaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('254') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.startsWith('7') && digits.length === 9) return `254${digits}`;

  throw new Error(`Invalid phone number format: ${phone}`);
}