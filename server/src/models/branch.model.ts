import { Schema, model, Document, Types } from 'mongoose';

export type BranchStatus = 'active' | 'inactive' | 'under_renovation' | 'closed';

export interface IBranch extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  code: string;
  isHeadOffice: boolean;
  status: BranchStatus;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
  managerId?: Types.ObjectId;
  openingTime?: string;
  closingTime?: string;
  seatingCapacity?: number;
  gstNumber?: string;
  fssaiNumber?: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    code: { type: String, required: true, trim: true, uppercase: true },
    isHeadOffice: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['active', 'inactive', 'under_renovation', 'closed'],
      default: 'active',
      index: true,
    },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    openingTime: { type: String, trim: true },
    closingTime: { type: String, trim: true },
    seatingCapacity: { type: Number, min: 0 },
    gstNumber: { type: String, trim: true, uppercase: true },
    fssaiNumber: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { timestamps: true }
);

branchSchema.index({ restaurantId: 1, code: 1 }, { unique: true });

export const Branch = model<IBranch>('Branch', branchSchema);
