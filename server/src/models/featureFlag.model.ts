import { Schema, model, Document, Types } from 'mongoose';

export type FeatureFlagScope = 'global' | 'plan' | 'restaurant';

export interface IFeatureFlag extends Document {
  key: string;
  name: string;
  description: string;
  scope: FeatureFlagScope;
  enabled: boolean;
  allowedPlanIds: Types.ObjectId[];
  restaurantOverrides: Array<{ restaurantId: Types.ObjectId; enabled: boolean }>;
  rolloutPercent: number;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const featureFlagSchema = new Schema<IFeatureFlag>(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    scope: { type: String, enum: ['global', 'plan', 'restaurant'], default: 'global' },
    enabled: { type: Boolean, default: true, index: true },
    allowedPlanIds: [{ type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' }],
    restaurantOverrides: [
      {
        restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
        enabled: { type: Boolean, required: true },
      },
    ],
    rolloutPercent: { type: Number, default: 100, min: 0, max: 100 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// All feature flag keys
export const FEATURE_FLAGS = {
  INVENTORY: 'inventory',
  CRM: 'crm',
  LOYALTY: 'loyalty',
  AI_ADVISOR: 'ai_advisor',
  POS: 'pos',
  WHATSAPP_MARKETING: 'whatsapp_marketing',
  MULTI_BRANCH: 'multi_branch',
  PURCHASE_ORDERS: 'purchase_orders',
  STAFF_ATTENDANCE: 'staff_attendance',
  GST_INVOICING: 'gst_invoicing',
  API_ACCESS: 'api_access',
} as const;

export const FeatureFlag = model<IFeatureFlag>('FeatureFlag', featureFlagSchema);
