import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain special character');

export const restaurantRegisterSchema = z.object({
  restaurantName: z.string().min(2).max(200),
  ownerName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[\d\s-()]{10,15}$/, 'Invalid phone number'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const businessDetailsSchema = z.object({
  restaurantType: z.string().min(1),
  cuisineTypes: z.array(z.string()).min(1, 'Select at least one cuisine'),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().or(z.literal('')),
  fssaiNumber: z.string().min(8).max(14).optional().or(z.literal('')),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().or(z.literal('')),
});

export const addressSchema = z.object({
  street: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().default('India'),
  postalCode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid pincode'),
  googleMapsUrl: z.string().url().optional().or(z.literal('')),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const operationalInfoSchema = z.object({
  openingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  workingDays: z.array(z.string()).min(1),
  avgPrepTimeMinutes: z.number().min(5).max(180),
  seatingCapacity: z.number().min(1),
  numberOfTables: z.number().min(1),
  numberOfFloors: z.number().min(1).optional(),
  numberOfBranches: z.number().min(1).default(1),
});

export const brandingSchema = z.object({
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+?[\d\s-()]{10,15}$/),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+?[\d\s-()]{10,15}$/),
  otp: z.string().length(6),
});

export const createPaymentOrderSchema = z.object({
  planId: z.string().min(1),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const updateSettingsSchema = z.object({
  currency: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  serviceCharge: z.number().min(0).max(100).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  invoicePrefix: z.string().optional(),
  orderPrefix: z.string().optional(),
  qrPrefix: z.string().optional(),
  notificationPreferences: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
  }).optional(),
});

export const requestInfoSchema = z.object({
  notes: z.string().min(3).max(1000),
});
