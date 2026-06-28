import { Types } from 'mongoose';
import { Ingredient } from '../models/ingredient.model';
import { StockMovement, MovementType } from '../models/stockMovement.model';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { paginate } from '../utils/pagination';

export class InventoryService {
  async listIngredients(restaurantId: string, query: Record<string, string> = {}) {
    const filter: Record<string, unknown> = { restaurantId, isActive: true };
    if (query.category) filter['category'] = query.category;
    if (query.search) filter['name'] = new RegExp(query.search, 'i');
    if (query.lowStock === 'true') {
      filter['$expr'] = { $lte: ['$currentStock', '$reorderPoint'] };
    }
    return paginate(Ingredient, filter, {
      page: parseInt(query.page || '1'),
      limit: parseInt(query.limit || '20'),
      sort: { name: 1 },
      select: '-__v',
    });
  }

  async getIngredient(restaurantId: string, id: string) {
    const item = await Ingredient.findOne({ _id: id, restaurantId }).lean();
    if (!item) throw new NotFoundError('Ingredient not found');
    return item;
  }

  async createIngredient(restaurantId: string, data: Record<string, unknown>, userId: string) {
    const ingredient = await Ingredient.create({ ...data, restaurantId });
    if ((ingredient.currentStock as number) > 0) {
      await this.recordMovement(restaurantId, ingredient._id.toString(), {
        type: 'opening',
        quantity: ingredient.currentStock,
        unitCost: ingredient.unitCost,
        notes: 'Opening stock entry',
        performedBy: userId,
      });
    }
    return ingredient;
  }

