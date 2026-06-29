import { Schema, model, Document, Types } from 'mongoose';
import type { MembershipTier } from './customer.model';

export interface IMembershipTierConfig {
  tier: MembershipTier;
  minSpend?: number;          // cumulative spend required
  minVisits?: number;
  minPoints?: number;
  discountPercent: number;    // benefit: % discount on orders
  bonusPointsMultiplier: number; // e.g. 2 = double points
  freeItemOnBirthday: boolean;
  priorityService: boolean;
  validityDays: number;       // tier validity from upgrade date (0 = lifetime)
  description?: string;
}

export interface IMembership extends Document {
  restaurantId: Types.ObjectId;
  name: string;               // e.g. "TapMenu VIP Club"
  description?: string;
  tiers: IMembershipTierConfig[];
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const tierConfigSchema = new Schema<IMembershipTierConfig>(
  {
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
      required: true,
    },
    minSpend: { type: Number, min: 0 },
    minVisits: { type: Number, min: 0 },
    minPoints: { type: Number, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    bonusPointsMultiplier: { type: Number, default: 1, min: 1 },
    freeItemOnBirthday: { type: Boolean, default: false },
    priorityService: { type: Boolean, default: false },
    validityDays: { type: Number, default: 0, min: 0 },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const membershipSchema = new Schema<IMembership>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    tiers: { type: [tierConfigSchema], default: [] },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

membershipSchema.pre('find', function () { this.where({ isDeleted: false }); });
membershipSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const Membership = model<IMembership>('Membership', membershipSchema);
