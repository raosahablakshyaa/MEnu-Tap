import { Types } from 'mongoose';
import { PurchaseOrder, POStatus } from '../models/purchaseOrder.model';
import { Ingredient } from '../models/ingredient.model';
import { Supplier } from '../models/supplier.model';
import { inventoryService } from './inventory.service';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { paginate } from '../utils/pagination';

function generatePONumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `PO-${ts}-${rand}`;
}

export class PurchaseOrderService {
  async list(restaurantId: string, query: Record<string, string> = {}) {
    const filter: Record<string, unknown> = { restaurantId };
    if (query.status) filter['status'] = query.status;
    if (query.supplierId) filter['supplierId'] = new Types.ObjectId(query.supplierId);
    return paginate(PurchaseOrder, filter, {
      page: parseInt(query.page || '1'),
      limit: parseInt(query.limit || '20'),
      sort: { createdAt: -1 },
    });
  }

  async get(restaurantId: string, id: string) {
    const po = await PurchaseOrder.findOne({ _id: id, restaurantId })
      .populate('supplierId', 'name phone email')
      .lean();
    if (!po) throw new NotFoundError('Purchase order not found');
    return po;
  }

  async create(restaurantId: string, data: Record<string, unknown>, userId: string) {
    const supplier = await Supplier.findOne({ _id: data['supplierId'], restaurantId }).lean();
    if (!supplier) throw new NotFoundError('Supplier not found');

    const items = (data['items'] as Array<Record<string, unknown>>) ?? [];
    let subtotal = 0;
    let taxAmount = 0;
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const ing = await Ingredient.findById(item['ingredientId']).lean();
        const unitPrice = (item['unitPrice'] as number) ?? ing?.unitCost ?? 0;
        const qty = (item['orderedQuantity'] as number) ?? 0;
        const taxPct = (item['taxPercent'] as number) ?? 0;
        const lineTotal = unitPrice * qty * (1 + taxPct / 100);
        subtotal += unitPrice * qty;
        taxAmount += (unitPrice * qty * taxPct) / 100;
        return {
          ingredientId: item['ingredientId'],
          ingredientName: ing?.name ?? '',
          unit: ing?.unit ?? '',
          orderedQuantity: qty,
          receivedQuantity: 0,
          unitPrice,
          taxPercent: taxPct,
          totalAmount: parseFloat(lineTotal.toFixed(2)),
        };
      })
    );

    const totalAmount = subtotal + taxAmount - ((data['discountAmount'] as number) ?? 0);
    return PurchaseOrder.create({
      restaurantId,
      poNumber: generatePONumber(),
      supplierId: supplier._id,
      supplierName: supplier.name,
      status: 'draft',
      items: enrichedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      discountAmount: (data['discountAmount'] as number) ?? 0,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      expectedDelivery: data['expectedDelivery'],
      notes: data['notes'],
      createdBy: new Types.ObjectId(userId),
    });
  }

  async updateStatus(restaurantId: string, id: string, status: POStatus, _userId: string) {
    const po = await PurchaseOrder.findOne({ _id: id, restaurantId });
    if (!po) throw new NotFoundError('Purchase order not found');
    const validTransitions: Record<string, string[]> = {
      draft: ['sent', 'cancelled'],
      sent: ['confirmed', 'cancelled'],
      confirmed: ['partial', 'received', 'cancelled'],
      partial: ['received', 'cancelled'],
    };
    if (!(validTransitions[po.status] ?? []).includes(status)) {
      throw new BadRequestError(`Cannot transition from ${po.status} to ${status}`);
    }
    po.status = status;
    if (status === 'received') po.receivedAt = new Date();
    await po.save();
    return po;
  }

  async receiveItems(
    restaurantId: string,
    id: string,
    receivedItems: Array<{ itemId: string; receivedQuantity: number }>,
    userId: string
  ) {
    const po = await PurchaseOrder.findOne({ _id: id, restaurantId });
    if (!po) throw new NotFoundError('Purchase order not found');
    if (po.status === 'cancelled') throw new BadRequestError('Cannot receive items for a cancelled PO');

    let allReceived = true;
    let anyReceived = false;

    for (const ri of receivedItems) {
      const poItem = po.items.find((i) => (i as unknown as Record<string, unknown>)['_id']?.toString() === ri.itemId);
      if (!poItem) continue;
      poItem.receivedQuantity = (poItem.receivedQuantity ?? 0) + ri.receivedQuantity;
      if (poItem.receivedQuantity < poItem.orderedQuantity) allReceived = false;
      if (ri.receivedQuantity > 0) anyReceived = true;

      if (ri.receivedQuantity > 0) {
        await inventoryService.adjustStock(
          restaurantId,
          poItem.ingredientId.toString(),
          ri.receivedQuantity,
          'purchase',
          `Received via PO ${po.poNumber}`,
          userId,
          poItem.unitPrice
        );
      }
    }

    po.status = allReceived ? 'received' : anyReceived ? 'partial' : po.status;
    if (po.status === 'received') po.receivedAt = new Date();
    po.receivedBy = new Types.ObjectId(userId);
    await po.save();

    // Update supplier stats
    await Supplier.findByIdAndUpdate(po.supplierId, {
      $inc: { totalOrders: allReceived ? 1 : 0, totalValue: po.totalAmount },
    });

    return po;
  }
}

export const purchaseOrderService = new PurchaseOrderService();
