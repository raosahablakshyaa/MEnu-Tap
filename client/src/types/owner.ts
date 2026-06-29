export interface DashboardStats {
  today: {
    revenue: number;
    orders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    customers: number;
    avgOrderValue: number;
  };
  monthly: { revenue: number; orders: number };
  tables: { total: number; occupied: number; available: number };
  menu: { items: number; categories: number };
  staff: { count: number };
  qrCodes: { generated: number };
  subscription: { plan: string; status: string; expiresAt: string } | null;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface Variant {
  name: string;
  price: number;
  discountPrice?: number;
  isAvailable: boolean;
}

export interface Addon {
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface MenuItem {
  _id: string;
  categoryId: string | { _id: string; name: string; slug: string };
  name: string;
  slug: string;
  description?: string;
  images: string[];
  foodType: 'veg' | 'non_veg' | 'vegan' | 'jain' | 'egg';
  spiceLevel?: 'mild' | 'medium' | 'hot' | 'extra_hot';
  price: number;
  discountPrice?: number;
  taxRate?: number;
  variants: Variant[];
  addons: Addon[];
  isBestSeller: boolean;
  isChefRecommended: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  isOutOfStock: boolean;
  preparationTime?: number;
  calories?: number;
  createdAt: string;
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'disabled';

export interface Table {
  _id: string;
  tableNumber: string;
  displayName: string;
  floor: number;
  floorName?: string;
  capacity: number;
  status: TableStatus;
  isActive: boolean;
  qrCodeId?: string;
}

export interface QrCode {
  _id: string;
  tableId: string | Table;
  tableNumber: string;
  token: string;
  url: string;
  svgData?: string;
  isActive: boolean;
  scansCount: number;
  createdAt: string;
}

export interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  roleId: { _id: string; name: string; slug: string };
  isActive: boolean;
  lastLoginAt?: string;
}

export interface StaffInvitation {
  _id: string;
  email: string;
  roleSlug: string;
  roleId: { _id: string; name: string; slug: string };
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: string;
  createdAt: string;
}
