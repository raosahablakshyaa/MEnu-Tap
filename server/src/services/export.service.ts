import * as XLSX from 'xlsx';
import { Types } from 'mongoose';
import { Order } from '../models/order.model';
import { MenuItem } from '../models/menuItem.model';
import { Customer } from '../models/customer.model';
import { Expense } from '../models/expense.model';
import { PosTransaction } from '../models/posTransaction.model';
import { StockMovement } from '../models/stockMovement.model';

type ExportFormat = 'json' | 'csv' | 'excel';

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h];
        const str = val == null ? '' : String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
      }).join(',')
    ),
  ];
  return lines.join('\n');
}

export interface ExportResult {
  data: string | Buffer;
  contentType: string;
  filename: string;
}

export class ExportService {
  // ── Orders ──────────────────────────────────────────────────────────────────

  async exportOrders(restaurantId: string, format: ExportFormat, from?: Date, to?: Date): Promise<ExportResult> {
    const filter: Record<string, unknown> = { restaurantId: new Types.ObjectId(restaurantId) };
    if (from || to) {
      filter['createdAt'] = {};
      if (from) (filter['createdAt'] as Record<string, unknown>)['$gte'] = from;
      if (to) (filter['createdAt'] as Record<string, unknown>)['$lte'] = to;
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(10000).lean();
    const rows = orders.map(o => ({
      orderNumber: o.orderNumber,
      date: new Date(o.createdAt).toLocaleDateString('en-IN'),
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod ?? '',
      items: o.items.length,
      subtotal: o.subtotal,
      taxAmount: o.taxAmount,
      discountAmount: o.discountAmount,
      totalAmount: o.totalAmount,
      customerName: o.customerName ?? '',
      customerPhone: o.customerPhone ?? '',
      tableNumber: o.tableNumber ?? '',
    }));

    return this.buildExport(rows, format, 'orders');
  }

  // ── Menu ─────────────────────────────────────────────────────────────────────

  async exportMenu(restaurantId: string, format: ExportFormat): Promise<ExportResult> {
    const items = await MenuItem.find({ restaurantId: new Types.ObjectId(restaurantId) })
      .populate('categoryId', 'name')
      .sort({ name: 1 })
      .limit(5000)
      .lean();

    const rows = items.map(i => ({
      name: i.name,
      category: (i.categoryId as unknown as Record<string, unknown>)?.['name'] ?? '',
      price: i.price,
      discountPrice: i.discountPrice ?? '',
      foodType: i.foodType,
      isAvailable: i.isAvailable,
      isOutOfStock: i.isOutOfStock,
      preparationTime: i.preparationTime ?? '',
      calories: i.calories ?? '',
    }));

    return this.buildExport(rows, format, 'menu');
  }

  // ── Customers ────────────────────────────────────────────────────────────────

  async exportCustomers(restaurantId: string, format: ExportFormat): Promise<ExportResult> {
    const customers = await Customer.find({ restaurantId: new Types.ObjectId(restaurantId) })
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    const rows = customers.map(c => ({
      name: c.name,
      phone: c.phone,
      email: c.email ?? '',
      membershipTier: c.membershipTier,
      totalVisits: c.totalVisits,
      totalOrders: c.totalOrders,
      totalAmountSpent: c.totalAmountSpent,
      loyaltyPoints: c.loyaltyPoints,
      segment: c.segment ?? '',
      firstVisitAt: c.firstVisitAt ? new Date(c.firstVisitAt).toLocaleDateString('en-IN') : '',
      lastVisitAt: c.lastVisitAt ? new Date(c.lastVisitAt).toLocaleDateString('en-IN') : '',
    }));

    return this.buildExport(rows, format, 'customers');
  }

  // ── Expenses ─────────────────────────────────────────────────────────────────

  async exportExpenses(restaurantId: string, format: ExportFormat, from?: Date, to?: Date): Promise<ExportResult> {
    const filter: Record<string, unknown> = { restaurantId: new Types.ObjectId(restaurantId) };
    if (from || to) {
      filter['expenseDate'] = {};
      if (from) (filter['expenseDate'] as Record<string, unknown>)['$gte'] = from;
      if (to) (filter['expenseDate'] as Record<string, unknown>)['$lte'] = to;
    }

    const expenses = await Expense.find(filter).sort({ expenseDate: -1 }).limit(5000).lean();
    const rows = expenses.map(e => ({
      title: e.title,
      category: e.category,
      amount: e.amount,
      taxAmount: e.taxAmount,
      totalAmount: e.totalAmount,
      vendorName: e.vendorName ?? '',
      invoiceNumber: e.invoiceNumber ?? '',
      expenseDate: new Date(e.expenseDate).toLocaleDateString('en-IN'),
      status: e.status,
    }));

    return this.buildExport(rows, format, 'expenses');
  }

  // ── POS Transactions ─────────────────────────────────────────────────────────

  async exportPOS(restaurantId: string, format: ExportFormat, from?: Date, to?: Date): Promise<ExportResult> {
    const filter: Record<string, unknown> = { restaurantId: new Types.ObjectId(restaurantId), status: 'paid' };
    if (from || to) {
      filter['createdAt'] = {};
      if (from) (filter['createdAt'] as Record<string, unknown>)['$gte'] = from;
      if (to) (filter['createdAt'] as Record<string, unknown>)['$lte'] = to;
    }

    const txns = await PosTransaction.find(filter).sort({ createdAt: -1 }).limit(10000).lean();
    const rows = txns.map(t => ({
      billNumber: t.billNumber,
      date: new Date(t.createdAt).toLocaleDateString('en-IN'),
      orderType: t.orderType,
      customerName: t.customerName ?? '',
      subtotal: t.subtotal,
      cgst: t.cgst,
      sgst: t.sgst,
      igst: t.igst,
      totalAmount: t.totalAmount,
      paymentMethod: t.paymentMethod,
    }));

    return this.buildExport(rows, format, 'pos_transactions');
  }

  // ── Stock Movements ───────────────────────────────────────────────────────────

  async exportStockMovements(restaurantId: string, format: ExportFormat, from?: Date, to?: Date): Promise<ExportResult> {
    const filter: Record<string, unknown> = { restaurantId: new Types.ObjectId(restaurantId) };
    if (from || to) {
      filter['createdAt'] = {};
      if (from) (filter['createdAt'] as Record<string, unknown>)['$gte'] = from;
      if (to) (filter['createdAt'] as Record<string, unknown>)['$lte'] = to;
    }

    const movements = await StockMovement.find(filter).sort({ createdAt: -1 }).limit(10000).lean();
    const rows = movements.map(m => ({
      ingredientName: m.ingredientName,
      type: m.type,
      quantity: m.quantity,
      unitCost: m.unitCost,
      totalCost: m.totalCost,
      balanceAfter: m.balanceAfter,
      notes: m.notes ?? '',
      date: new Date(m.createdAt).toLocaleDateString('en-IN'),
    }));

    return this.buildExport(rows, format, 'stock_movements');
  }

  // ── Builder ───────────────────────────────────────────────────────────────────

  private buildExport(rows: Record<string, unknown>[], format: ExportFormat, name: string): ExportResult {
    const ts = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      return {
        data: JSON.stringify({ exportedAt: new Date().toISOString(), count: rows.length, data: rows }, null, 2),
        contentType: 'application/json',
        filename: `${name}_${ts}.json`,
      };
    }

    if (format === 'csv') {
      return {
        data: toCSV(rows),
        contentType: 'text/csv',
        filename: `${name}_${ts}.csv`,
      };
    }

    // Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    return {
      data: buf,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `${name}_${ts}.xlsx`,
    };
  }
}

export const exportService = new ExportService();
