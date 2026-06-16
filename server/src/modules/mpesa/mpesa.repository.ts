import { db } from '../../config/db';
import { MpesaPayment } from '../../types';

export const mpesaRepository = {

  async create(data: {
    user_id: string;
    phone_number: string;
    amount: number;
    account_reference: string;
    transaction_desc: string;
    metadata?: Record<string, unknown>;
  }): Promise<MpesaPayment> {
    const { rows } = await db.query<MpesaPayment>(
      `INSERT INTO mpesa_payments
         (user_id, phone_number, amount, account_reference, transaction_desc, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.user_id,
        data.phone_number,
        data.amount,
        data.account_reference,
        data.transaction_desc,
        JSON.stringify(data.metadata ?? {}),
      ]
    );
    return rows[0];
  },

  async updateAfterStkPush(
    id: string,
    data: {
      checkout_request_id: string;
      merchant_request_id: string;
      status: 'processing';
    }
  ): Promise<MpesaPayment> {
    const { rows } = await db.query<MpesaPayment>(
      `UPDATE mpesa_payments
       SET checkout_request_id = $2,
           merchant_request_id = $3,
           status = $4,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, data.checkout_request_id, data.merchant_request_id, data.status]
    );
    return rows[0];
  },

  async updateFromCallback(
    checkoutRequestId: string,
    data: {
      status: 'succeeded' | 'failed' | 'cancelled';
      mpesa_receipt_number?: string;
      result_code: number;
      result_desc: string;
    }
  ): Promise<MpesaPayment | null> {
    const { rows } = await db.query<MpesaPayment>(
      `UPDATE mpesa_payments
       SET status = $2,
           mpesa_receipt_number = $3,
           result_code = $4,
           result_desc = $5,
           updated_at = NOW()
       WHERE checkout_request_id = $1
       RETURNING *`,
      [
        checkoutRequestId,
        data.status,
        data.mpesa_receipt_number ?? null,
        data.result_code,
        data.result_desc,
      ]
    );
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<MpesaPayment | null> {
    const { rows } = await db.query<MpesaPayment>(
      'SELECT * FROM mpesa_payments WHERE id = $1',
      [id]
    );
    return rows[0] ?? null;
  },

  async findByUserId(userId: string): Promise<MpesaPayment[]> {
    const { rows } = await db.query<MpesaPayment>(
      `SELECT * FROM mpesa_payments
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  },

  async findByCheckoutRequestId(
    checkoutRequestId: string
  ): Promise<MpesaPayment | null> {
    const { rows } = await db.query<MpesaPayment>(
      'SELECT * FROM mpesa_payments WHERE checkout_request_id = $1',
      [checkoutRequestId]
    );
    return rows[0] ?? null;
  },

};