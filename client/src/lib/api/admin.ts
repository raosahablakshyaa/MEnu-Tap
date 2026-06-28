import { apiClient } from './client';
import {
  DashboardStats, PaginatedResponse, Restaurant, SubscriptionPlan,
  Subscription, AdminUser, Coupon, SupportTicket, AuditLogEntry,
  PlatformSettings, PaymentTransaction, Notification,
} from '@/types/admin';

const admin = '/admin';

export const adminApi = {
  dashboard: {
    getStats: () => apiClient.get<DashboardStats>(`${admin}/dashboard/stats`),
    getOverview: () => apiClient.get<{ openTickets: number; activeCoupons: number; pendingNotifications: number }>(`${admin}/dashboard/overview`),
  },

  restaurants: {
    list: (params?: Record<string, string | number>) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return apiClient.get<PaginatedResponse<Restaurant>>(`${admin}/restaurants?${qs}`);
    },
    get: (id: string) => apiClient.get<Restaurant>(`${admin}/restaurants/${id}`),
    approve: (id: string, notes?: string) => apiClient.post(`${admin}/restaurants/${id}/approve`, { notes }),
    reject: (id: string, reason: string) => apiClient.post(`${admin}/restaurants/${id}/reject`, { reason }),
    suspend: (id: string, reason: string) => apiClient.post(`${admin}/restaurants/${id}/suspend`, { reason }),
    activate: (id: string) => apiClient.post(`${admin}/restaurants/${id}/activate`),
    delete: (id: string) => apiClient.delete(`${admin}/restaurants/${id}`),
    restore: (id: string) => apiClient.post(`${admin}/restaurants/${id}/restore`),
    analytics: (id: string) => apiClient.get(`${admin}/restaurants/${id}/analytics`),
    impersonate: (id: string) => apiClient.post<{ accessToken: string; user: Record<string, unknown> }>(`${admin}/restaurants/${id}/impersonate`),
  },

  subscriptions: {
    listPlans: (params?: Record<string, string | number>) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return apiClient.get<PaginatedResponse<SubscriptionPlan>>(`${admin}/subscriptions/plans?${qs}`);
    },
    createPlan: (data: Record<string, unknown>) => apiClient.post<SubscriptionPlan>(`${admin}/subscriptions/plans`, data),
    updatePlan: (id: string, data: Record<string, unknown>) => apiClient.patch<SubscriptionPlan>(`${admin}/subscriptions/plans/${id}`, data),
    deletePlan: (id: string) => apiClient.delete(`${admin}/subscriptions/plans/${id}`),
    pausePlan: (id: string) => apiClient.post(`${admin}/subscriptions/plans/${id}/pause`),
    duplicatePlan: (id: string) => apiClient.post<SubscriptionPlan>(`${admin}/subscriptions/plans/${id}/duplicate`),
    list: (params?: Record<string, string | number>) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return apiClient.get<PaginatedResponse<Subscription>>(`${admin}/subscriptions?${qs}`);
    },
    assign: (restaurantId: string, planId: string) => apiClient.post(`${admin}/subscriptions/assign`, { restaurantId, planId }),
    renew: (id: string) => apiClient.post(`${admin}/subscriptions/${id}/renew`),
    cancel: (id: string, reason?: string) => apiClient.post(`${admin}/subscriptions/${id}/cancel`, { reason }),
    generateInvoice: (id: string) => apiClient.post(`${admin}/subscriptions/${id}/invoice`),
  },

  revenue: {
    getDashboard: () => apiClient.get(`${admin}/revenue/dashboard`),
    listTransactions: (params?: Record<string, string | number>) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return apiClient.get<PaginatedResponse<PaymentTransaction>>(`${admin}/revenue/transactions?${qs}`);
    },
  },

  users: {
    list: (params?: Record<string, string | number>) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return apiClient.get<PaginatedResponse<AdminUser>>(`${admin}/users?${qs}`);
    },
    get: (id: string) => apiClient.get<AdminUser>(`${admin}/users/${id}`),
    create: (data: Record<string, unknown>) => apiClient.post<AdminUser>(`${admin}/users`, data),
    suspend: (id: string) => apiClient.post(`${admin}/users/${id}/suspend`),
    activate: (id: string) => apiClient.post(`${admin}/users/${id}/activate`),
    delete: (id: string) => apiClient.delete(`${admin}/users/${id}`),
    resetPassword: (id: string, newPassword: string) => apiClient.post(`${admin}/users/${id}/reset-password`, { newPassword }),
    assignRole: (id: string, roleSlug: string) => apiClient.post(`${admin}/users/${id}/assign-role`, { roleSlug }),
    getStats: () => apiClient.get<{ role: string; slug: string; count: number }[]>(`${admin}/users/stats`),
  },

  coupons: {
    list: (params?: Record<string, string | number>) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return apiClient.get<PaginatedResponse<Coupon>>(`${admin}/coupons?${qs}`);
    },
    create: (data: Record<string, unknown>) => apiClient.post<Coupon>(`${admin}/coupons`, data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch<Coupon>(`${admin}/coupons/${id}`, data),
    delete: (id: string) => apiClient.delete(`${admin}/coupons/${id}`),
  },

  notifications: {
    list: (params?: Record<string, string | number>) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return apiClient.get<PaginatedResponse<Notification>>(`${admin}/notifications?${qs}`);
    },
    create: (data: Record<string, unknown>) => apiClient.post<Notification>(`${admin}/notifications`, data),
    send: (id: string) => apiClient.post(`${admin}/notifications/${id}/send`),
    cancel: (id: string) => apiClient.post(`${admin}/notifications/${id}/cancel`),
  },

  support: {
    list: (params?: Record<string, string | number>) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return apiClient.get<PaginatedResponse<SupportTicket>>(`${admin}/support?${qs}`);
    },
    get: (id: string) => apiClient.get<SupportTicket>(`${admin}/support/${id}`),
    assign: (id: string, assignedTo: string) => apiClient.post(`${admin}/support/${id}/assign`, { assignedTo }),
    reply: (id: string, message: string, isInternal?: boolean) => apiClient.post(`${admin}/support/${id}/reply`, { message, isInternal }),
    close: (id: string) => apiClient.post(`${admin}/support/${id}/close`),
    reopen: (id: string) => apiClient.post(`${admin}/support/${id}/reopen`),
  },

  auditLogs: {
    list: (params?: Record<string, string | number>) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return apiClient.get<PaginatedResponse<AuditLogEntry>>(`${admin}/audit-logs?${qs}`);
    },
  },

  reports: {
    restaurants: () => apiClient.get(`${admin}/reports/restaurants`),
    revenue: (from: string, to: string) => apiClient.get(`${admin}/reports/revenue?from=${from}&to=${to}`),
    subscriptions: () => apiClient.get(`${admin}/reports/subscriptions`),
    customers: () => apiClient.get(`${admin}/reports/customers`),
    payments: (from: string, to: string) => apiClient.get(`${admin}/reports/payments?from=${from}&to=${to}`),
    support: () => apiClient.get(`${admin}/reports/support`),
  },

  settings: {
    get: () => apiClient.get<PlatformSettings>(`${admin}/settings`),
    update: (data: Record<string, unknown>) => apiClient.patch<PlatformSettings>(`${admin}/settings`, data),
    toggleMaintenance: (enabled: boolean, message?: string) => apiClient.post(`${admin}/settings/maintenance`, { enabled, message }),
    updateFeatureFlag: (flag: string, enabled: boolean) => apiClient.post(`${admin}/settings/feature-flags`, { flag, enabled }),
  },
};
