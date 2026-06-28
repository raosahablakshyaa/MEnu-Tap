import { Schema, model, Document, Types } from 'mongoose';

export type LoyaltyTxType = 'earn' | 'redeem' | 'expire' | 'bonus' | 'adjust';

export interface ILoyaltyTransaction extends Document {
  restaurantId: Types.ObjectId;
  customerId: Types.ObjectId;
  programId: Types.ObjectId;
  type: LoyaltyTxType;
  points: number;            // positive = earn, negative = redeem/expire
  balanceBefore: number;
  balanceAfter: number;
  orderId?: Types.ObjectId;
  couponId?: Types.ObjectId;
  ruleType?: string;
  description: string;
  performedBy?: Types.ObjectId;  // staff if manual adjust
  expiresAt?: Date;
  createdAt: Date;
}

const loyaltyTransactionSchema = new Schema<ILoyaltyTransaction>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'LoyaltyProgram', required: true },
    type: {
      type: String,
      enum: ['earn', 'redeem', 'expire', 'bonus', 'adjust'],
      required: true,
      index: true,
    },
    points: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    couponId: { type: Schema.Types.ObjectId, ref: 'RestaurantCoupon' },
    ruleType: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

loyaltyTransactionSchema.index({ customerId: 1, createdAt: -1 });
loyaltyTransactionSchema.index({ restaurantId: 1, createdAt: -1 });

export const LoyaltyTransaction = model<ILoyaltyTransaction>('LoyaltyTransaction', loyaltyTransactionSchema);
