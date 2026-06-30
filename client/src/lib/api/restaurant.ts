import { apiClient, ApiError } from './client';
import { AuthResponse } from '@/types/api';

export const restaurantApi = {
  register: (data: Record<string, unknown>) =>
    apiClient.post<AuthResponse & { restaurant: Record<string, unknown>; nextStep: number }>('/restaurant/register', data),

  getOnboardingStatus: () =>
    apiClient.get<Record<string, unknown>>('/restaurant/onboarding/status'),

  updateBusinessDetails: (data: Record<string, unknown>) =>
    apiClient.put('/restaurant/onboarding/business-details', data),

  updateAddress: (data: Record<string, unknown>) =>
    apiClient.put('/restaurant/onboarding/address', data),

  updateOperationalInfo: (data: Record<string, unknown>) =>
    apiClient.put('/restaurant/onboarding/operational-info', data),

  updateBranding: (data: Record<string, unknown>) =>
    apiClient.put('/restaurant/onboarding/branding', data),

  uploadImage: async (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const token = apiClient.getAccessToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/restaurant/onboarding/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new ApiError(json.message, res.status, json.errors);
    return json;
  },

  sendOtp: (phone: string) =>
    apiClient.post<{ message: string; devOtp?: string }>('/restaurant/send-otp', { phone }),

  verifyOtp: (phone: string, otp: string) =>
    apiClient.post('/restaurant/verify-otp', { phone, otp }),

  verifyEmail: (token: string) =>
    apiClient.post('/restaurant/verify-email', { token }),

  getProfile: () => apiClient.get('/restaurant/profile'),
  updateProfile: (data: Record<string, unknown>) => apiClient.put('/restaurant/profile', data),
  getSettings: () => apiClient.get('/restaurant/settings'),
  updateSettings: (data: Record<string, unknown>) => apiClient.put('/restaurant/settings', data),

  getPlans: () => apiClient.get<Record<string, unknown>[]>('/plans'),
  createPaymentOrder: (planId: string) =>
    apiClient.post<{ orderId: string; amount: number; currency: string; keyId: string; transactionId: string }>('/payments/create-order', { planId }),
  verifyPayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    apiClient.post('/payments/verify', data),

  getCurrentSubscription: () => apiClient.get('/subscriptions/current'),
  getSubscriptionHistory: () => apiClient.get<unknown[]>('/subscriptions/history'),
};
