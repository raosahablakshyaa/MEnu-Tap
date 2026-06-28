import { Schema, model, Document } from 'mongoose';

export type OtpPurpose = 'phone_verification' | 'login' | 'password_reset';

export interface IOtpVerification extends Document {
  phone: string;
  email?: string;
  otpHash: string;
  purpose: OtpPurpose;
  attempts: number;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const otpVerificationSchema = new Schema<IOtpVerification>(
  {
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    otpHash: { type: String, required: true, select: false },
    purpose: { type: String, enum: ['phone_verification', 'login', 'password_reset'], required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

otpVerificationSchema.index({ phone: 1, purpose: 1, verified: 1 });
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpVerification = model<IOtpVerification>('OtpVerification', otpVerificationSchema);
