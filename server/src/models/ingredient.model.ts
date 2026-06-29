import { Schema, model, Document, Types } from 'mongoose';

export type IngredientUnit = 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'dozen' | 'pack' | 'box' | 'bottle' | 'can';
export type IngredientCategory = 'produce' | 'dairy' | 'meat' | 'seafood' | 'bakery' | 'beverage' | 'spice' | 'oil' | 'grain' | 'other';

export interface IIngredient extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  sku?: string;
  category: IngredientCategory;
  unit: IngredientUnit;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  averageCost: number;
  supplierId?: Types.ObjectId;
  storageLocation?: string;
  expiryTracking: boolean;
  shelfLifeDays?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ingredientSchema = new Schema<IIngredient>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    sku: { type: String, trim: true, uppercase: true },
    category: {
      type: String,
      enum: ['produce', 'dairy', 'meat', 'seafood', 'bakery', 'beverage', 'spice', 'oil', 'grain', 'other'],
      default: 'other',
    },
    unit: {
      type: String,
      enum: ['kg', 'g', 'l', 'ml', 'pcs', 'dozen', 'pack', 'box', 'bottle', 'can'],
      required: true,
    },
    currentStock: { type: Number, default: 0, min: 0 },
    minimumStock: { type: Number, default: 0, min: 0 },
    maximumStock: { type: Number, default: 1000, min: 0 },
    reorderPoint: { type: Number, default: 0, min: 0 },
    reorderQuantity: { type: Number, default: 0, min: 0 },
    unitCost: { type: Number, default: 0, min: 0 },
    averageCost: { type: Number, default: 0, min: 0 },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', index: true },
    storageLocation: { type: String, trim: true },
    expiryTracking: { type: Boolean, default: false },
    shelfLifeDays: { type: Number, min: 1 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ingredientSchema.index({ restaurantId: 1, name: 1 }, { unique: true });
ingredientSchema.index({ restaurantId: 1, category: 1 });
ingredientSchema.index({ restaurantId: 1, currentStock: 1 });

export const Ingredient = model<IIngredient>('Ingredient', ingredientSchema);
