import { Schema, model, Document, Types } from 'mongoose';

export type POStatus = 'draft' | 'sent' | 'confirmed' | 'partial' | 'received' | 'cancelled';

export interface IPOItem {
  ingredientId: Types.ObjectId;
  ingredientName: string;
  unit: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  taxPercent: number;
  totalAmount: number;
}

export interface IPurchaseOrder extends Document {
  restaurantId: Types.ObjectId;
  poNumber: string;
  supplierId: Types.ObjectId;
  supplierName: string;
  status: POStatus;
  items: IPOItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  expectedDelivery?: Date;
  receivedAt?: Date;
  notes?: string;
  invoiceNumber?: string;
  createdBy?: Types.ObjectId;
  receivedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const poItemSchema = new Schema<IPOItem>(
  {
    ingredientId: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    ingredientName: { type: String, required: true, trim: true },
    unit: { type: String, required: true },
    orderedQuantity: { type: Number, required: true, min: 0 },
    receivedQuantity: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    poNumber: { type: String, required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    supplierName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled'],
      default: 'draft',
      index: true,
    },
    items: { type: [poItemSchema], required: true },
    subtotal: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    expectedDelivery: { type: Date },
    receivedAt: { type: Date },
    notes: { type: String, trim: true },
    invoiceNumber: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ restaurantId: 1, poNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ restaurantId: 1, createdAt: -1 });

export const PurchaseOrder = model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);
