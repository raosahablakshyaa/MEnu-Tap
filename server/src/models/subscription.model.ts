import { Schema, model, Document, Types } from 'mongoose';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'paused' | 'pending';

export interface ISubscription extends Document {
  restaurantId: Types.ObjectId;
  planId: Types.ObjectId;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  amount: number;
  currency: string;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  cancelReason?: string;
  upgradedFrom?: Types.ObjectId;
  reminderSentAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'paused', 'pending'],
      default: 'pending',
      index: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    autoRenew: { type: Boolean, default: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelReason: { type: String, trim: true },
    upgradedFrom: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    reminderSentAt: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

subscriptionSchema.index({ restaurantId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });

subscriptionSchema.pre('find', function () { this.where({ isDeleted: false }); });
subscriptionSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);
