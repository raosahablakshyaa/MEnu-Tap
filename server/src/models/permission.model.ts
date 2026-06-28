import { Schema, model, Document, Types } from 'mongoose';

export interface IPermission extends Document {
  slug: string;
  name: string;
  module: string;
  action: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>(
  {
    slug: {
      type: String,
      required: [true, 'Permission slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    module: {
      type: String,
      required: [true, 'Module is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isSystem: {
      type: Boolean,
      default: true,
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

permissionSchema.index({ module: 1, action: 1 }, { unique: true });
permissionSchema.index({ isDeleted: 1, isActive: 1 });

permissionSchema.pre('find', function () {
  this.where({ isDeleted: false });
});

permissionSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

permissionSchema.methods.softDelete = async function (deletedBy?: Types.ObjectId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isActive = false;
  if (deletedBy) this.updatedBy = deletedBy;
  return this.save();
};

export const Permission = model<IPermission>('Permission', permissionSchema);
