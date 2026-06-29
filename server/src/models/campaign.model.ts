import { Schema, model, Document, Types } from 'mongoose';

export type CampaignChannel = 'whatsapp' | 'email' | 'sms' | 'push';
export type CampaignType =
  | 'instant'
  | 'scheduled'
  | 'recurring'
  | 'birthday'
  | 'anniversary'
  | 'win_back'      // inactive customers
  | 'festival'
  | 'happy_hour'
  | 'weekend';

export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'failed' | 'cancelled';

export type TargetAudience =
  | 'all'
  | 'vip'
  | 'new'
  | 'inactive'
  | 'high_spenders'
  | 'birthday_this_month'
  | 'anniversary_this_month'
  | 'not_visited_30_days'
  | 'not_visited_60_days'
  | 'not_visited_90_days'
  | 'custom_segment';

export interface ICampaign extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  description?: string;
  channel: CampaignChannel;
  type: CampaignType;
  status: CampaignStatus;

  // Content
  subject?: string;               // email subject
  message: string;                // WhatsApp/SMS body or email body (can be HTML)
  templateId?: Types.ObjectId;    // MarketingTemplate ref
  couponId?: Types.ObjectId;      // RestaurantCoupon to attach

  // Targeting
  targetAudience: TargetAudience;
  customSegmentName?: string;
  targetCustomerIds: Types.ObjectId[];  // overrides audience if provided
  inactiveDays?: number;          // for 'not_visited_X_days' audience

  // Scheduling
  scheduledAt?: Date;
  recurringCron?: string;         // cron expression for recurring
  lastRunAt?: Date;
  nextRunAt?: Date;

  // Stats (denormalised from CampaignReport)
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;

  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true },
    channel: { type: String, enum: ['whatsapp', 'email', 'sms', 'push'], required: true },
    type: {
      type: String,
      enum: ['instant', 'scheduled', 'recurring', 'birthday', 'anniversary',
             'win_back', 'festival', 'happy_hour', 'weekend'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'running', 'completed', 'paused', 'failed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    subject: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'MarketingTemplate' },
    couponId: { type: Schema.Types.ObjectId, ref: 'RestaurantCoupon' },

    targetAudience: {
      type: String,
      enum: ['all', 'vip', 'new', 'inactive', 'high_spenders', 'birthday_this_month',
             'anniversary_this_month', 'not_visited_30_days', 'not_visited_60_days',
             'not_visited_90_days', 'custom_segment'],
      default: 'all',
    },
    customSegmentName: { type: String, trim: true },
    targetCustomerIds: [{ type: Schema.Types.ObjectId, ref: 'Customer' }],
    inactiveDays: { type: Number, min: 1 },

    scheduledAt: { type: Date },
    recurringCron: { type: String, trim: true },
    lastRunAt: { type: Date },
    nextRunAt: { type: Date },

    totalSent: { type: Number, default: 0, min: 0 },
    totalDelivered: { type: Number, default: 0, min: 0 },
    totalFailed: { type: Number, default: 0, min: 0 },
    totalOpened: { type: Number, default: 0, min: 0 },
    totalClicked: { type: Number, default: 0, min: 0 },
    totalConverted: { type: Number, default: 0, min: 0 },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

campaignSchema.index({ restaurantId: 1, status: 1 });
campaignSchema.index({ restaurantId: 1, type: 1 });
campaignSchema.index({ scheduledAt: 1, status: 1 });
campaignSchema.pre('find', function () { this.where({ isDeleted: false }); });
campaignSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const Campaign = model<ICampaign>('Campaign', campaignSchema);
