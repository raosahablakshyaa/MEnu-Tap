import { Schema, model, Document, Types } from 'mongoose';

export type FoodType = 'veg' | 'non_veg' | 'vegan' | 'jain' | 'egg';
export type SpiceLevel = 'mild' | 'medium' | 'hot' | 'extra_hot';

export interface IVariant {
  name: string;
  price: number;
  discountPrice?: number;
  isAvailable: boolean;
}

export interface IAddon {
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface IAvailability {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  lateNight: boolean;
  weekendOnly: boolean;
  festivalOnly: boolean;
  customTimeSlots?: { start: string; end: string }[];
}

export interface IMenuItem extends Document {
  restaurantId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  video?: string;
  ingredients?: string;
  calories?: number;
  preparationTime?: number;
  cookingInstructions?: string;
  foodType: FoodType;
  spiceLevel?: SpiceLevel;
  price: number;
  discountPrice?: number;
  taxRate?: number;
  sku?: string;
  barcode?: string;
  servingSize?: string;
  variants: IVariant[];
  addons: IAddon[];
  availability: IAvailability;
  isBestSeller: boolean;
  isChefRecommended: boolean;
  isFeatured: boolean;
  isSeasonal: boolean;
  isAvailable: boolean;
  isOutOfStock: boolean;
  popularityScore: number;
  sortOrder: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IVariant>({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, min: 0 },
  isAvailable: { type: Boolean, default: true },
}, { _id: false });

const addonSchema = new Schema<IAddon>({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  isAvailable: { type: Boolean, default: true },
}, { _id: false });

const availabilitySchema = new Schema<IAvailability>({
  breakfast: { type: Boolean, default: true },
  lunch: { type: Boolean, default: true },
  dinner: { type: Boolean, default: true },
  lateNight: { type: Boolean, default: false },
  weekendOnly: { type: Boolean, default: false },
  festivalOnly: { type: Boolean, default: false },
  customTimeSlots: [{ start: String, end: String }],
}, { _id: false });

const menuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'MenuCategory', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 2000 },
    images: [{ type: String, trim: true }],
    video: { type: String, trim: true },
    ingredients: { type: String, trim: true },
    calories: { type: Number, min: 0 },
    preparationTime: { type: Number, min: 0 },
    cookingInstructions: { type: String, trim: true },
    foodType: { type: String, enum: ['veg', 'non_veg', 'vegan', 'jain', 'egg'], default: 'veg', index: true },
    spiceLevel: { type: String, enum: ['mild', 'medium', 'hot', 'extra_hot'] },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    sku: { type: String, trim: true },
    barcode: { type: String, trim: true },
    servingSize: { type: String, trim: true },
    variants: { type: [variantSchema], default: [] },
    addons: { type: [addonSchema], default: [] },
    availability: { type: availabilitySchema, default: () => ({}) },
    isBestSeller: { type: Boolean, default: false, index: true },
    isChefRecommended: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false, index: true },
    isSeasonal: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true, index: true },
    isOutOfStock: { type: Boolean, default: false, index: true },
    popularityScore: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurantId: 1, slug: 1 }, { unique: true });
menuItemSchema.index({ restaurantId: 1, categoryId: 1, isDeleted: 1 });
menuItemSchema.index({ restaurantId: 1, isAvailable: 1, isDeleted: 1 });
menuItemSchema.pre('find', function () { this.where({ isDeleted: false }); });
menuItemSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const MenuItem = model<IMenuItem>('MenuItem', menuItemSchema);
