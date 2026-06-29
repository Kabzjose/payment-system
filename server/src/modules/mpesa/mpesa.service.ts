import axios from 'axios';
import { env } from '../../config/env';
import {
  MPESA_BASE_URL,
  generateMpesaPassword,
  getMpesaTimestamp,
  normalizeMpesaPhone,
} from '../../config/mpesa';
import { mpesaRepository } from './mpesa.repository';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { emailService } from '../../utils/email.service';
import { userRepository } from '../users/user.repository';

// ── Step 1: OAuth token ──────────────────────────────────────────────────
// Daraja requires a bearer token on every request. Tokens expire after 1 hour.
// We cache the token and only refresh when it expires.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const credentials = Buffer.from(
    `${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const response = await axios.get(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
    }
  );

  const token = response.data.access_token;
  const expiresIn = parseInt(response.data.expires_in, 10) * 1000; // convert to ms

  cachedToken = {
    value: token,
    expiresAt: Date.now() + expiresIn,
  };

  logger.debug('M-Pesa OAuth token refreshed');
  return token;
}

// ── Step 2: Initiate STK Push ─────────────────────────────────────────
export const mpesaService = {

  async initiateSTKPush(data: {
    userId: string;
    phone: string;
    amount: number; // in KES (whole shillings — M-Pesa doesn't use cents)
    accountReference: string;
    description: string;
  }) {
    // Validate amount — M-Pesa minimum is KES 1
    if (data.amount < 1) {
      throw new AppError('Minimum M-Pesa amount is KES 1', 400);
    }

    // Normalize phone number to 254XXXXXXXXX format
    let phone: string;
    try {
      phone = normalizeMpesaPhone(data.phone);
    } catch {
      throw new AppError('Invalid phone number. Use format: 0712345678 or +254712345678', 400);
    }

    // 1. Create local record first — same pattern as Stripe
    const localPayment = await mpesaRepository.create({
      user_id: data.userId,
      phone_number: phone,
      amount: data.amount,
      account_reference: data.accountReference,
      transaction_desc: data.description,
    });

    // 2. Get OAuth token
    const accessToken = await getAccessToken();
    const timestamp = getMpesaTimestamp();
    const password = generateMpesaPassword(timestamp);

    // 3. Send STK Push request to Daraja
    try {
      const response = await axios.post(
        `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: env.MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.round(data.amount), // must be integer
          PartyA: phone,             // customer phone
          PartyB: env.MPESA_SHORTCODE, // your shortcode
          PhoneNumber: phone,
          CallBackURL: env.MPESA_CALLBACK_URL,
          AccountReference: data.accountReference.slice(0, 12), // max 12 chars
          TransactionDesc: data.description.slice(0, 13),       // max 13 chars
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const { CheckoutRequestID, MerchantRequestID, ResponseCode, ResponseDescription } =
        response.data;

      if (ResponseCode !== '0') {
        throw new AppError(`M-Pesa error: ${ResponseDescription}`, 400);
      }

      // 4. Update local record with Daraja's IDs
      const updated = await mpesaRepository.updateAfterStkPush(localPayment.id, {
        checkout_request_id: CheckoutRequestID,
        merchant_request_id: MerchantRequestID,
        status: 'processing',
      });

      logger.info(
        { localId: localPayment.id, CheckoutRequestID, phone, amount: data.amount },
        'M-Pesa STK push initiated'
      );

      return updated;

    } catch (err: any) {
      // Log the failure but don't expose Daraja internals to the client
      logger.error({ err: err?.response?.data ?? err.message }, 'STK push failed');

      if (err instanceof AppError) throw err;
      throw new AppError('Failed to initiate M-Pesa payment. Try again.', 502);
    }
  },

  // ── Step 3: Handle callback from Safaricom ──────────────────────────
  async handleCallback(body: Record<string, unknown>) {
    // Daraja's callback structure is nested
    const stkCallback = (body?.Body as any)?.stkCallback;
    if (!stkCallback) {
      logger.warn({ body }, 'Invalid M-Pesa callback structure');
      return;
    }

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    logger.info({ CheckoutRequestID, ResultCode }, 'M-Pesa callback received');

    const existing = await mpesaRepository.findByCheckoutRequestId(CheckoutRequestID);
  if (!existing) {
    logger.error({ CheckoutRequestID }, 'No mpesa_payment found for this CheckoutRequestID');
    return;
  }

  logger.info({ found: existing.id, currentStatus: existing.status }, 'Found matching payment');

    let receiptNumber: string | null = null;
    
    // ResultCode 0 = success, anything else = failure
    if (ResultCode === 0) {
      // Extract the receipt number from the metadata items array
      const items: any[] = CallbackMetadata?.Item ?? [];
      const receiptItem = items.find((i: any) => i.Name === 'MpesaReceiptNumber');
      const receiptNumber = receiptItem?.Value ?? null;

      await mpesaRepository.updateFromCallback(CheckoutRequestID, {
        status: 'succeeded',
        mpesa_receipt_number: receiptNumber,
        result_code: ResultCode,
        result_desc: ResultDesc,
      });

      logger.info({ CheckoutRequestID, receiptNumber }, 'M-Pesa payment succeeded');

    } else {
      // Codes: 1032 = cancelled by user, 1037 = timeout, 2001 = wrong PIN
      const isCancelled = ResultCode === 1032;

      await mpesaRepository.updateFromCallback(CheckoutRequestID, {
        status: isCancelled ? 'cancelled' : 'failed',
        result_code: ResultCode,
        result_desc: ResultDesc,
      });

      logger.warn({ CheckoutRequestID, ResultCode, ResultDesc }, 'M-Pesa payment failed');
    }

    // Send email notification to user if payment succeeded

    const payment = await mpesaRepository.findByCheckoutRequestId(CheckoutRequestID);
    if (payment && receiptNumber) {
    const user = await userRepository.findById(payment.user_id);
    if (user) {
    await emailService.sendMpesaPaymentSucceeded(user.email, {
      name: user.name,
      amount: payment.amount,
      phoneNumber: payment.phone_number,
      receiptNumber,
      createdAt: new Date().toISOString(),
    });
  }
}
  },

  async getPayment(id: string, userId: string) {
    const payment = await mpesaRepository.findById(id);
    if (!payment) throw new AppError('Payment not found', 404);
    if (payment.user_id !== userId) throw new AppError('Forbidden', 403);
    return payment;
  },

  async getUserPayments(userId: string) {
    return mpesaRepository.findByUserId(userId);
  },

};