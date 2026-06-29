import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomerSession extends Document {
  sessionId: string;               // uuid – client stores in localStorage
  restaurantId: Types.ObjectId;
  tableId: Types.ObjectId;
  qrCodeId: Types.ObjectId;
  tableNumber: string;

  // Customer info (optional – filled at checkout)
  name?: string;
  phone?: string;
  email?: string;
  birthday?: Date;
  anniversary?: Date;
  consentGiven: boolean;

  // Device / browser fingerprint
  device: string;                  // mobile | tablet | desktop
  browser: string;
  language: string;
  userAgent?: string;
  ipAddress?: string;

  // Session lifecycle
  expiresAt: Date;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const customerSessionSchema = new Schema<ICustomerSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    tableId: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
    qrCodeId: { type: Schema.Types.ObjectId, ref: 'QrCode', required: true },
    tableNumber: { type: String, required: true, trim: true },

    name: { type: String, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200 },
    birthday: { type: Date },
    anniversary: { type: Date },
    consentGiven: { type: Boolean, default: false },

    device: { type: String, default: 'mobile', trim: true },
    browser: { type: String, default: 'unknown', trim: true },
    language: { type: String, default: 'en', trim: true },
    userAgent: { type: String, trim: true },
    ipAddress: { type: String, trim: true },

    expiresAt: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

customerSessionSchema.index({ restaurantId: 1, isActive: 1 });
customerSessionSchema.index({ phone: 1, restaurantId: 1 });
customerSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const CustomerSession = model<ICustomerSession>('CustomerSession', customerSessionSchema);