  async updateIngredient(restaurantId: string, id: string, data: Record<string, unknown>) {
    const ingredient = await Ingredient.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!ingredient) throw new NotFoundError('Ingredient not found');
    return ingredient;
  }

  async deleteIngredient(restaurantId: string, id: string) {
    const ingredient = await Ingredient.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!ingredient) throw new NotFoundError('Ingredient not found');
    return { deleted: true };
  }

  async adjustStock(
    restaurantId: string,
    id: string,
    quantity: number,
    type: MovementType,
    notes: string,
    userId: string,
    unitCost?: number
  ) {
    const ingredient = await Ingredient.findOne({ _id: id, restaurantId });
    if (!ingredient) throw new NotFoundError('Ingredient not found');

    const isInbound = ['purchase', 'adjustment', 'transfer_in', 'opening', 'return'].includes(type);
    const delta = isInbound ? Math.abs(quantity) : -Math.abs(quantity);
    const newBalance = ingredient.currentStock + delta;

    if (newBalance < 0) throw new BadRequestError('Insufficient stock for this adjustment');

    ingredient.currentStock = newBalance;
    if (unitCost != null && unitCost > 0) {
      // Weighted average cost
      if (isInbound) {
        const totalOldValue = ingredient.averageCost * (ingredient.currentStock - delta);
        const totalNewValue = unitCost * Math.abs(quantity);
        ingredient.averageCost = newBalance > 0 ? (totalOldValue + totalNewValue) / newBalance : unitCost;
        ingredient.unitCost = unitCost;
      }
    }
    await ingredient.save();

    await this.recordMovement(restaurantId, id, {
      type,
      quantity: delta,
      unitCost: unitCost ?? ingredient.unitCost,
      notes,
      performedBy: userId,
      balanceAfter: newBalance,
    });

    return ingredient;
  }

  async recordMovement(
    restaurantId: string,
    ingredientId: string,
    data: {
      type: MovementType;
      quantity: number;
      unitCost?: number;
      notes?: string;
      performedBy?: string;
      balanceAfter?: number;
      referenceId?: string;
      referenceModel?: string;
      batchNumber?: string;
      expiryDate?: Date;
    }
  ) {
    let balanceAfter = data.balanceAfter;
    if (balanceAfter == null) {
      const ingredient = await Ingredient.findById(ingredientId).lean();
      balanceAfter = ingredient?.currentStock ?? 0;
    }
    const ingredient = await Ingredient.findById(ingredientId).lean();
    const unitCost = data.unitCost ?? ingredient?.unitCost ?? 0;
    return StockMovement.create({
      restaurantId,
      ingredientId,
      ingredientName: ingredient?.name ?? '',
      type: data.type,
      quantity: data.quantity,
      unitCost,
      totalCost: Math.abs(data.quantity) * unitCost,
      balanceAfter,
      referenceId: data.referenceId ? new Types.ObjectId(data.referenceId) : undefined,
      referenceModel: data.referenceModel,
      batchNumber: data.batchNumber,
      expiryDate: data.expiryDate,
      notes: data.notes,
      performedBy: data.performedBy ? new Types.ObjectId(data.performedBy) : undefined,
    });
  }

  async getLowStockAlerts(restaurantId: string) {
    return Ingredient.find({
      restaurantId,
      isActive: true,
      $expr: { $lte: ['$currentStock', '$reorderPoint'] },
    }).lean();
  }

  async getStockMovements(restaurantId: string, ingredientId: string, query: Record<string, string> = {}) {
    const filter: Record<string, unknown> = { restaurantId };
    if (ingredientId !== 'all') filter['ingredientId'] = new Types.ObjectId(ingredientId);
    if (query.type) filter['type'] = query.type;
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;
    if (from || to) {
      filter['createdAt'] = {};
      if (from) (filter['createdAt'] as Record<string, unknown>)['$gte'] = from;
      if (to) (filter['createdAt'] as Record<string, unknown>)['$lte'] = to;
    }
    return paginate(StockMovement, filter, {
      page: parseInt(query.page || '1'),
      limit: parseInt(query.limit || '50'),
      sort: { createdAt: -1 },
    });
  }

  async getInventoryValuation(restaurantId: string) {
    const result = await Ingredient.aggregate([
      { $match: { restaurantId: new Types.ObjectId(restaurantId), isActive: true } },
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$currentStock', '$averageCost'] } },
          lowStockCount: {
            $sum: { $cond: [{ $lte: ['$currentStock', '$reorderPoint'] }, 1, 0] },
          },
        },
      },
      { $sort: { totalValue: -1 } },
    ]);

    const totals = await Ingredient.aggregate([
      { $match: { restaurantId: new Types.ObjectId(restaurantId), isActive: true } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$currentStock', '$averageCost'] } },
          totalItems: { $sum: 1 },
          lowStock: { $sum: { $cond: [{ $lte: ['$currentStock', '$reorderPoint'] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$currentStock', 0] }, 1, 0] } },
        },
      },
    ]);

    return {
      byCategory: result,
      summary: totals[0] ?? { totalValue: 0, totalItems: 0, lowStock: 0, outOfStock: 0 },
    };
  }

  /** Auto-deduct ingredients when an order is completed */
  async consumeForOrder(restaurantId: string, orderId: string, items: Array<{ menuItemId: string; quantity: number }>) {
    const { Recipe } = await import('../models/recipe.model');
    for (const item of items) {
      if (!item.menuItemId) continue;
      const recipe = await Recipe.findOne({ restaurantId, menuItemId: item.menuItemId, isActive: true }).lean();
      if (!recipe) continue;
      for (const ri of recipe.ingredients) {
        const consumeQty = ri.grossQuantity * item.quantity;
        const ingredient = await Ingredient.findOne({ _id: ri.ingredientId, restaurantId });
        if (!ingredient) continue;
        const newBalance = Math.max(0, ingredient.currentStock - consumeQty);
        ingredient.currentStock = newBalance;
        await ingredient.save();
        await this.recordMovement(restaurantId, ingredient._id.toString(), {
          type: 'consumption',
          quantity: -consumeQty,
          notes: `Auto-consumed for order`,
          referenceId: orderId,
          referenceModel: 'Order',
          balanceAfter: newBalance,
        });
      }
    }
  }
}

export const inventoryService = new InventoryService();
