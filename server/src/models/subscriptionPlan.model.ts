import { Schema, model, Document, Types } from 'mongoose';

export type PlanDuration = 'monthly' | '3_months' | '6_months' | '12_months' | 'custom';

export interface IPlanFeatures {
  maxTables: number;
  maxStaff: number;
  maxMenuItems: number;
  maxBranches: number;
  storageLimitMb: number;
  qrLimit: number;
  analyticsAccess: boolean;
  aiFeatures: boolean;
  loyaltyAccess: boolean;
  whatsappMarketing: boolean;
  posAccess: boolean;
  inventoryAccess: boolean;
  ownerAppAccess: boolean;
  customerAppAccess: boolean;
}

export interface ISubscriptionPlan extends Document {
  name: string;
  slug: string;
  description?: string;
  duration: PlanDuration;
  durationDays: number;
  price: number;
  currency: string;
  features: IPlanFeatures;
  featureList: string[];
  isActive: boolean;
  isPaused: boolean;
  isPopular: boolean;
  sortOrder: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const featuresSchema = new Schema<IPlanFeatures>(
  {
    maxTables: { type: Number, default: 10, min: 0 },
    maxStaff: { type: Number, default: 5, min: 0 },
    maxMenuItems: { type: Number, default: 100, min: 0 },
    maxBranches: { type: Number, default: 1, min: 1 },
    storageLimitMb: { type: Number, default: 500, min: 0 },
    qrLimit: { type: Number, default: 20, min: 0 },
    analyticsAccess: { type: Boolean, default: false },
    aiFeatures: { type: Boolean, default: false },
    loyaltyAccess: { type: Boolean, default: false },
    whatsappMarketing: { type: Boolean, default: false },
    posAccess: { type: Boolean, default: true },
    inventoryAccess: { type: Boolean, default: false },
    ownerAppAccess: { type: Boolean, default: true },
    customerAppAccess: { type: Boolean, default: true },
  },
  { _id: false }
);

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    description: { type: String, trim: true, maxlength: 500 },
    duration: {
      type: String,
      enum: ['monthly', '3_months', '6_months', '12_months', 'custom'],
      required: true,
    },
    durationDays: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', trim: true },
    features: { type: featuresSchema, default: () => ({}) },
    featureList: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true, index: true },
    isPaused: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

subscriptionPlanSchema.pre('find', function () { this.where({ isDeleted: false }); });
subscriptionPlanSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const SubscriptionPlan = model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);
