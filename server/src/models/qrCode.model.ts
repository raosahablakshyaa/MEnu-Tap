import { Schema, model, Document, Types } from 'mongoose';

export interface IQrCode extends Document {
  restaurantId: Types.ObjectId;
  tableId: Types.ObjectId;
  tableNumber: string;
  token: string;
  url: string;
  svgData?: string;
  pngUrl?: string;

  // Scan analytics
  scansCount: number;
  lastScannedAt?: Date;
  lastDevice?: string;     // mobile | tablet | desktop
  lastBrowser?: string;

  // Lifecycle
  isActive: boolean;
  expiresAt?: Date;        // optional hard expiry
  isDeleted: boolean;
  deletedAt?: Date;

  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const qrCodeSchema = new Schema<IQrCode>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    tableId: { type: Schema.Types.ObjectId, ref: 'Table', required: true, index: true },
    tableNumber: { type: String, required: true, trim: true },
    token: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true, trim: true },
    svgData: { type: String },
    pngUrl: { type: String, trim: true },

    scansCount: { type: Number, default: 0 },
    lastScannedAt: { type: Date },
    lastDevice: { type: String, trim: true },
    lastBrowser: { type: String, trim: true },

    isActive: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

qrCodeSchema.index({ restaurantId: 1, tableId: 1 });
qrCodeSchema.index({ restaurantId: 1, isActive: 1 });
qrCodeSchema.pre('find', function () { this.where({ isDeleted: false }); });
qrCodeSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const QrCode = model<IQrCode>('QrCode', qrCodeSchema);
