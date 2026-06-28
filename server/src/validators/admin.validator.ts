import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
});

export const createPlanSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().optional(),
  description: z.string().max(500).optional(),
  duration: z.enum(['monthly', '3_months', '6_months', '12_months', 'custom']),
  durationDays: z.number().min(1).optional(),
  price: z.number().min(0),
  currency: z.string().default('INR'),
  features: z.object({
    maxTables: z.number().min(0).default(10),
    maxStaff: z.number().min(0).default(5),
    maxMenuItems: z.number().min(0).default(100),
    maxBranches: z.number().min(1).default(1),
    storageLimitMb: z.number().min(0).default(500),
    qrLimit: z.number().min(0).default(20),
    analyticsAccess: z.boolean().default(false),
    aiFeatures: z.boolean().default(false),
    loyaltyAccess: z.boolean().default(false),
    whatsappMarketing: z.boolean().default(false),
    posAccess: z.boolean().default(true),
    inventoryAccess: z.boolean().default(false),
    ownerAppAccess: z.boolean().default(true),
    customerAppAccess: z.boolean().default(true),
  }).optional(),
  featureList: z.array(z.string()).optional(),
  isPopular: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const assignPlanSchema = z.object({
  restaurantId: z.string().min(1),
  planId: z.string().min(1),
  autoRenew: z.boolean().default(true),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  roleSlug: z.string().min(1),
  restaurantId: z.string().optional(),
  phone: z.string().optional(),
});

export const createCouponSchema = z.object({
  code: z.string().min(3).max(20),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  type: z.enum(['percentage', 'flat', 'referral', 'festival']),
  discountValue: z.number().min(0),
  maxDiscount: z.number().min(0).optional(),
  minOrderAmount: z.number().min(0).optional(),
  usageLimit: z.number().min(1),
  perUserLimit: z.number().min(1).default(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  applicablePlans: z.array(z.string()).optional(),
});

export const createNotificationSchema = z.object({
  title: z.string().min(2).max(200),
  message: z.string().min(2),
  channels: z.array(z.enum(['email', 'sms', 'whatsapp', 'push'])).min(1),
  targetType: z.enum(['all', 'restaurants', 'plan', 'city', 'state']),
  targetIds: z.array(z.string()).optional(),
  targetFilter: z.object({
    planId: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
  scheduledAt: z.coerce.date().optional(),
});

export const rejectRestaurantSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const suspendRestaurantSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const replyTicketSchema = z.object({
  message: z.string().min(1).max(5000),
  isInternal: z.boolean().default(false),
});

export const updateSettingsSchema = z.object({
  platformName: z.string().optional(),
  logo: z.string().optional(),
  currency: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
  smtp: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    user: z.string().optional(),
    password: z.string().optional(),
    fromEmail: z.string().optional(),
    fromName: z.string().optional(),
    secure: z.boolean().optional(),
  }).optional(),
  whatsapp: z.object({
    apiKey: z.string().optional(),
    phoneNumberId: z.string().optional(),
    businessAccountId: z.string().optional(),
  }).optional(),
  sms: z.object({
    provider: z.string().optional(),
    apiKey: z.string().optional(),
    senderId: z.string().optional(),
  }).optional(),
  razorpay: z.object({
    keyId: z.string().optional(),
    keySecret: z.string().optional(),
  }).optional(),
  cloudinary: z.object({
    cloudName: z.string().optional(),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
  }).optional(),
  featureFlags: z.record(z.boolean()).optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
});

export const assignRoleSchema = z.object({
  roleSlug: z.string().min(1),
});

export const internalNoteSchema = z.object({
  note: z.string().min(1).max(2000),
});

export const requestInfoSchema = z.object({
  notes: z.string().min(3).max(1000),
});

export const reportDateRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});
