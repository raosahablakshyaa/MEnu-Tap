import { Schema, model, Document, Types } from 'mongoose';

export interface ISupplier extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  paymentTermsDays: number;
  creditLimit?: number;
  outstandingBalance: number;
  rating: number;
  totalOrders: number;
  totalValue: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    gstNumber: { type: String, trim: true, uppercase: true },
    paymentTermsDays: { type: Number, default: 30, min: 0 },
    creditLimit: { type: Number, min: 0 },
    outstandingBalance: { type: Number, default: 0 },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    totalOrders: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

supplierSchema.index({ restaurantId: 1, name: 1 });

export const Supplier = model<ISupplier>('Supplier', supplierSchema);
