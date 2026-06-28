export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  platformRevenue: number;
  mrr: number;
  arr: number;
  totalRestaurants: number;
  activeRestaurants: number;
  inactiveRestaurants: number;
  pendingApprovals: number;
  expiredSubscriptions: number;
  todayOrders: number;
  todayRevenue: number;
  platformCustomers: number;
  platformStaff: number;
  avgRevenuePerRestaurant: number;
  avgOrdersPerRestaurant: number;
  topRestaurants: { restaurantId: string; name: string; slug: string; revenue: number; transactions: number }[];
  recentRestaurants: Record<string, unknown>[];
  charts: {
    revenueGrowth: { label: string; value: number }[];
    subscriptionGrowth: { label: string; value: number }[];
    ordersGrowth: { label: string; value: number }[];
    restaurantGrowth: { label: string; value: number }[];
    customerGrowth: { label: string; value: number }[];
  };
}

export interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  status: 'pending' | 'pending_approval' | 'approved' | 'rejected' | 'suspended';
  isActive: boolean;
  contact: { email: string; phone: string };
  address: { city: string; state: string; country: string };
  ownerId: { firstName: string; lastName: string; email: string };
  createdAt: string;
}

export interface SubscriptionPlan {
  _id: string;
  name: string;
  slug: string;
  duration: string;
  durationDays: number;
  price: number;
  currency: string;
  features: Record<string, unknown>;
  isActive: boolean;
  isPaused: boolean;
  isPopular: boolean;
}

export interface Subscription {
  _id: string;
  restaurantId: { name: string; slug: string };
  planId: { name: string; price: number; duration: string };
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
}

export interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  roleId: { name: string; slug: string };
  restaurantId?: { name: string; slug: string };
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  name: string;
  type: string;
  discountValue: number;
  usageLimit: number;
  usageCount: number;
  status: string;
  startDate: string;
  endDate: string;
}

export interface SupportTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  restaurantId: { name: string; slug: string };
  createdBy: { firstName: string; lastName: string; email: string };
  createdAt: string;
}

export interface AuditLogEntry {
  _id: string;
  action: string;
  resource: string;
  userEmail?: string;
  userRole?: string;
  status: string;
  createdAt: string;
}

export interface PlatformSettings {
  platformName: string;
  logo?: string;
  currency: string;
  taxRate: number;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  featureFlags: Record<string, boolean>;
  smtp?: Record<string, unknown>;
  razorpay?: Record<string, unknown>;
  cloudinary?: Record<string, unknown>;
}

export interface PaymentTransaction {
  _id: string;
  transactionId: string;
  amount: number;
  status: string;
  type: string;
  restaurantId: { name: string; slug: string };
  createdAt: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  channels: string[];
  targetType: string;
  status: string;
  recipientCount: number;
  createdAt: string;
}
