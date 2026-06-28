import { Schema, model, Document, Types } from 'mongoose';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'disabled';

export interface ITable extends Document {
  restaurantId: Types.ObjectId;
  tableNumber: string;
  displayName: string;
  floor: number;
  floorName?: string;
  capacity: number;
  status: TableStatus;
  isActive: boolean;
  currentOrderId?: Types.ObjectId;
  mergedWith?: Types.ObjectId[];
  qrCodeId?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const tableSchema = new Schema<ITable>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    tableNumber: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    floor: { type: Number, required: true, default: 0, min: 0 },
    floorName: { type: String, trim: true },
    capacity: { type: Number, default: 4, min: 1 },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'cleaning', 'disabled'],
      default: 'available',
      index: true,
    },
    isActive: { type: Boolean, default: true },
    currentOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    mergedWith: [{ type: Schema.Types.ObjectId, ref: 'Table' }],
    qrCodeId: { type: Schema.Types.ObjectId, ref: 'QrCode' },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });
tableSchema.index({ restaurantId: 1, status: 1, isDeleted: 1 });
tableSchema.pre('find', function () { this.where({ isDeleted: false }); });
tableSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const Table = model<ITable>('Table', tableSchema);
