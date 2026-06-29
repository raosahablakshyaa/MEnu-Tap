import { Schema, model, Document, Types } from 'mongoose';

export type ReferralStatus = 'pending' | 'successful' | 'expired' | 'voided';

export interface IReferral extends Document {
  restaurantId: Types.ObjectId;
  referrerId: Types.ObjectId;        // Customer who referred
  refereePhone: string;              // Phone of invited person
  refereeCustomerId?: Types.ObjectId; // Set when they actually sign up
  code: string;                      // referrer's referralCode
  status: ReferralStatus;
  rewardPointsForReferrer: number;
  rewardPointsForReferee: number;
  rewardedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    referrerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    refereePhone: { type: String, required: true, trim: true },
    refereeCustomerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    code: { type: String, required: true, trim: true, uppercase: true },
    status: {
      type: String,
      enum: ['pending', 'successful', 'expired', 'voided'],
      default: 'pending',
      index: true,
    },
    rewardPointsForReferrer: { type: Number, default: 0, min: 0 },
    rewardPointsForReferee: { type: Number, default: 0, min: 0 },
    rewardedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

referralSchema.index({ restaurantId: 1, code: 1 });
referralSchema.index({ restaurantId: 1, referrerId: 1 });
referralSchema.index({ restaurantId: 1, refereePhone: 1 });

export const Referral = model<IReferral>('Referral', referralSchema);
