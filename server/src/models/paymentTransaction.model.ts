import { Schema, model, Document, Types } from 'mongoose';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentType = 'subscription' | 'order' | 'refund' | 'other';

export interface IPaymentTransaction extends Document {
  transactionId: string;
  restaurantId: Types.ObjectId;
  subscriptionId?: Types.ObjectId;
  invoiceId?: Types.ObjectId;
  type: PaymentType;
  status: PaymentStatus;
  amount: number;
  currency: string;
  gateway: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  refundAmount?: number;
  refundedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    type: { type: String, enum: ['subscription', 'order', 'refund', 'other'], required: true, index: true },
    status: { type: String, enum: ['pending', 'success', 'failed', 'refunded', 'partially_refunded'], default: 'pending', index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    gateway: { type: String, default: 'razorpay' },
    gatewayOrderId: { type: String, index: true },
    gatewayPaymentId: { type: String, index: true },
    gatewaySignature: { type: String },
    refundAmount: { type: Number, min: 0 },
    refundedAt: { type: Date },
    failureReason: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ createdAt: -1 });
paymentTransactionSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
paymentTransactionSchema.index({ status: 1, createdAt: -1 });

paymentTransactionSchema.pre('find', function () { this.where({ isDeleted: false }); });
paymentTransactionSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const PaymentTransaction = model<IPaymentTransaction>('PaymentTransaction', paymentTransactionSchema);
