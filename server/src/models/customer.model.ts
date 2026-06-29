import { Schema, model, Document, Types } from 'mongoose';

export type CustomerTag = 'vip' | 'regular' | 'new' | 'inactive' | 'lost' | 'blacklisted';
export type MembershipTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type CustomerGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface ICustomer extends Document {
  restaurantId: Types.ObjectId;

  // Identity
  name: string;
  phone: string;                  // primary key for lookup
  email?: string;
  gender?: CustomerGender;
  birthday?: Date;
  anniversary?: Date;
  preferredLanguage: string;
  photo?: string;
  address?: string;

  // Loyalty / membership
  membershipTier: MembershipTier;
  loyaltyPoints: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  referralCode: string;           // unique per customer per restaurant
  referredBy?: Types.ObjectId;    // another customer

  // Metrics (denormalised for fast CRM queries)
  totalVisits: number;
  totalOrders: number;
  totalAmountSpent: number;
  averageOrderValue: number;
  firstVisitAt?: Date;
  lastVisitAt?: Date;
  lastOrderAt?: Date;
  lastOrderId?: Types.ObjectId;

  // Preferences (auto-detected from order history)
  favouriteFoodTypes: string[];   // e.g. ['veg', 'non_veg']
  favouriteCategoryIds: Types.ObjectId[];
  favouriteMenuItemIds: Types.ObjectId[];
  preferredDiningTime?: string;   // 'lunch' | 'dinner' | 'breakfast'
  preferredPaymentMethod?: string;
  preferredTableId?: Types.ObjectId;

  // Segmentation
  tags: CustomerTag[];
  customTags: string[];
  segment?: string;               // auto or custom
  notes?: string;                 // owner notes

  // Consent
  marketingConsent: boolean;
  whatsappConsent: boolean;
  emailConsent: boolean;
  smsConsent: boolean;
  consentUpdatedAt?: Date;

  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },

    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200 },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    birthday: { type: Date },
    anniversary: { type: Date },
    preferredLanguage: { type: String, default: 'en', trim: true },
    photo: { type: String, trim: true },
    address: { type: String, trim: true, maxlength: 500 },

    membershipTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
      default: 'bronze',
      index: true,
    },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    totalPointsEarned: { type: Number, default: 0, min: 0 },
    totalPointsRedeemed: { type: Number, default: 0, min: 0 },
    referralCode: { type: String, required: true, trim: true, uppercase: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'Customer' },

    totalVisits: { type: Number, default: 0, min: 0 },
    totalOrders: { type: Number, default: 0, min: 0 },
    totalAmountSpent: { type: Number, default: 0, min: 0 },
    averageOrderValue: { type: Number, default: 0, min: 0 },
    firstVisitAt: { type: Date },
    lastVisitAt: { type: Date },
    lastOrderAt: { type: Date },
    lastOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },

    favouriteFoodTypes: [{ type: String, trim: true }],
    favouriteCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'MenuCategory' }],
    favouriteMenuItemIds: [{ type: Schema.Types.ObjectId, ref: 'MenuItem' }],
    preferredDiningTime: { type: String, trim: true },
    preferredPaymentMethod: { type: String, trim: true },
    preferredTableId: { type: Schema.Types.ObjectId, ref: 'Table' },

    tags: [{ type: String, enum: ['vip', 'regular', 'new', 'inactive', 'lost', 'blacklisted'] }],
    customTags: [{ type: String, trim: true }],
    segment: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 2000 },

    marketingConsent: { type: Boolean, default: false },
    whatsappConsent: { type: Boolean, default: false },
    emailConsent: { type: Boolean, default: false },
    smsConsent: { type: Boolean, default: false },
    consentUpdatedAt: { type: Date },

    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

customerSchema.index({ restaurantId: 1, phone: 1 }, { unique: true });
customerSchema.index({ restaurantId: 1, email: 1 }, { sparse: true });
customerSchema.index({ restaurantId: 1, referralCode: 1 }, { unique: true });
customerSchema.index({ restaurantId: 1, membershipTier: 1 });
customerSchema.index({ restaurantId: 1, tags: 1 });
customerSchema.index({ restaurantId: 1, lastVisitAt: -1 });
customerSchema.index({ restaurantId: 1, totalAmountSpent: -1 });
customerSchema.index({ restaurantId: 1, birthday: 1 });
customerSchema.index({ restaurantId: 1, anniversary: 1 });
customerSchema.pre('find', function () { this.where({ isDeleted: false }); });
customerSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const Customer = model<ICustomer>('Customer', customerSchema);
