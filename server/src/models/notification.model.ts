import { Schema, model, Document, Types } from 'mongoose';

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'push';
export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'failed' | 'cancelled';
export type NotificationTarget = 'all' | 'restaurants' | 'plan' | 'city' | 'state';

export interface INotification extends Document {
  title: string;
  message: string;
  channels: NotificationChannel[];
  targetType: NotificationTarget;
  targetIds: string[];
  targetFilter: { planId?: Types.ObjectId; city?: string; state?: string };
  scheduledAt?: Date;
  sentAt?: Date;
  status: NotificationStatus;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true },
    channels: [{ type: String, enum: ['email', 'sms', 'whatsapp', 'push'] }],
    targetType: { type: String, enum: ['all', 'restaurants', 'plan', 'city', 'state'], required: true },
    targetIds: [{ type: String }],
    targetFilter: {
      planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
      city: String,
      state: String,
    },
    scheduledAt: { type: Date, index: true },
    sentAt: { type: Date },
    status: { type: String, enum: ['draft', 'scheduled', 'sent', 'failed', 'cancelled'], default: 'draft', index: true },
    recipientCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

notificationSchema.pre('find', function () { this.where({ isDeleted: false }); });
notificationSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const Notification = model<INotification>('Notification', notificationSchema);
