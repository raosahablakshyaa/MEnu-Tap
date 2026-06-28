import { Schema, model, Document, Types } from 'mongoose';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface IAIInsight {
  category: 'revenue' | 'inventory' | 'menu' | 'staff' | 'customers' | 'operations';
  insight: string;
  trend: 'up' | 'down' | 'stable';
  changePercent?: number;
  priority: 'high' | 'medium' | 'low';
}

export interface IAIRecommendation {
  action: string;
  reason: string;
  expectedImpact: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

export interface IAIReport extends Document {
  restaurantId: Types.ObjectId;
  period: ReportPeriod;
  reportDate: Date;
  insights: IAIInsight[];
  recommendations: IAIRecommendation[];
  scores: {
    overall: number;
    revenue: number;
    operations: number;
    customers: number;
    inventory: number;
    kitchen: number;
  };
  metrics: {
    revenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
    orders: number;
    avgOrderValue: number;
    newCustomers: number;
    repeatCustomers: number;
    topItems: Array<{ name: string; quantity: number; revenue: number }>;
    leastItems: Array<{ name: string; quantity: number; revenue: number }>;
    peakHour: string;
    avgPrepTime: number;
    wasteAmount: number;
    inventoryValue: number;
  };
  generatedAt: Date;
  createdAt: Date;
}

const aiReportSchema = new Schema<IAIReport>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    period: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
    reportDate: { type: Date, required: true, index: true },
    insights: [
      {
        category: { type: String, enum: ['revenue', 'inventory', 'menu', 'staff', 'customers', 'operations'] },
        insight: { type: String, required: true },
        trend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
        changePercent: { type: Number },
        priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
      },
    ],
    recommendations: [
      {
        action: { type: String, required: true },
        reason: { type: String, required: true },
        expectedImpact: { type: String },
        category: { type: String },
        priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
      },
    ],
    scores: {
      overall: { type: Number, default: 0, min: 0, max: 100 },
      revenue: { type: Number, default: 0, min: 0, max: 100 },
      operations: { type: Number, default: 0, min: 0, max: 100 },
      customers: { type: Number, default: 0, min: 0, max: 100 },
      inventory: { type: Number, default: 0, min: 0, max: 100 },
      kitchen: { type: Number, default: 0, min: 0, max: 100 },
    },
    metrics: {
      revenue: { type: Number, default: 0 },
      expenses: { type: Number, default: 0 },
      profit: { type: Number, default: 0 },
      profitMargin: { type: Number, default: 0 },
      orders: { type: Number, default: 0 },
      avgOrderValue: { type: Number, default: 0 },
      newCustomers: { type: Number, default: 0 },
      repeatCustomers: { type: Number, default: 0 },
      topItems: [{ name: String, quantity: Number, revenue: Number }],
      leastItems: [{ name: String, quantity: Number, revenue: Number }],
      peakHour: { type: String, default: '' },
      avgPrepTime: { type: Number, default: 0 },
      wasteAmount: { type: Number, default: 0 },
      inventoryValue: { type: Number, default: 0 },
    },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

aiReportSchema.index({ restaurantId: 1, period: 1, reportDate: -1 });
aiReportSchema.index({ restaurantId: 1, reportDate: -1 });

export const AIReport = model<IAIReport>('AIReport', aiReportSchema);
