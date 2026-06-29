import { Types } from 'mongoose';
import { Expense } from '../models/expense.model';
import { NotFoundError } from '../utils/errors';
import { paginate } from '../utils/pagination';

export class ExpenseService {
  async list(restaurantId: string, query: Record<string, string> = {}) {
    const filter: Record<string, unknown> = { restaurantId };
    if (query.category) filter['category'] = query.category;
    if (query.status) filter['status'] = query.status;
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;
    if (from || to) {
      filter['expenseDate'] = {};
      if (from) (filter['expenseDate'] as Record<string, unknown>)['$gte'] = from;
      if (to) (filter['expenseDate'] as Record<string, unknown>)['$lte'] = to;
    }
    return paginate(Expense, filter, {
      page: parseInt(query.page || '1'),
      limit: parseInt(query.limit || '20'),
      sort: { expenseDate: -1 },
    });
  }

  async get(restaurantId: string, id: string) {
    const expense = await Expense.findOne({ _id: id, restaurantId }).lean();
    if (!expense) throw new NotFoundError('Expense not found');
    return expense;
  }

  async create(restaurantId: string, data: Record<string, unknown>, userId: string) {
    const amount = (data['amount'] as number) ?? 0;
    const taxAmount = (data['taxAmount'] as number) ?? 0;
    return Expense.create({
      ...data,
      restaurantId,
      totalAmount: parseFloat((amount + taxAmount).toFixed(2)),
      createdBy: new Types.ObjectId(userId),
    });
  }

  async update(restaurantId: string, id: string, data: Record<string, unknown>) {
    const expense = await Expense.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!expense) throw new NotFoundError('Expense not found');
    return expense;
  }

  async delete(restaurantId: string, id: string) {
    const expense = await Expense.findOneAndDelete({ _id: id, restaurantId });
    if (!expense) throw new NotFoundError('Expense not found');
    return { deleted: true };
  }

  async getSummary(restaurantId: string, from: Date, to: Date) {
    const byCategory = await Expense.aggregate([
      {
        $match: {
          restaurantId: new Types.ObjectId(restaurantId),
          status: { $in: ['approved', 'paid'] },
          expenseDate: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totals = await Expense.aggregate([
      {
        $match: {
          restaurantId: new Types.ObjectId(restaurantId),
          status: { $in: ['approved', 'paid'] },
          expenseDate: { $gte: from, $lte: to },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]);

    return {
      byCategory,
      total: totals[0]?.total ?? 0,
      count: totals[0]?.count ?? 0,
    };
  }
}

export const expenseService = new ExpenseService();
