import { Schema, model, Document, Types } from 'mongoose';

export interface ICartItem {
  _id?: Types.ObjectId;       // populated by Mongoose subdoc _id: true
  menuItemId: Types.ObjectId;
  name: string;
  price: number;              // effective price (variant or base)
  quantity: number;
  variantName?: string;
  addons: { name: string; price: number }[];
  notes?: string;             // "less spicy", "no onion"
  subtotal: number;
}

export interface ICart extends Document {
  sessionId: string;
  restaurantId: Types.ObjectId;
  tableId: Types.ObjectId;
  tableNumber: string;
  items: ICartItem[];
  totalItems: number;
  subtotal: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    variantName: { type: String, trim: true },
    addons: [{ name: { type: String, trim: true }, price: { type: Number, min: 0 } }],
    notes: { type: String, trim: true, maxlength: 300 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const cartSchema = new Schema<ICart>(
  {
    sessionId: { type: String, required: true, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    tableId: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
    tableNumber: { type: String, required: true, trim: true },
    items: { type: [cartItemSchema], default: [] },
    totalItems: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

cartSchema.index({ sessionId: 1, restaurantId: 1 }, { unique: true });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL – auto-clean stale carts

export const Cart = model<ICart>('Cart', cartSchema);
