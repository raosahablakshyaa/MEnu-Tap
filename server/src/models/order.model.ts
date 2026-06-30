import { Schema, model, Document, Types } from 'mongoose';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'wallet' | 'net_banking' | 'razorpay' | 'split';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';

export interface IOrderAddon {
  name: string;
  price: number;
}

export interface IOrderItem {
  menuItemId?: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;           // effective unit price
  variantName?: string;
  addons: IOrderAddon[];
  notes?: string;
  subtotal: number;        // price * quantity + addons total
}

export interface IOrder extends Document {
  orderNumber: string;
  restaurantId: Types.ObjectId;
  tableId?: Types.ObjectId;
  tableNumber?: string;

  // Customer / session
  sessionId?: string;            // customer session (no-auth)
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;

  // Order
  status: OrderStatus;
  items: IOrderItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;                // % applied
  discountAmount: number;
  couponCode?: string;
  packingCharges: number;
  serviceCharges: number;
  totalAmount: number;
  currency: string;

  // Payment
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  transactionId?: string;
  paidAt?: Date;
  gstInvoiceId?: Types.ObjectId;
  gstInvoiceNumber?: string;

  // Kitchen lifecycle timestamps
  acceptedAt?: Date;
  preparingAt?: Date;
  readyAt?: Date;
  servedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;

  // Staff
  acceptedBy?: Types.ObjectId;   // kitchen_staff / manager
  servedBy?: Types.ObjectId;     // waiter

  // Feedback
  feedbackGiven: boolean;
  estimatedPrepTime?: number;    // minutes

  notes?: string;

  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const orderAddonSchema = new Schema<IOrderAddon>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    variantName: { type: String, trim: true },
    addons: { type: [orderAddonSchema], default: [] },
    notes: { type: String, trim: true, maxlength: 300 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    tableId: { type: Schema.Types.ObjectId, ref: 'Table', index: true },
    tableNumber: { type: String, trim: true },

    sessionId: { type: String, index: true },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    customerEmail: { type: String, trim: true, lowercase: true },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },

    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, trim: true, uppercase: true },
    packingCharges: { type: Number, default: 0, min: 0 },
    serviceCharges: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partial'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'wallet', 'net_banking', 'razorpay', 'split'],
    },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    transactionId: { type: String },
    paidAt: { type: Date },
    gstInvoiceId: { type: Schema.Types.ObjectId, ref: 'GstInvoice' },
    gstInvoiceNumber: { type: String, trim: true },

    acceptedAt: { type: Date },
    preparingAt: { type: Date },
    readyAt: { type: Date },
    servedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, trim: true },

    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    servedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    feedbackGiven: { type: Boolean, default: false },
    estimatedPrepTime: { type: Number, min: 0 },
    notes: { type: String, trim: true, maxlength: 500 },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ restaurantId: 1, tableId: 1, status: 1 });
orderSchema.index({ sessionId: 1, restaurantId: 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.pre('find', function () { this.where({ isDeleted: false }); });
orderSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const Order = model<IOrder>('Order', orderSchema);
