import { Schema, model, Document, Types } from 'mongoose';

export type MovementType =
  | 'purchase'      // stock in via purchase order
  | 'consumption'   // auto-deducted when order is completed
  | 'adjustment'    // manual correction
  | 'waste'         // recorded waste/spoilage
  | 'transfer_in'   // received from another branch
  | 'transfer_out'  // sent to another branch
  | 'opening'       // opening stock entry
  | 'return';       // returned to supplier

export interface IStockMovement extends Document {
  restaurantId: Types.ObjectId;
  ingredientId: Types.ObjectId;
  ingredientName: string;
  type: MovementType;
  quantity: number;         // positive = in, negative = out
  unitCost: number;
  totalCost: number;
  balanceAfter: number;
  referenceId?: Types.ObjectId;  // orderId or purchaseOrderId
  referenceModel?: string;
  batchNumber?: string;
  expiryDate?: Date;
  notes?: string;
  performedBy?: Types.ObjectId;
  createdAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    ingredientId: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true, index: true },
    ingredientName: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['purchase', 'consumption', 'adjustment', 'waste', 'transfer_in', 'transfer_out', 'opening', 'return'],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true },
    unitCost: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    referenceId: { type: Schema.Types.ObjectId },
    referenceModel: { type: String, trim: true },
    batchNumber: { type: String, trim: true },
    expiryDate: { type: Date },
    notes: { type: String, trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

stockMovementSchema.index({ restaurantId: 1, ingredientId: 1, createdAt: -1 });
stockMovementSchema.index({ restaurantId: 1, type: 1, createdAt: -1 });
stockMovementSchema.index({ restaurantId: 1, createdAt: -1 });

export const StockMovement = model<IStockMovement>('StockMovement', stockMovementSchema);
