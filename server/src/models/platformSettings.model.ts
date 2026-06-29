import { Schema, model, Document, Types } from 'mongoose';

export interface IPlatformSettings extends Document {
  platformName: string;
  logo?: string;
  favicon?: string;
  currency: string;
  taxRate: number;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  featureFlags: Record<string, boolean>;
  smtp: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    fromEmail?: string;
    fromName?: string;
    secure?: boolean;
  };
  whatsapp: { apiKey?: string; phoneNumberId?: string; businessAccountId?: string };
  sms: { provider?: string; apiKey?: string; senderId?: string };
  razorpay: { keyId?: string; keySecret?: string };
  cloudinary: { cloudName?: string; apiKey?: string; apiSecret?: string };
  mongodb: { uri?: string };
  redis: { url?: string };
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    platformName: { type: String, default: 'TapMenu', trim: true },
    logo: { type: String, trim: true },
    favicon: { type: String, trim: true },
    currency: { type: String, default: 'INR' },
    taxRate: { type: Number, default: 18, min: 0, max: 100 },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, trim: true },
    featureFlags: { type: Map, of: Boolean, default: {} },
    smtp: {
      host: String, port: Number, user: String, password: String,
      fromEmail: String, fromName: String, secure: { type: Boolean, default: true },
    },
    whatsapp: { apiKey: String, phoneNumberId: String, businessAccountId: String },
    sms: { provider: String, apiKey: String, senderId: String },
    razorpay: { keyId: String, keySecret: String },
    cloudinary: { cloudName: String, apiKey: String, apiSecret: String },
    mongodb: { uri: String },
    redis: { url: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const PlatformSettings = model<IPlatformSettings>('PlatformSettings', platformSettingsSchema);
