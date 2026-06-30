import type { ApiResponse } from '@/types/api';
import type {
  QrValidationData,
  CustomerSession,
  MenuData,
  PublicMenuItem,
  Cart,
  Order,
} from '@/types/customer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

async function req<T>(
  endpoint: string,
  options: RequestInit = {},
  sessionId?: string
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (sessionId) headers['X-Session-Id'] = sessionId;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  const data: ApiResponse<T> = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ── Menu / QR ────────────────────────────────────────────────────────────────
export const menuApi = {
  validateToken: (token: string) =>
    req<QrValidationData>(`/menu/${token}`),

  createSession: (token: string) =>
    req<CustomerSession>(`/menu/${token}/session`, { method: 'POST' }),

  getMenu: (token: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return req<MenuData>(`/menu/${token}/menu${qs}`);
  },

  getItem: (token: string, itemId: string) =>
    req<PublicMenuItem>(`/menu/${token}/item/${itemId}`),

  getUpsell: (token: string, cartItemIds: string[]) =>
    req<PublicMenuItem[]>(`/menu/${token}/upsell`, {
      method: 'POST',
      body: JSON.stringify({ cartItemIds }),
    }),
};

// ── Cart ─────────────────────────────────────────────────────────────────────
export const cartApi = {
  get: (sessionId: string) =>
    req<Cart>(`/cart/${sessionId}`),

  addItem: (sessionId: string, body: {
    menuItemId: string;
    quantity: number;
    variantName?: string;
    addons?: { name: string; price: number }[];
    notes?: string;
  }) =>
    req<Cart>(`/cart/${sessionId}/items`, { method: 'POST', body: JSON.stringify(body) }),

  updateItem: (sessionId: string, cartItemId: string, quantity: number, notes?: string) =>
    req<Cart>(`/cart/${sessionId}/items/${cartItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity, notes }),
    }),

  removeItem: (sessionId: string, cartItemId: string) =>
    req<Cart>(`/cart/${sessionId}/items/${cartItemId}`, { method: 'DELETE' }),

  clear: (sessionId: string) =>
    req<{ cleared: boolean }>(`/cart/${sessionId}`, { method: 'DELETE' }),
};

// ── Orders ───────────────────────────────────────────────────────────────────
export const orderApi = {
  saveDetails: (
    sessionId: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      birthday?: string;
      anniversary?: string;
      consentGiven: boolean;
    }
  ) =>
    req(`/orders/session/${sessionId}/details`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  place: (body: {
    sessionId: string;
    paymentMethod: string;
    couponCode?: string;
    notes?: string;
  }) =>
    req<Order>(`/orders`, { method: 'POST', body: JSON.stringify(body) }),

  getById: (orderId: string, sessionId: string) =>
    req<Order>(`/orders/${orderId}`, {}, sessionId),

  getSessionOrders: (sessionId: string) =>
    req<Order[]>(`/orders/session/${sessionId}`),

  createRazorpayOrder: (orderId: string, sessionId: string) =>
    req<{
      razorpayOrderId: string;
      amount: number;
      currency: string;
      keyId: string;
      transactionId: string;
      orderNumber: string;
    }>(`/orders/${orderId}/payment/razorpay`, { method: 'POST' }, sessionId),

  verifyPayment: (body: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) =>
    req(`/orders/payment/verify`, { method: 'POST', body: JSON.stringify(body) }),

  submitFeedback: (
    orderId: string,
    sessionId: string,
    data: {
      foodRating: number;
      serviceRating: number;
      ambienceRating: number;
      comment?: string;
    }
  ) =>
    req(`/orders/${orderId}/feedback`, { method: 'POST', body: JSON.stringify(data) }, sessionId),
};
