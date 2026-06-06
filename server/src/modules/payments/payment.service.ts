import { stripe } from '../../config/stripe';
import { paymentRepository } from './payment.repository';
import { customerRepository } from '../customers/customer.repository';
import { userRepository } from '../users/user.repository';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export const paymentService = {

  // Get or create a Stripe customer for this user
  // Called before every payment — ensures every paying user has a Stripe customer
  async getOrCreateCustomer(userId: string) {
    
    const existing = await customerRepository.findByUserId(userId);
    if (existing) return existing;

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    // Create customer in Stripe
    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });

    // Mirror in our DB
    const customer = await customerRepository.create({
      user_id: userId,
      stripe_customer_id: stripeCustomer.id,
    });

    logger.info({ userId, stripeCustomerId: stripeCustomer.id }, 'Customer created');
    return customer;
  },

  async createPaymentIntent(data: {
    userId: string;
    amount: number;      // in cents
    currency: string;
    metadata?: Record<string, string>;
  }) {
    // Validate amount
    if (data.amount < 50) {
      throw new AppError('Amount must be at least 50 cents', 400);
    }

    // 1. Ensure customer exists
    const customer = await paymentService.getOrCreateCustomer(data.userId);

    // 2. Create local record first — we own the ID
    const localIntent = await paymentRepository.createPaymentIntent({
      user_id: data.userId,
      customer_id: customer.id,
      amount: data.amount,
      currency: data.currency.toLowerCase(),
      metadata: data.metadata,
    });

    // 3. Create PaymentIntent in Stripe
    // Use our local ID as idempotency key — safe to retry
    const stripeIntent = await stripe.paymentIntents.create(
      {
        amount: data.amount,
        currency: data.currency.toLowerCase(),
        customer: customer.stripe_customer_id,
        metadata: {
          localPaymentIntentId: localIntent.id,
          userId: data.userId,
          ...data.metadata,
        },
        // automatic_payment_methods lets Stripe handle card, apple pay etc
        automatic_payment_methods: { enabled: true },
      },
      {
        idempotencyKey: `pi_create_${localIntent.id}`,
      }
    );

    // 4. Update local record with Stripe's ID
    const updated = await paymentRepository.updatePaymentIntent(localIntent.id, {
      stripe_payment_intent_id: stripeIntent.id,
      status: stripeIntent.status as any,
    });

    logger.info(
      { localId: localIntent.id, stripeId: stripeIntent.id, amount: data.amount },
      'PaymentIntent created'
    );

    return {
      paymentIntent: updated,
      // client_secret goes to the frontend — it uses this to confirm payment
      clientSecret: stripeIntent.client_secret,
    };
  },

  async getPaymentIntent(id: string, userId: string) {
    const intent = await paymentRepository.findById(id);

    if (!intent) throw new AppError('Payment not found', 404);

    // Ensure users can only see their own payments
    if (intent.user_id !== userId) {
      throw new AppError('Forbidden', 403);
    }

    const transactions = await paymentRepository
      .findTransactionsByPaymentIntentId(id);

    return { ...intent, transactions };
  },

  async getUserPayments(userId: string) {
    return paymentRepository.findByUserId(userId);
  },

  async refund(data: {
    paymentIntentId: string;
    userId: string;
    amount?: number;   // partial refund if provided, full refund if not
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  }) {
    const intent = await paymentRepository.findById(data.paymentIntentId);

    if (!intent) throw new AppError('Payment not found', 404);
    if (intent.user_id !== data.userId) throw new AppError('Forbidden', 403);
    if (intent.status !== 'succeeded') {
      throw new AppError('Only succeeded payments can be refunded', 400);
    }
    if (!intent.stripe_payment_intent_id) {
      throw new AppError('No Stripe payment found', 400);
    }

    const refundAmount = data.amount ?? intent.amount;
    const isPartial = refundAmount < intent.amount;

    // Create refund in Stripe
    const refund = await stripe.refunds.create(
      {
        payment_intent: intent.stripe_payment_intent_id,
        amount: refundAmount,
        reason: data.reason ?? 'requested_by_customer',
      },
      {
        idempotencyKey: `refund_${data.paymentIntentId}_${refundAmount}`,
      }
    );

    // Record the transaction
    const transaction = await paymentRepository.createTransaction({
      payment_intent_id: data.paymentIntentId,
      amount: refundAmount,
      currency: intent.currency,
      type: isPartial ? 'partial_refund' : 'refund',
      status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
      stripe_charge_id: refund.id,
    });

    logger.info(
      { paymentIntentId: data.paymentIntentId, refundAmount },
      'Refund created'
    );

    return transaction;
  },

};