import { Schema, model, Document, Types } from 'mongoose';

export type RewardType = 'coupon' | 'free_item' | 'discount' | 'cashback' | 'upgrade' | 'gift_voucher';
export type RewardStatus = 'active' | 'redeemed' | 'expired' | 'voided';

export interface ICustomerReward extends Document {
  restaurantId: Types.ObjectId;
  customerId: Types.ObjectId;
  type: RewardType;
  status: RewardStatus;

  // What the reward is
  title: string;
  description?: string;
  couponId?: Types.ObjectId;         // linked RestaurantCoupon
  discountValue?: number;
  discountType?: 'percentage' | 'flat';
  freeItemId?: Types.ObjectId;       // MenuItem

  // Trigger
  trigger: string;                   // e.g. '10_visits', 'birthday', 'referral'
  programId?: Types.ObjectId;        // LoyaltyProgram that triggered this

  // Lifecycle
  issuedAt: Date;
  expiresAt: Date;
  redeemedAt?: Date;
  redeemedOrderId?: Types.ObjectId;
  voidedReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const customerRewardSchema = new Schema<ICustomerReward>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    type: {
      type: String,
      enum: ['coupon', 'free_item', 'discount', 'cashback', 'upgrade', 'gift_voucher'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'redeemed', 'expired', 'voided'],
      default: 'active',
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    couponId: { type: Schema.Types.ObjectId, ref: 'RestaurantCoupon' },
    discountValue: { type: Number, min: 0 },
    discountType: { type: String, enum: ['percentage', 'flat'] },
    freeItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    trigger: { type: String, required: true, trim: true },
    programId: { type: Schema.Types.ObjectId, ref: 'LoyaltyProgram' },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    redeemedAt: { type: Date },
    redeemedOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    voidedReason: { type: String, trim: true },
  },
  { timestamps: true }
);

customerRewardSchema.index({ customerId: 1, status: 1 });
customerRewardSchema.index({ restaurantId: 1, status: 1 });
customerRewardSchema.index({ expiresAt: 1, status: 1 });

export const CustomerReward = model<ICustomerReward>('CustomerReward', customerRewardSchema);
