import { Schema, model, Document, Types } from 'mongoose';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface IStaffInvitation extends Document {
  restaurantId: Types.ObjectId;
  email: string;
  roleSlug: string;
  roleId: Types.ObjectId;
  token: string;
  status: InvitationStatus;
  invitedBy: Types.ObjectId;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const staffInvitationSchema = new Schema<IStaffInvitation>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    roleSlug: { type: String, required: true },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    token: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ['pending', 'accepted', 'expired', 'cancelled'], default: 'pending', index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date },
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

staffInvitationSchema.index({ restaurantId: 1, email: 1, status: 1 });

export const StaffInvitation = model<IStaffInvitation>('StaffInvitation', staffInvitationSchema);
