import { Schema, model, Document, Types } from 'mongoose';

export interface IRestaurantVerification extends Document {
  restaurantId: Types.ObjectId;
  userId: Types.ObjectId;
  emailToken?: string;
  emailTokenExpires?: Date;
  emailVerifiedAt?: Date;
  phoneOtpHash?: string;
  phoneOtpExpires?: Date;
  phoneVerifiedAt?: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantVerificationSchema = new Schema<IRestaurantVerification>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    emailToken: { type: String, select: false },
    emailTokenExpires: { type: Date, select: false },
    emailVerifiedAt: { type: Date },
    phoneOtpHash: { type: String, select: false },
    phoneOtpExpires: { type: Date, select: false },
    phoneVerifiedAt: { type: Date },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const RestaurantVerification = model<IRestaurantVerification>('RestaurantVerification', restaurantVerificationSchema);
