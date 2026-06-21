import { adminRepository } from './admin.repository';

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
    if (!detail) throw new Error('User not found');
    return detail;
  },

};