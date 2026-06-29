import { Schema, model, Document, Types } from 'mongoose';

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'bounced';

export interface ICampaignRecipient {
  customerId: Types.ObjectId;
  phone?: string;
  email?: string;
  status: MessageStatus;
  failureReason?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  convertedAt?: Date;   // placed an order after campaign
  orderId?: Types.ObjectId;
}

export interface ICampaignReport extends Document {
  restaurantId: Types.ObjectId;
  campaignId: Types.ObjectId;
  runAt: Date;

  // Aggregates
  totalTargeted: number;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  totalConverted: number;
  revenue: number;      // total revenue from conversions

  // Per-recipient log
  recipients: ICampaignRecipient[];
  createdAt: Date;
}

const recipientSchema = new Schema<ICampaignRecipient>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'read', 'failed', 'bounced'],
      default: 'queued',
    },
    failureReason: { type: String, trim: true },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    openedAt: { type: Date },
    clickedAt: { type: Date },
    convertedAt: { type: Date },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  },
  { _id: false }
);

const campaignReportSchema = new Schema<ICampaignReport>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    runAt: { type: Date, required: true, default: Date.now },
    totalTargeted: { type: Number, default: 0 },
    totalSent: { type: Number, default: 0 },
    totalDelivered: { type: Number, default: 0 },
    totalRead: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    totalConverted: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    recipients: { type: [recipientSchema], default: [] },
  },
  { timestamps: true }
);

campaignReportSchema.index({ campaignId: 1, runAt: -1 });
campaignReportSchema.index({ restaurantId: 1, runAt: -1 });

export const CampaignReport = model<ICampaignReport>('CampaignReport', campaignReportSchema);
