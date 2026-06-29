import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomerFeedback extends Document {
  restaurantId: Types.ObjectId;
  orderId: Types.ObjectId;
  sessionId: string;
  customerName?: string;
  customerPhone?: string;

  // Ratings (1–5)
  foodRating: number;
  serviceRating: number;
  ambienceRating: number;
  overallRating: number;

  comment?: string;
  images: string[];
  isPublished: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const customerFeedbackSchema = new Schema<ICustomerFeedback>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },

    foodRating: { type: Number, required: true, min: 1, max: 5 },
    serviceRating: { type: Number, required: true, min: 1, max: 5 },
    ambienceRating: { type: Number, required: true, min: 1, max: 5 },
    overallRating: { type: Number, required: true, min: 1, max: 5 },

    comment: { type: String, trim: true, maxlength: 1000 },
    images: [{ type: String, trim: true }],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

customerFeedbackSchema.index({ restaurantId: 1, createdAt: -1 });
customerFeedbackSchema.index({ orderId: 1 }, { unique: true }); // one feedback per order

export const CustomerFeedback = model<ICustomerFeedback>('CustomerFeedback', customerFeedbackSchema);
