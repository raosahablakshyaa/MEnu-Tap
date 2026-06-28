import { Types } from 'mongoose';
import { PosTransaction } from '../models/posTransaction.model';
import { GstInvoice } from '../models/gstInvoice.model';
import { Restaurant } from '../models/restaurant.model';
import { NotFoundError } from '../utils/errors';
import { paginate } from '../utils/pagination';

function generateBillNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `BILL-${ts}`;
}

function generateInvoiceNumber(restaurantCode: string): string {
  const year = new Date().getFullYear().toString().slice(2);
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const seq = Date.now().toString().slice(-6);
  return `${restaurantCode}/${year}-${month}/${seq}`;
}

function numberToWords(amount: number): string {
  // Simplified — production would use a proper library
  const n = Math.round(amount);
  return `INR ${n} Only`;
}

export class PosService {
  async createBill(restaurantId: string, data: Record<string, unknown>, cashierId: string) {
    const items = (data['items'] as Array<Record<string, unknown>>) ?? [];
    let subtotal = 0;
    const enriched = items.map((item) => {
      const qty = (item['quantity'] as number) ?? 1;
      const price = (item['unitPrice'] as number) ?? 0;
      const discount = (item['discount'] as number) ?? 0;
      const lineTotal = qty * price - discount;
      subtotal += lineTotal;
      return { ...item, subtotal: parseFloat(lineTotal.toFixed(2)) };
    });

    const discountAmount = (data['discountAmount'] as number) ?? 0;
    const taxableAmount = subtotal - discountAmount;
    const gstRate = (data['gstRate'] as number) ?? 5;
    const isIntraState = (data['isIntraState'] as boolean) ?? true;

    const cgst = isIntraState ? parseFloat(((taxableAmount * gstRate) / 200).toFixed(2)) : 0;
    const sgst = isIntraState ? parseFloat(((taxableAmount * gstRate) / 200).toFixed(2)) : 0;
    const igst = !isIntraState ? parseFloat(((taxableAmount * gstRate) / 100).toFixed(2)) : 0;
    const serviceCharge = (data['serviceCharge'] as number) ?? 0;
    const packingCharge = (data['packingCharge'] as number) ?? 0;
    const totalAmount = parseFloat((taxableAmount + cgst + sgst + igst + serviceCharge + packingCharge).toFixed(2));

    const tx = await PosTransaction.create({
      restaurantId,
      branchId: data['branchId'] ? new Types.ObjectId(data['branchId'] as string) : undefined,
      billNumber: generateBillNumber(),
      orderType: data['orderType'] ?? 'dine_in',
      tableNumber: data['tableNumber'],
      customerName: data['customerName'],
      customerPhone: data['customerPhone'],
      items: enriched,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount,
      cgst,
      sgst,
      igst,
      serviceCharge,
      packingCharge,
      totalAmount,
      paymentMethod: data['paymentMethod'] ?? 'cash',
      splitPayments: data['splitPayments'] ?? [],
      cashReceived: data['cashReceived'],
      changeGiven: data['changeGiven'],
      status: 'paid',
      cashierId: new Types.ObjectId(cashierId),
    });

    return tx;
  }

  async list(restaurantId: string, query: Record<string, string> = {}) {
    const filter: Record<string, unknown> = { restaurantId };
    if (query.status) filter['status'] = query.status;
    if (query.orderType) filter['orderType'] = query.orderType;
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;
    if (from || to) {
      filter['createdAt'] = {};
      if (from) (filter['createdAt'] as Record<string, unknown>)['$gte'] = from;
      if (to) (filter['createdAt'] as Record<string, unknown>)['$lte'] = to;
    }
    return paginate(PosTransaction, filter, {
      page: parseInt(query.page || '1'),
      limit: parseInt(query.limit || '20'),
      sort: { createdAt: -1 },
    });
  }

  async get(restaurantId: string, id: string) {
    const tx = await PosTransaction.findOne({ _id: id, restaurantId }).lean();
    if (!tx) throw new NotFoundError('Transaction not found');
    return tx;
  }

  async voidBill(restaurantId: string, id: string) {
    const tx = await PosTransaction.findOneAndUpdate(
      { _id: id, restaurantId, status: { $ne: 'voided' } },
      { $set: { status: 'voided' } },
      { new: true }
    );
    if (!tx) throw new NotFoundError('Transaction not found');
    return tx;
  }

  async generateGstInvoice(restaurantId: string, posTransactionId: string) {
    const tx = await PosTransaction.findOne({ _id: posTransactionId, restaurantId }).lean();
    if (!tx) throw new NotFoundError('Transaction not found');

    const restaurant = await Restaurant.findById(restaurantId).lean();
    const invoiceNumber = generateInvoiceNumber(
      (restaurant?.name ?? 'REST').slice(0, 4).toUpperCase()
    );

    const invoiceItems = tx.items.map((item) => {
      const gstRate = 5;
      const taxableAmount = item.subtotal / (1 + gstRate / 100);
      const totalGst = item.subtotal - taxableAmount;
      return {
        description: item.name,
        hsnCode: '9963',
        quantity: item.quantity,
        unit: 'nos',
        unitPrice: item.unitPrice,
        taxableAmount: parseFloat(taxableAmount.toFixed(2)),
        gstRate,
        cgstAmount: parseFloat((totalGst / 2).toFixed(2)),
        sgstAmount: parseFloat((totalGst / 2).toFixed(2)),
        igstAmount: 0,
        totalAmount: item.subtotal,
      };
    });

    const invoice = await GstInvoice.create({
      restaurantId,
      invoiceNumber,
      invoiceType: 'B2C',
      invoiceDate: new Date(),
      status: 'issued',
      sellerName: restaurant?.name ?? '',
      sellerGST: (restaurant as Record<string, unknown>)?.['gstNumber'] as string ?? '',
      sellerAddress: `${(restaurant as Record<string, unknown>)?.['city'] ?? ''}, ${(restaurant as Record<string, unknown>)?.['state'] ?? ''}`,
      buyerName: tx.customerName,
      items: invoiceItems,
      subtotal: tx.subtotal,
      totalCgst: tx.cgst,
      totalSgst: tx.sgst,
      totalIgst: tx.igst,
      totalTax: tx.cgst + tx.sgst + tx.igst,
      roundOff: 0,
      grandTotal: tx.totalAmount,
      amountInWords: numberToWords(tx.totalAmount),
      posTransactionId: tx._id,
    });

    await PosTransaction.findByIdAndUpdate(posTransactionId, { gstInvoiceNumber: invoiceNumber });

    return invoice;
  }

  async getDailySummary(restaurantId: string, date: string) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d.getTime() + 86400000);

    return PosTransaction.aggregate([
      {
        $match: {
          restaurantId: new Types.ObjectId(restaurantId),
          createdAt: { $gte: d, $lt: next },
          status: 'paid',
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
          cgst: { $sum: '$cgst' },
          sgst: { $sum: '$sgst' },
          igst: { $sum: '$igst' },
        },
      },
    ]);
  }
}

export const posService = new PosService();
