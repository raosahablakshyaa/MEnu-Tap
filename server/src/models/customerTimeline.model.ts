import { Schema, model, Document, Types } from 'mongoose';

export type TimelineEventType =
  | 'visit'
  | 'order'
  | 'payment'
  | 'review'
  | 'coupon_used'
  | 'points_earned'
  | 'points_redeemed'
  | 'membership_upgrade'
  | 'referral'
  | 'complaint'
  | 'refund'
  | 'cancellation'
  | 'campaign_sent'
  | 'campaign_opened'
  | 'note_added'
  | 'tag_changed'
  | 'consent_updated';

export interface ICustomerTimeline extends Document {
  restaurantId: Types.ObjectId;
  customerId: Types.ObjectId;
  eventType: TimelineEventType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;  // orderId, couponCode, points, etc.
  referenceId?: Types.ObjectId;        // orderId / couponId / campaignId
  referenceModel?: string;             // 'Order' | 'RestaurantCoupon' | 'Campaign'
  amount?: number;                     // transaction amount if relevant
  points?: number;                     // points earned/redeemed
  performedBy?: Types.ObjectId;        // staff userId (for notes/tag changes)
  createdAt: Date;
}

const customerTimelineSchema = new Schema<ICustomerTimeline>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    eventType: {
      type: String,
      enum: [
        'visit', 'order', 'payment', 'review', 'coupon_used', 'points_earned',
        'points_redeemed', 'membership_upgrade', 'referral', 'complaint', 'refund',
        'cancellation', 'campaign_sent', 'campaign_opened', 'note_added',
        'tag_changed', 'consent_updated',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
    referenceId: { type: Schema.Types.ObjectId },
    referenceModel: { type: String, trim: true },
    amount: { type: Number },
    points: { type: Number },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

customerTimelineSchema.index({ customerId: 1, createdAt: -1 });
customerTimelineSchema.index({ restaurantId: 1, createdAt: -1 });
customerTimelineSchema.index({ restaurantId: 1, eventType: 1 });

export const CustomerTimeline = model<ICustomerTimeline>('CustomerTimeline', customerTimelineSchema);
