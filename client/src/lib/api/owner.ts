import { apiClient } from './client';
import type { KitchenOrderHistoryResult } from './kitchen';

// Dashboard
export const dashboardApi = {
  getStats: () => apiClient.get<Record<string, unknown>>('/owner/dashboard'),
};

export const ownerOrdersApi = {
  recent: (limit = 8) =>
    apiClient.get<KitchenOrderHistoryResult>(`/kitchen/orders/history?page=1&limit=${limit}`),
  updateStatus: (orderId: string, status: string, cancelReason?: string) =>
    apiClient.put(`/kitchen/orders/${orderId}/status`, { status, cancelReason }),
};

// Categories
export const categoriesApi = {
  list: () => apiClient.get<unknown[]>('/owner/categories'),
  create: (data: Record<string, unknown>) => apiClient.post('/owner/categories', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/owner/categories/${id}`, data),
  delete: (id: string) => apiClient.delete(`/owner/categories/${id}`),
  reorder: (orders: { id: string; sortOrder: number }[]) =>
    apiClient.put('/owner/categories/reorder', { orders }),
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = apiClient.getAccessToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/owner/categories/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json;
  },
};

// Menu Items
export const menuApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<{ items: unknown[]; total: number; page: number; pages: number }>(`/owner/menu${qs}`);
  },
  getById: (id: string) => apiClient.get<Record<string, unknown>>(`/owner/menu/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/owner/menu', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/owner/menu/${id}`, data),
  delete: (id: string) => apiClient.delete(`/owner/menu/${id}`),
  duplicate: (id: string) => apiClient.post(`/owner/menu/${id}/duplicate`),
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = apiClient.getAccessToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/owner/menu/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json;
  },
};

