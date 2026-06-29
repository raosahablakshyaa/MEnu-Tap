import { Schema, model, Document, Types } from 'mongoose';

export interface IRecipeIngredient {
  ingredientId: Types.ObjectId;
  ingredientName: string;
  quantity: number;
  unit: string;
  wastagePercent: number;
  grossQuantity: number; // quantity + wastage
}

export interface IRecipe extends Document {
  restaurantId: Types.ObjectId;
  menuItemId: Types.ObjectId;
  menuItemName: string;
  ingredients: IRecipeIngredient[];
  servingSize: number;
  preparationCost: number; // auto-calculated
  isActive: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const recipeIngredientSchema = new Schema<IRecipeIngredient>(
  {
    ingredientId: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    ingredientName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    wastagePercent: { type: Number, default: 0, min: 0, max: 100 },
    grossQuantity: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const recipeSchema = new Schema<IRecipe>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    menuItemName: { type: String, required: true, trim: true },
    ingredients: { type: [recipeIngredientSchema], default: [] },
    servingSize: { type: Number, default: 1, min: 1 },
    preparationCost: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

recipeSchema.index({ restaurantId: 1, menuItemId: 1 }, { unique: true });

export const Recipe = model<IRecipe>('Recipe', recipeSchema);
