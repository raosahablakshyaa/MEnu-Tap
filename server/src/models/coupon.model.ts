import { Schema, model, Document, Types } from 'mongoose';

export type CouponType = 'percentage' | 'flat' | 'referral' | 'festival';
export type CouponStatus = 'active' | 'expired' | 'paused' | 'depleted';

export interface ICoupon extends Document {
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  usageLimit: number;
  usageCount: number;
  perUserLimit: number;
  applicablePlans: Types.ObjectId[];
  startDate: Date;
  endDate: Date;
  status: CouponStatus;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: ['percentage', 'flat', 'referral', 'festival'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    minOrderAmount: { type: Number, min: 0, default: 0 },
    usageLimit: { type: Number, required: true, min: 1 },
    usageCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    applicablePlans: [{ type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ['active', 'expired', 'paused', 'depleted'], default: 'active', index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

couponSchema.pre('find', function () { this.where({ isDeleted: false }); });
couponSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const Coupon = model<ICoupon>('Coupon', couponSchema);