// Tables
export const tablesApi = {
  list: () => apiClient.get<{ tables: unknown[]; floors: Record<string, unknown> }>('/owner/tables'),
  create: (data: Record<string, unknown>) => apiClient.post('/owner/tables', data),
  bulkCreate: (data: { floors: { floorNumber: number; floorName?: string; tableCount: number; startNumber?: number }[] }) =>
    apiClient.post('/owner/tables/bulk', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/owner/tables/${id}`, data),
  delete: (id: string) => apiClient.delete(`/owner/tables/${id}`),
};

// QR Codes
export const qrApi = {
  list: () => apiClient.get<unknown[]>('/owner/qr'),
  generate: (tableId: string) => apiClient.post('/owner/qr/generate', { tableId }),
  generateAll: () => apiClient.post('/owner/qr/generate-all'),
  regenerate: (id: string) => apiClient.post(`/owner/qr/${id}/regenerate`),
  getById: (id: string) => apiClient.get(`/owner/qr/${id}`),
  delete: (id: string) => apiClient.delete(`/owner/qr/${id}`),
};

// Staff
export const staffApi = {
  list: () => apiClient.get<unknown[]>('/owner/staff'),
  invite: (data: { email: string; roleSlug: string }) => apiClient.post('/owner/staff/invite', data),
  getInvitations: () => apiClient.get<unknown[]>('/owner/staff/invitations'),
  cancelInvitation: (id: string) => apiClient.delete(`/owner/staff/invitations/${id}`),
  updateRole: (id: string, roleSlug: string) => apiClient.put(`/owner/staff/${id}/role`, { roleSlug }),
  suspend: (id: string) => apiClient.put(`/owner/staff/${id}/suspend`),
  activate: (id: string) => apiClient.put(`/owner/staff/${id}/activate`),
  remove: (id: string) => apiClient.delete(`/owner/staff/${id}`),
};

// Analytics
export const analyticsApi = {
  full: () => apiClient.get<Record<string, unknown>>('/owner/analytics'),
  revenue: (period: 'today' | 'week' | 'month' | 'year') =>
    apiClient.get(`/owner/analytics/revenue?period=${period}`),
  daily: (days = 30) => apiClient.get(`/owner/analytics/daily?days=${days}`),
  monthly: (months = 12) => apiClient.get(`/owner/analytics/monthly?months=${months}`),
  peakHours: () => apiClient.get('/owner/analytics/peak-hours'),
  topItems: (limit = 10) => apiClient.get(`/owner/analytics/top-items?limit=${limit}`),
};

// Inventory
export const inventoryApi = {
  list: (params?: Record<string, string>) => apiClient.get(`/owner/inventory${params ? '?' + new URLSearchParams(params) : ''}`),
  get: (id: string) => apiClient.get(`/owner/inventory/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/owner/inventory', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/owner/inventory/${id}`, data),
  delete: (id: string) => apiClient.delete(`/owner/inventory/${id}`),
  adjustStock: (id: string, data: Record<string, unknown>) => apiClient.post(`/owner/inventory/${id}/adjust`, data),
  movements: (params?: Record<string, string>) => apiClient.get(`/owner/inventory/movements${params ? '?' + new URLSearchParams(params) : ''}`),
  lowStockAlerts: () => apiClient.get('/owner/inventory/alerts/low-stock'),
  valuation: () => apiClient.get('/owner/inventory/valuation'),
};

// Recipes
export const recipesApi = {
  list: () => apiClient.get('/owner/recipes'),
  getByMenuItem: (menuItemId: string) => apiClient.get(`/owner/recipes/${menuItemId}`),
  upsert: (menuItemId: string, data: Record<string, unknown>) => apiClient.put(`/owner/recipes/${menuItemId}`, data),
  delete: (menuItemId: string) => apiClient.delete(`/owner/recipes/${menuItemId}`),
  profitAnalysis: () => apiClient.get('/owner/recipes/profit-analysis'),
};

// Suppliers
export const suppliersApi = {
  list: (params?: Record<string, string>) => apiClient.get(`/owner/suppliers${params ? '?' + new URLSearchParams(params) : ''}`),
  get: (id: string) => apiClient.get(`/owner/suppliers/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/owner/suppliers', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/owner/suppliers/${id}`, data),
  delete: (id: string) => apiClient.delete(`/owner/suppliers/${id}`),
};

// Purchase Orders
export const purchaseOrdersApi = {
  list: (params?: Record<string, string>) => apiClient.get(`/owner/purchase-orders${params ? '?' + new URLSearchParams(params) : ''}`),
  get: (id: string) => apiClient.get(`/owner/purchase-orders/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/owner/purchase-orders', data),
  updateStatus: (id: string, status: string) => apiClient.patch(`/owner/purchase-orders/${id}/status`, { status }),
  receiveItems: (id: string, items: unknown[]) => apiClient.post(`/owner/purchase-orders/${id}/receive`, { items }),
};

// Expenses
export const expensesApi = {
  list: (params?: Record<string, string>) => apiClient.get(`/owner/expenses${params ? '?' + new URLSearchParams(params) : ''}`),
  summary: (params?: Record<string, string>) => apiClient.get(`/owner/expenses/summary${params ? '?' + new URLSearchParams(params) : ''}`),
  get: (id: string) => apiClient.get(`/owner/expenses/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/owner/expenses', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/owner/expenses/${id}`, data),
  delete: (id: string) => apiClient.delete(`/owner/expenses/${id}`),
};

// Branches
export const branchesApi = {
  list: () => apiClient.get('/owner/branches'),
  get: (id: string) => apiClient.get(`/owner/branches/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/owner/branches', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/owner/branches/${id}`, data),
  delete: (id: string) => apiClient.delete(`/owner/branches/${id}`),
  comparison: (params?: Record<string, string>) => apiClient.get(`/owner/branches/comparison${params ? '?' + new URLSearchParams(params) : ''}`),
};

// Attendance
export const attendanceApi = {
  daily: (date?: string) => apiClient.get(`/owner/attendance/daily${date ? '?date=' + date : ''}`),
  teamSummary: (params?: Record<string, string>) => apiClient.get(`/owner/attendance/team-summary${params ? '?' + new URLSearchParams(params) : ''}`),
  mark: (data: Record<string, unknown>) => apiClient.post('/owner/attendance', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/owner/attendance/${id}`, data),
  monthlyReport: (userId: string, year: number, month: number) => apiClient.get(`/owner/attendance/${userId}/monthly?year=${year}&month=${month}`),
};

// POS
export const posApi = {
  list: (params?: Record<string, string>) => apiClient.get(`/owner/pos${params ? '?' + new URLSearchParams(params) : ''}`),
  dailySummary: (date?: string) => apiClient.get(`/owner/pos/daily-summary${date ? '?date=' + date : ''}`),
  createBill: (data: Record<string, unknown>) => apiClient.post('/owner/pos/bill', data),
  get: (id: string) => apiClient.get(`/owner/pos/${id}`),
  void: (id: string) => apiClient.patch(`/owner/pos/${id}/void`),
  generateGstInvoice: (id: string) => apiClient.post(`/owner/pos/${id}/gst-invoice`),
};

// AI Business Intelligence
export const aiApi = {
  executiveDashboard: () => apiClient.get('/owner/ai/executive-dashboard'),
  forecast: () => apiClient.get('/owner/ai/forecast'),
  latestReport: (period = 'daily') => apiClient.get(`/owner/ai/reports/latest?period=${period}`),
  reportHistory: (period = 'daily', limit = 30) => apiClient.get(`/owner/ai/reports/history?period=${period}&limit=${limit}`),
  generateReport: () => apiClient.post('/owner/ai/reports/generate'),
};

// WhatsApp share (no paid API — generates pre-filled link)
export const whatsappShare = {
  shareMenu: (restaurantName: string, menuUrl: string) => {
    const msg = encodeURIComponent(`🍽️ Check out our menu at ${restaurantName}!\n\nOrder online: ${menuUrl}\n\nTap the link, scan & order! 🎉`);
    return `https://wa.me/?text=${msg}`;
  },
  shareOffer: (restaurantName: string, offer: string) => {
    const msg = encodeURIComponent(`🎉 Special offer from ${restaurantName}!\n\n${offer}\n\nBook your table now! 📞`);
    return `https://wa.me/?text=${msg}`;
  },
  shareFeedbackRequest: (restaurantName: string) => {
    const msg = encodeURIComponent(`Hi! We hope you enjoyed your experience at ${restaurantName} 🙏\n\nWould you mind leaving us a Google review? It takes just 30 seconds and means the world to us! ⭐`);
    return `https://wa.me/?text=${msg}`;
  },
};
