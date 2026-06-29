import { Schema, model, Document, Types } from 'mongoose';

export type PosOrderType = 'dine_in' | 'takeaway' | 'delivery';
export type PosBillStatus = 'open' | 'billed' | 'paid' | 'voided';

export interface ISplitPayment {
  method: string;
  amount: number;
  reference?: string;
}

export interface IPosTransaction extends Document {
  restaurantId: Types.ObjectId;
  branchId?: Types.ObjectId;
  billNumber: string;
  orderType: PosOrderType;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    menuItemId?: Types.ObjectId;
    name: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }>;
  subtotal: number;
  discountAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  serviceCharge: number;
  packingCharge: number;
  totalAmount: number;
  paymentMethod: string;
  splitPayments: ISplitPayment[];
  cashReceived?: number;
  changeGiven?: number;
  status: PosBillStatus;
  gstInvoiceNumber?: string;
  isSynced: boolean;
  cashierId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const posTransactionSchema = new Schema<IPosTransaction>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    billNumber: { type: String, required: true },
    orderType: { type: String, enum: ['dine_in', 'takeaway', 'delivery'], default: 'dine_in' },
    tableNumber: { type: String, trim: true },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    cgst: { type: Number, default: 0, min: 0 },
    sgst: { type: Number, default: 0, min: 0 },
    igst: { type: Number, default: 0, min: 0 },
    serviceCharge: { type: Number, default: 0, min: 0 },
    packingCharge: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, default: 'cash' },
    splitPayments: [
      {
        method: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        reference: { type: String, trim: true },
      },
    ],
    cashReceived: { type: Number, min: 0 },
    changeGiven: { type: Number, min: 0 },
    status: { type: String, enum: ['open', 'billed', 'paid', 'voided'], default: 'open', index: true },
    gstInvoiceNumber: { type: String, trim: true },
    isSynced: { type: Boolean, default: true },
    cashierId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

posTransactionSchema.index({ restaurantId: 1, billNumber: 1 }, { unique: true });
posTransactionSchema.index({ restaurantId: 1, createdAt: -1 });
posTransactionSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });

export const PosTransaction = model<IPosTransaction>('PosTransaction', posTransactionSchema);
