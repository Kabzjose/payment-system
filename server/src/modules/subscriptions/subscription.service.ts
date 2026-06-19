import Stripe from 'stripe';
import { stripe } from '../../config/stripe';
import { env } from '../../config/env';
import { planRepository } from './plan.repository';
import { subscriptionRepository } from './subscription.repository';
import { customerRepository } from '../customers/customer.repository';
import { userRepository } from '../users/user.repository';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export const subscriptionService = {

  // ── Seed plans from env into DB ───────────────────────────────────────────
  // Call this once on server start to ensure our plans table
  // reflects what's in Stripe. In production you'd have a proper
  // admin interface for this.
  async seedPlans() {
    const pricesToSync = [
      { priceId: env.STRIPE_BASIC_PRICE_ID },
      { priceId: env.STRIPE_PRO_PRICE_ID },
    ];

    for (const { priceId } of pricesToSync) {
      // Check if already in DB
      const existing = await planRepository.findByStripePriceId(priceId);
      if (existing) continue;

      // Fetch price + product from Stripe
      const price = await stripe.prices.retrieve(priceId, {
        expand: ['product'],
      });

      const product = price.product as Stripe.Product;

      await planRepository.create({
        name: product.name,
        description: product.description ?? undefined,
        stripe_product_id: product.id,
        stripe_price_id: price.id,
        amount: price.unit_amount ?? 0,
        currency: price.currency,
        interval: price.recurring?.interval ?? 'month',
        interval_count: price.recurring?.interval_count ?? 1,
        trial_period_days: price.recurring?.trial_period_days ?? 0,
      });

      logger.info({ priceId, name: product.name }, 'Plan seeded');
    }
  },

  // ── List available plans ──────────────────────────────────────────────────
  async getPlans() {
    return planRepository.findAll();
  },

  // ── Create subscription ───────────────────────────────────────────────────
  async createSubscription(data: {
    userId: string;
    planId: string;
    paymentMethodId: string; // from Stripe Elements on frontend
  }) {
    // 1. Check user doesn't already have an active subscription
    const existing = await subscriptionRepository.findActiveByUserId(data.userId);
    if (existing) {
      throw new AppError(
        'You already have an active subscription. Cancel it before subscribing to a new plan.',
        409
      );
    }

    // 2. Get the plan
    const plan = await planRepository.findById(data.planId);
    if (!plan) throw new AppError('Plan not found', 404);

    // 3. Get or create Stripe customer
    const user = await userRepository.findById(data.userId);
    if (!user) throw new AppError('User not found', 404);

    let customer = await customerRepository.findByUserId(data.userId);
    if (!customer) {
      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customer = await customerRepository.create({
        user_id: data.userId,
        stripe_customer_id: stripeCustomer.id,
      });
    }

    // 4. Attach payment method to customer
    await stripe.paymentMethods.attach(data.paymentMethodId, {
      customer: customer.stripe_customer_id,
    });

    // Set as default payment method
    await stripe.customers.update(customer.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: data.paymentMethodId,
      },
    });

    // 5. Create the Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customer.stripe_customer_id,
      items: [{ price: plan.stripe_price_id }],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: { userId: data.userId, planId: plan.id },
    });

    // 6. Save to our DB
    const subscription = await subscriptionRepository.create({
      user_id: data.userId,
      plan_id: plan.id,
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: customer.stripe_customer_id,
      stripe_price_id: plan.stripe_price_id,
      status: stripeSubscription.status,
      current_period_start: new Date(
        stripeSubscription.current_period_start * 1000
      ),
      current_period_end: new Date(
        stripeSubscription.current_period_end * 1000
      ),
      trial_start: stripeSubscription.trial_start
        ? new Date(stripeSubscription.trial_start * 1000)
        : undefined,
      trial_end: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : undefined,
    });

    // 7. Extract clientSecret if payment needs confirmation
    // (happens on first invoice for subscriptions)
    const invoice = stripeSubscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;
    const clientSecret = paymentIntent?.client_secret ?? null;

    logger.info(
      { subscriptionId: subscription.id, stripeId: stripeSubscription.id },
      'Subscription created'
    );

    return { subscription, clientSecret };
  },

  // ── Cancel subscription ───────────────────────────────────────────────────
  async cancelSubscription(data: {
    userId: string;
    subscriptionId: string;
    immediately?: boolean;
  }) {
    const subscription = await subscriptionRepository.findById(
      data.subscriptionId
    );
    if (!subscription) throw new AppError('Subscription not found', 404);
    if (subscription.user_id !== data.userId) throw new AppError('Forbidden', 403);
    if (subscription.status === 'canceled') {
      throw new AppError('Subscription is already canceled', 400);
    }

    if (data.immediately) {
      // Cancel immediately — access revoked now
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    } else {
      // Cancel at period end — user keeps access until billing period ends
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      await subscriptionRepository.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    logger.info(
      { subscriptionId: data.subscriptionId, immediately: data.immediately },
      'Subscription canceled'
    );

    return subscriptionRepository.findById(data.subscriptionId);
  },

  // ── Change plan (upgrade/downgrade) ──────────────────────────────────────
  async changePlan(data: {
    userId: string;
    subscriptionId: string;
    newPlanId: string;
  }) {
    const subscription = await subscriptionRepository.findById(
      data.subscriptionId
    );
    if (!subscription) throw new AppError('Subscription not found', 404);
    if (subscription.user_id !== data.userId) throw new AppError('Forbidden', 403);
    if (!['active', 'trialing'].includes(subscription.status)) {
      throw new AppError('Can only change plan on active subscriptions', 400);
    }

    const newPlan = await planRepository.findById(data.newPlanId);
    if (!newPlan) throw new AppError('Plan not found', 404);

    // Retrieve current subscription items
    const stripeSub = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );

    // Update the subscription with the new price
    // Stripe handles proration automatically
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      items: [
        {
          id: stripeSub.items.data[0].id,
          price: newPlan.stripe_price_id,
        },
      ],
      proration_behavior: 'create_prorations',
    });

    // Update our local record
    await subscriptionRepository.update(subscription.stripe_subscription_id, {
      plan_id: newPlan.id,
      stripe_price_id: newPlan.stripe_price_id,
    });

    logger.info(
      { subscriptionId: data.subscriptionId, newPlanId: data.newPlanId },
      'Subscription plan changed'
    );

    return subscriptionRepository.findById(data.subscriptionId);
  },

  async getUserSubscriptions(userId: string) {
    return subscriptionRepository.findByUserId(userId);
  },

  async getSubscription(id: string, userId: string) {
    const sub = await subscriptionRepository.findById(id);
    if (!sub) throw new AppError('Subscription not found', 404);
    if (sub.user_id !== userId) throw new AppError('Forbidden', 403);
    return sub;
  },

};