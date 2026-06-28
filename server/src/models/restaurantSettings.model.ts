import { Schema, model, Document, Types } from 'mongoose';

export interface IRestaurantSettings extends Document {
  restaurantId: Types.ObjectId;
  currency: string;
  taxRate: number;
  serviceCharge: number;
  language: string;
  timezone: string;
  themeColor: string;
  accentColor: string;
  invoicePrefix: string;
  orderPrefix: string;
  qrPrefix: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSettingsSchema = new Schema<IRestaurantSettings>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, unique: true, index: true },
    currency: { type: String, default: 'INR' },
    taxRate: { type: Number, default: 18, min: 0, max: 100 },
    serviceCharge: { type: Number, default: 0, min: 0, max: 100 },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    themeColor: { type: String, default: '#f97316' },
    accentColor: { type: String, default: '#ea580c' },
    invoicePrefix: { type: String, default: 'INV' },
    orderPrefix: { type: String, default: 'ORD' },
    qrPrefix: { type: String, default: 'QR' },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const RestaurantSettings = model<IRestaurantSettings>('RestaurantSettings', restaurantSettingsSchema);
