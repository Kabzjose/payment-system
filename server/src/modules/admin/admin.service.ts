import { db } from '../../config/db';
import { stripe } from '../../config/stripe';
import { adminRepository } from './admin.repository';
import { paymentRepository } from '../payments/payment.repository';
import { subscriptionRepository } from '../subscriptions/subscription.repository';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { emailService } from '../../utils/email.service';

export const adminService = {

  async getStats() {
    const raw = await adminRepository.getStats();

    return {
      totalRevenueCents: parseInt(raw.total_revenue_cents, 10),
      stripeRevenueCents: parseInt(raw.stripe_revenue_cents, 10),
      mpesaRevenueCents: parseInt(raw.mpesa_revenue_cents, 10),
      totalUsers: parseInt(raw.total_users, 10),
      adminUsers: parseInt(raw.admin_users, 10),
      activeSubscriptions: parseInt(raw.active_subscriptions, 10),
      pastDueSubscriptions: parseInt(raw.past_due_subscriptions, 10),
      failedPayments: parseInt(raw.failed_payments, 10),
      planBreakdown: raw.plan_breakdown ?? [],
    };
  },

  async getAllPayments(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    method?: string;
  }) {
    return adminRepository.getAllPayments({
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
      status: params.status,
      method: params.method,
    });
  },

  async getAllUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    return adminRepository.getAllUsers({
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
    });
  },

  async getUserDetail(userId: string) {
    const detail = await adminRepository.getUserDetail(userId);
    if (!detail) throw new AppError('User not found', 404);
    return detail;
  },

  // ── Admin refund ──────────────────────────────────────────────────────────
  async adminRefund(data: {
    adminUserId: string;
    paymentIntentId: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  }) {
    const intent = await paymentRepository.findById(data.paymentIntentId);
    if (!intent) throw new AppError('Payment not found', 404);

    if (intent.status !== 'succeeded') {
      throw new AppError('Only succeeded payments can be refunded', 400);
    }

    if (!intent.stripe_payment_intent_id) {
      throw new AppError('No Stripe payment intent found', 400);
    }

    const refundAmount = data.amount ?? intent.amount;

    const refund = await stripe.refunds.create(
      {
        payment_intent: intent.stripe_payment_intent_id,
        amount: refundAmount,
        reason: data.reason ?? 'requested_by_customer',
      },
      {
        idempotencyKey: `admin_refund_${data.paymentIntentId}_${refundAmount}`,
      }
    );

    // Record the transaction
    const transaction = await paymentRepository.createTransaction({
      payment_intent_id: data.paymentIntentId,
      amount: refundAmount,
      currency: intent.currency,
      type: refundAmount < intent.amount ? 'partial_refund' : 'refund',
      status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
      stripe_charge_id: refund.id,
    });

    logger.info(
      {
        adminUserId: data.adminUserId,
        paymentIntentId: data.paymentIntentId,
        refundAmount,
      },
      'Admin refund issued'
    );

    return transaction;
  },

  // ── Admin cancel subscription ─────────────────────────────────────────────
  async adminCancelSubscription(data: {
    adminUserId: string;
    subscriptionId: string;
    immediately?: boolean;
  }) {
    const subscription = await subscriptionRepository.findById(
      data.subscriptionId
    );

    if (!subscription) throw new AppError('Subscription not found', 404);

    if (subscription.status === 'canceled') {
      throw new AppError('Subscription is already canceled', 400);
    }

    if (data.immediately) {
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    } else {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      await subscriptionRepository.update(
        subscription.stripe_subscription_id,
        { cancel_at_period_end: true }
      );
    }

    logger.info(
      {
        adminUserId: data.adminUserId,
        subscriptionId: data.subscriptionId,
        immediately: data.immediately,
      },
      'Admin canceled subscription'
    );

    return subscriptionRepository.findById(data.subscriptionId);
  },

  // ── Suspend user ──────────────────────────────────────────────────────────
  async suspendUser(data: {
    adminUserId: string;
    targetUserId: string;
    reason: string;
  }) {
    // Prevent suspending another admin
    const target = await adminRepository.getUserSuspensionStatus(data.targetUserId);
    if (!target) throw new AppError('User not found', 404);

    const { rows } = await db.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [data.targetUserId]
    );

    if (rows[0]?.is_admin) {
      throw new AppError('Cannot suspend an admin user', 400);
    }

    await adminRepository.suspendUser(data.targetUserId, data.reason);

    logger.info(
      {
        adminUserId: data.adminUserId,
        targetUserId: data.targetUserId,
        reason: data.reason,
      },
      'User suspended'
    );
   
    //send user email after suspension
    const user = await adminRepository.getUserSuspensionStatus(data.targetUserId);
    if (user) {
    await emailService.sendAccountSuspended(user.email, {
    name: user.name,
    reason: data.reason,
  });
}

    return adminRepository.getUserSuspensionStatus(data.targetUserId);
  },

  async unsuspendUser(data: {
    adminUserId: string;
    targetUserId: string;
  }) {
    const target = await adminRepository.getUserSuspensionStatus(data.targetUserId);
    if (!target) throw new AppError('User not found', 404);

    await adminRepository.unsuspendUser(data.targetUserId);

    logger.info(
      { adminUserId: data.adminUserId, targetUserId: data.targetUserId },
      'User unsuspended'
    );

    return adminRepository.getUserSuspensionStatus(data.targetUserId);
  },

};