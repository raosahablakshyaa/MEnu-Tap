import { Schema, model, Document, Types } from 'mongoose';

export interface IMenuCategory extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const menuCategorySchema = new Schema<IMenuCategory>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true },
    image: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

menuCategorySchema.index({ restaurantId: 1, slug: 1 }, { unique: true });
menuCategorySchema.pre('find', function () { this.where({ isDeleted: false }); });
menuCategorySchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const MenuCategory = model<IMenuCategory>('MenuCategory', menuCategorySchema);
