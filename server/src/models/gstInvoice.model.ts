import { Schema, model, Document, Types } from 'mongoose';

export type GstInvoiceType = 'B2B' | 'B2C' | 'export';
export type GstInvoiceStatus = 'draft' | 'issued' | 'cancelled';

export interface IGstInvoice extends Document {
  restaurantId: Types.ObjectId;
  invoiceNumber: string;
  invoiceType: GstInvoiceType;
  invoiceDate: Date;
  status: GstInvoiceStatus;
  // Seller
  sellerName: string;
  sellerGST: string;
  sellerAddress: string;
  // Buyer
  buyerName?: string;
  buyerGST?: string;
  buyerAddress?: string;
  // Line items
  items: Array<{
    description: string;
    hsnCode?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    taxableAmount: number;
    gstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalAmount: number;
  }>;
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
  orderId?: Types.ObjectId;
  posTransactionId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const gstInvoiceSchema = new Schema<IGstInvoice>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    invoiceNumber: { type: String, required: true },
    invoiceType: { type: String, enum: ['B2B', 'B2C', 'export'], default: 'B2C' },
    invoiceDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ['draft', 'issued', 'cancelled'], default: 'draft', index: true },
    sellerName: { type: String, required: true, trim: true },
    sellerGST: { type: String, required: true, trim: true },
    sellerAddress: { type: String, required: true, trim: true },
    buyerName: { type: String, trim: true },
    buyerGST: { type: String, trim: true },
    buyerAddress: { type: String, trim: true },
    items: [
      {
        description: { type: String, required: true },
        hsnCode: { type: String, trim: true },
        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String, default: 'nos' },
        unitPrice: { type: Number, required: true, min: 0 },
        taxableAmount: { type: Number, required: true, min: 0 },
        gstRate: { type: Number, required: true, min: 0 },
        cgstAmount: { type: Number, default: 0 },
        sgstAmount: { type: Number, default: 0 },
        igstAmount: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: { type: Number, default: 0 },
    totalCgst: { type: Number, default: 0 },
    totalSgst: { type: Number, default: 0 },
    totalIgst: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    amountInWords: { type: String, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    posTransactionId: { type: Schema.Types.ObjectId, ref: 'PosTransaction' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

gstInvoiceSchema.index({ restaurantId: 1, invoiceNumber: 1 }, { unique: true });
gstInvoiceSchema.index({ restaurantId: 1, invoiceDate: -1 });

export const GstInvoice = model<IGstInvoice>('GstInvoice', gstInvoiceSchema);
