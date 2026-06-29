import { transporter } from '../config/email';
import { emailTemplates } from './email.template';
import { env } from '../config/env';
import { logger } from './logger';

const FROM = env.EMAIL_FROM;

// Wrapper that logs on success/failure but never throws
// Email sending should never crash your main flow
async function send(to: string, template: { subject: string; html: string }) {
  try {
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject: template.subject,
      html: template.html,
    });

    logger.info({ to, subject: template.subject, messageId: info.messageId }, 'Email sent');
  } catch (err) {
    // Never let email failure crash the payment flow
    logger.error({ to, subject: template.subject, err }, 'Email service error');
  }
}

export const emailService = {

  async sendWelcome(to: string, data: { name: string }) {
    await send(to, emailTemplates.welcome(data));
  },

  async sendPaymentSucceeded(
    to: string,
    data: {
      name: string;
      amount: number;
      currency: string;
      paymentId: string;
      createdAt: string;
    }
  ) {
    await send(to, emailTemplates.paymentSucceeded(data));
  },

  async sendPaymentFailed(
    to: string,
    data: {
      name: string;
      amount: number;
      currency: string;
      failureReason: string;
    }
  ) {
    await send(to, emailTemplates.paymentFailed(data));
  },

  async sendRefundIssued(
    to: string,
    data: {
      name: string;
      amount: number;
      currency: string;
      originalAmount: number;
      refundId: string;
      createdAt: string;
    }
  ) {
    await send(to, emailTemplates.refundIssued(data));
  },

  async sendMpesaPaymentSucceeded(
    to: string,
    data: {
      name: string;
      amount: number;
      phoneNumber: string;
      receiptNumber: string;
      createdAt: string;
    }
  ) {
    await send(to, emailTemplates.mpesaPaymentSucceeded(data));
  },

  async sendSubscriptionStarted(
    to: string,
    data: {
      name: string;
      planName: string;
      amount: number;
      currency: string;
      interval: string;
      nextBillingDate: string;
    }
  ) {
    await send(to, emailTemplates.subscriptionStarted(data));
  },

  async sendSubscriptionRenewed(
    to: string,
    data: {
      name: string;
      planName: string;
      amount: number;
      currency: string;
      nextBillingDate: string;
    }
  ) {
    await send(to, emailTemplates.subscriptionRenewed(data));
  },

  async sendSubscriptionPaymentFailed(
    to: string,
    data: {
      name: string;
      planName: string;
      amount: number;
      currency: string;
    }
  ) {
    await send(to, emailTemplates.subscriptionPaymentFailed(data));
  },

  async sendSubscriptionCanceled(
    to: string,
    data: {
      name: string;
      planName: string;
      accessUntil: string | null;
      immediately: boolean;
    }
  ) {
    await send(to, emailTemplates.subscriptionCanceled(data));
  },

  async sendAccountSuspended(
    to: string,
    data: { name: string; reason: string }
  ) {
    await send(to, emailTemplates.accountSuspended(data));
  },

};