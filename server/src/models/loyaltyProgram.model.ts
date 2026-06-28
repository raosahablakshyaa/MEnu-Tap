import { Schema, model, Document, Types } from 'mongoose';

export type LoyaltyRuleType =
  | 'points_per_rupee'       // e.g. 1 point per ₹10 spent
  | 'points_per_visit'       // e.g. 5 points per visit
  | 'bonus_on_spend'         // e.g. 100 bonus points when spend reaches ₹500
  | 'birthday_bonus'
  | 'anniversary_bonus'
  | 'referral_bonus'
  | 'first_order_bonus'
  | 'milestone_visits';      // e.g. 10 visits → free dessert

export interface ILoyaltyRule {
  type: LoyaltyRuleType;
  pointsAwarded: number;
  spendThreshold?: number;   // for points_per_rupee: rupees per point
  visitThreshold?: number;   // for milestone_visits
  description: string;
  isActive: boolean;
}

export interface ILoyaltyProgram extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  description?: string;
  pointsName: string;        // e.g. "Stars", "Coins", "Points"
  pointsValueInRupees: number; // 1 point = ₹X discount
  rules: ILoyaltyRule[];
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const loyaltyRuleSchema = new Schema<ILoyaltyRule>(
  {
    type: {
      type: String,
      enum: [
        'points_per_rupee', 'points_per_visit', 'bonus_on_spend', 'birthday_bonus',
        'anniversary_bonus', 'referral_bonus', 'first_order_bonus', 'milestone_visits',
      ],
      required: true,
    },
    pointsAwarded: { type: Number, required: true, min: 0 },
    spendThreshold: { type: Number, min: 0 },
    visitThreshold: { type: Number, min: 1 },
    description: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const loyaltyProgramSchema = new Schema<ILoyaltyProgram>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    pointsName: { type: String, default: 'Points', trim: true },
    pointsValueInRupees: { type: Number, default: 1, min: 0 },
    rules: { type: [loyaltyRuleSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

loyaltyProgramSchema.pre('find', function () { this.where({ isDeleted: false }); });
loyaltyProgramSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const LoyaltyProgram = model<ILoyaltyProgram>('LoyaltyProgram', loyaltyProgramSchema);
