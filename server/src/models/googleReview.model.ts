import { Schema, model, Document, Types } from 'mongoose';

export type ReviewFlowStatus =
  | 'pending'           // waiting for customer to rate
  | 'rated_high'        // 4–5 stars → redirected to Google
  | 'rated_low'         // 1–3 stars → private feedback
  | 'google_redirect'   // customer clicked Google review link
  | 'private_feedback'  // customer submitted private form
  | 'expired';

export interface IGoogleReview extends Document {
  restaurantId: Types.ObjectId;
  customerId?: Types.ObjectId;
  orderId: Types.ObjectId;
  sessionId?: string;

  // Rating capture
  starRating?: number;            // 1–5 given in the popup
  flowStatus: ReviewFlowStatus;

  // Private feedback (only when starRating < 4)
  privateFeedback?: string;
  privateImages: string[];
  privateSubmittedAt?: Date;

  // Google redirect
  googlePlaceId?: string;         // restaurant's Google Place ID
  googleRedirectUrl?: string;
  googleRedirectedAt?: Date;

  // For analytics
  deviceType?: string;
  sentAt: Date;
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const googleReviewSchema = new Schema<IGoogleReview>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    sessionId: { type: String, trim: true },

    starRating: { type: Number, min: 1, max: 5 },
    flowStatus: {
      type: String,
      enum: ['pending', 'rated_high', 'rated_low', 'google_redirect', 'private_feedback', 'expired'],
      default: 'pending',
      index: true,
    },

    privateFeedback: { type: String, trim: true, maxlength: 2000 },
    privateImages: [{ type: String, trim: true }],
    privateSubmittedAt: { type: Date },

    googlePlaceId: { type: String, trim: true },
    googleRedirectUrl: { type: String, trim: true },
    googleRedirectedAt: { type: Date },

    deviceType: { type: String, trim: true },
    sentAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

googleReviewSchema.index({ restaurantId: 1, createdAt: -1 });
googleReviewSchema.index({ restaurantId: 1, flowStatus: 1 });

export const GoogleReview = model<IGoogleReview>('GoogleReview', googleReviewSchema);
