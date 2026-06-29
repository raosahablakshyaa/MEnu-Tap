import { Schema, model, Document, Types } from 'mongoose';

export type TemplateChannel = 'whatsapp' | 'email' | 'sms';
export type TemplateCategory = 'offer' | 'coupon' | 'invoice' | 'newsletter' | 'event' | 'birthday' | 'anniversary' | 'festival' | 'win_back' | 'order_status';

export interface IMarketingTemplate extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  channel: TemplateChannel;
  category: TemplateCategory;
  subject?: string;     // email subject (supports {{restaurantName}} style vars)
  body: string;         // message body with {{variables}}
  variables: string[];  // list of variable names used, e.g. ['customerName', 'couponCode']
  isDefault: boolean;   // system-provided default
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const marketingTemplateSchema = new Schema<IMarketingTemplate>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    channel: { type: String, enum: ['whatsapp', 'email', 'sms'], required: true },
    category: {
      type: String,
      enum: ['offer', 'coupon', 'invoice', 'newsletter', 'event', 'birthday',
             'anniversary', 'festival', 'win_back', 'order_status'],
      required: true,
    },
    subject: { type: String, trim: true },
    body: { type: String, required: true },
    variables: [{ type: String, trim: true }],
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

marketingTemplateSchema.index({ restaurantId: 1, channel: 1 });
marketingTemplateSchema.index({ restaurantId: 1, category: 1 });
marketingTemplateSchema.pre('find', function () { this.where({ isDeleted: false }); });
marketingTemplateSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const MarketingTemplate = model<IMarketingTemplate>('MarketingTemplate', marketingTemplateSchema);
