import { Schema, model, Document, Types } from 'mongoose';
import { ROLE_SLUGS } from '../constants';

export interface IRole extends Document {
  name: string;
  slug: string;
  description?: string;
  permissions: Types.ObjectId[];
  restaurantId?: Types.ObjectId;
  isSystem: boolean;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Role slug is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
      index: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

roleSchema.index({ slug: 1, restaurantId: 1 }, { unique: true });
roleSchema.index({ restaurantId: 1, isDeleted: 1, isActive: 1 });

roleSchema.pre('find', function () {
  this.where({ isDeleted: false });
});

roleSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

roleSchema.methods.softDelete = async function (deletedBy?: Types.ObjectId) {
  if (this.isSystem && Object.values(ROLE_SLUGS).includes(this.slug)) {
    throw new Error('System roles cannot be deleted');
  }
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isActive = false;
  if (deletedBy) this.updatedBy = deletedBy;
  return this.save();
};

export const Role = model<IRole>('Role', roleSchema);
