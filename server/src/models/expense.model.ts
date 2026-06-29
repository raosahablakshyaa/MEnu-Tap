import { Schema, model, Document, Types } from 'mongoose';

export type ExpenseCategory =
  | 'rent'
  | 'salaries'
  | 'utilities'
  | 'inventory'
  | 'marketing'
  | 'maintenance'
  | 'equipment'
  | 'packaging'
  | 'delivery'
  | 'taxes'
  | 'insurance'
  | 'software'
  | 'other';

export type ExpenseStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export interface IExpense extends Document {
  restaurantId: Types.ObjectId;
  category: ExpenseCategory;
  title: string;
  description?: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  vendorName?: string;
  vendorGST?: string;
  invoiceNumber?: string;
  expenseDate: Date;
  paymentMethod?: string;
  status: ExpenseStatus;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  attachmentUrl?: string;
  approvedBy?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    category: {
      type: String,
      enum: ['rent', 'salaries', 'utilities', 'inventory', 'marketing', 'maintenance', 'equipment', 'packaging', 'delivery', 'taxes', 'insurance', 'software', 'other'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    vendorName: { type: String, trim: true },
    vendorGST: { type: String, trim: true, uppercase: true },
    invoiceNumber: { type: String, trim: true },
    expenseDate: { type: Date, required: true, index: true },
    paymentMethod: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'paid', 'rejected'], default: 'pending', index: true },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    attachmentUrl: { type: String, trim: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

expenseSchema.index({ restaurantId: 1, expenseDate: -1 });
expenseSchema.index({ restaurantId: 1, category: 1, expenseDate: -1 });

export const Expense = model<IExpense>('Expense', expenseSchema);
