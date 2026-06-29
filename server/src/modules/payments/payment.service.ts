
import { stripe } from '../../config/stripe';
import { paymentRepository } from './payment.repository';
import { customerRepository } from '../customers/customer.repository';
import { userRepository } from '../users/user.repository';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { emailService } from '../../utils/email.service';


export const paymentService = {

  async getOrCreateCustomer(userId: string) {
    const existing = await customerRepository.findByUserId(userId);
    if (existing) return existing;

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });

    const customer = await customerRepository.create({
      user_id: userId,
      stripe_customer_id: stripeCustomer.id,
    });

    logger.info(
      { userId, stripeCustomerId: stripeCustomer.id },
      'Customer created'
    );

    return customer;
  },

  async createPaymentIntent(data: {
    userId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  }) {
    if (data.amount < 50) {
      throw new AppError('Amount must be at least 50 cents', 400);
    }

    const customer = await paymentService.getOrCreateCustomer(data.userId);

    const localIntent = await paymentRepository.createPaymentIntent({
      user_id: data.userId,
      customer_id: customer.id,
      amount: data.amount,
      currency: data.currency.toLowerCase(),
      metadata: data.metadata,
    });

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
        automatic_payment_methods: {
          enabled: true,
        },
      },
      {
        idempotencyKey: `pi_create_${localIntent.id}`,
      }
    );

    const updated = await paymentRepository.updatePaymentIntent(
      localIntent.id,
      {
        stripe_payment_intent_id: stripeIntent.id,
        status: stripeIntent.status as any,
      }
    );

    logger.info(
      {
        localId: localIntent.id,
        stripeId: stripeIntent.id,
        amount: data.amount,
      },
      'PaymentIntent created'
    );

    return {
      paymentIntent: updated,
      clientSecret: stripeIntent.client_secret,
    };
  },

  async getPaymentIntent(id: string, userId: string) {
    const intent = await paymentRepository.findById(id);

    if (!intent) {
      throw new AppError('Payment not found', 404);
    }

    if (intent.user_id !== userId) {
      throw new AppError('Forbidden', 403);
    }

    const transactions =
      await paymentRepository.findTransactionsByPaymentIntentId(id);

    return {
      ...intent,
      transactions,
    };
  },

  async getUserPayments(userId: string) {
    return paymentRepository.findByUserId(userId);
  },

  async refund(data: {
    paymentIntentId: string;
    userId: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  }) {
    const intent = await paymentRepository.findById(
      data.paymentIntentId
    );

    if (!intent) {
      throw new AppError('Payment not found', 404);
    }

    if (intent.user_id !== data.userId) {
      throw new AppError('Forbidden', 403);
    }

    if (intent.status !== 'succeeded') {
      throw new AppError(
        'Only succeeded payments can be refunded',
        400
      );
    }

    if (!intent.stripe_payment_intent_id) {
      throw new AppError('No Stripe payment found', 400);
    }

    const refundAmount = data.amount ?? intent.amount;

    //prevent negative or zero refunds
    if (refundAmount <= 0) {
      throw new AppError(
        'Refund amount must be greater than zero',
        400
      );
    }

    // prevent refund larger than original payment
    if (refundAmount > intent.amount) {
      throw new AppError(
        'Refund amount exceeds original payment',
        400
      );
    }

    // prevent cumulative over-refunding
    const existingTransactions =
      await paymentRepository.findTransactionsByPaymentIntentId(
        data.paymentIntentId
      );

    const alreadyRefunded = existingTransactions
      .filter(
        tx =>
          tx.status === 'succeeded' &&
          (tx.type === 'refund' ||
            tx.type === 'partial_refund')
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    if (alreadyRefunded + refundAmount > intent.amount) {
      throw new AppError(
        'Refund exceeds remaining refundable balance',
        400
      );
    }

    const isPartial =
      alreadyRefunded + refundAmount < intent.amount;

    const refund = await stripe.refunds.create(
      {
        payment_intent: intent.stripe_payment_intent_id,
        amount: refundAmount,
        reason:
          data.reason ?? 'requested_by_customer',
      },
      {
        idempotencyKey: `refund_${data.paymentIntentId}_${refundAmount}`,
      }
    );

    const transaction =
      await paymentRepository.createTransaction({
        payment_intent_id: data.paymentIntentId,
        amount: refundAmount,
        currency: intent.currency,
        type: isPartial ? 'partial_refund' : 'refund',
        status:
          refund.status === 'succeeded'
            ? 'succeeded'
            : 'pending',
        stripe_charge_id: refund.id,
      });

    logger.info(
      {
        paymentIntentId: data.paymentIntentId,
        refundAmount,
        alreadyRefunded,
      },
      'Refund created'
    );

    //send user email after refund
    const user = await userRepository.findById(data.userId);
    if (user) {
     await emailService.sendRefundIssued(user.email, {
      name: user.name,
      amount: refundAmount,
      currency: intent.currency,
      originalAmount: intent.amount,
      refundId: refund.id,
      createdAt: new Date().toISOString(),
    });
}
    ;

    return transaction;
  },
};

