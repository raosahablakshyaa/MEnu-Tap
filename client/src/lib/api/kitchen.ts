import { apiClient } from './client';
import type { Order } from '@/types/customer';

export interface KitchenOrderHistoryResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FeedbackResult {
  reviews: {
    _id: string;
    orderId: string;
    customerName?: string;
    foodRating: number;
    serviceRating: number;
    ambienceRating: number;
    overallRating: number;
    comment?: string;
    createdAt: string;
  }[];
  total: number;
  page: number;
  totalPages: number;
}

export const kitchenApi = {
  getOrders: () =>
    apiClient.get<Order[]>('/kitchen/orders'),

  getHistory: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<KitchenOrderHistoryResult>(`/kitchen/orders/history${qs}`);
  },

  getOrder: (orderId: string) =>
    apiClient.get<Order>(`/kitchen/orders/${orderId}`),

  updateStatus: (orderId: string, status: string, cancelReason?: string) =>
    apiClient.put<Order>(`/kitchen/orders/${orderId}/status`, { status, cancelReason }),

  markCashPaid: (orderId: string) =>
    apiClient.put<Order>(`/kitchen/orders/${orderId}/cash-paid`),

  getFeedback: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<FeedbackResult>(`/kitchen/feedback${qs}`);
  },
};
