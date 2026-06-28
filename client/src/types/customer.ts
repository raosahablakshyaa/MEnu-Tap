// ── QR / Session ────────────────────────────────────────────────────────────
export interface QrValidationData {
  restaurant: {
    _id: string;
    name: string;
    slug: string;
    logo?: string;
    coverImage?: string;
    description?: string;
    operationalInfo: {
      openingTime?: string;
      closingTime?: string;
      avgPrepTimeMinutes?: number;
    };
    branding: { themeColor?: string; accentColor?: string };
    contact: { phone: string; email: string };
  };
  table: {
    _id: string;
    tableNumber: string;
    displayName: string;
    floor: number;
    floorName?: string;
    capacity: number;
    status: string;
  };
  qrCode: { _id: string; token: string; scansCount: number };
}

export interface CustomerSession {
  sessionId: string;
  expiresAt: string;
}

// ── Menu ────────────────────────────────────────────────────────────────────
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

export interface PublicMenuItem {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  video?: string;
  ingredients?: string;
  calories?: number;
  preparationTime?: number;
  foodType: 'veg' | 'non_veg' | 'vegan' | 'jain' | 'egg';
  spiceLevel?: 'mild' | 'medium' | 'hot' | 'extra_hot';
  price: number;
  discountPrice?: number;
  taxRate: number;
  variants: Variant[];
  addons: Addon[];
  isBestSeller: boolean;
  isChefRecommended: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  isOutOfStock: boolean;
  servingSize?: string;
}

export interface PublicMenuCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sortOrder: number;
  items: PublicMenuItem[];
}

export interface MenuData {
  categories: PublicMenuCategory[];
  restaurant: QrValidationData['restaurant'];
}

// ── Cart ────────────────────────────────────────────────────────────────────
export interface CartAddon {
  name: string;
  price: number;
}

export interface CartItem {
  _id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  variantName?: string;
  addons: CartAddon[];
  notes?: string;
  subtotal: number;
}

export interface Cart {
  sessionId: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
}

// ── Order ───────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'wallet' | 'razorpay';

export interface OrderItem {
  _id: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  price: number;
  variantName?: string;
  addons: CartAddon[];
  notes?: string;
  subtotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  restaurantId: string;
  tableId?: string;
  tableNumber?: string;
  sessionId?: string;
  customerName?: string;
  customerPhone?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  packingCharges: number;
  serviceCharges: number;
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: PaymentMethod;
  estimatedPrepTime?: number;
  notes?: string;
  feedbackGiven: boolean;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}
