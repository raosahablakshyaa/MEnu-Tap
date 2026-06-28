import { Types } from 'mongoose';
import { PaymentTransaction } from '../../models';
import { getPaginationParams, paginateResult, QueryOptions } from '../../utils/pagination';

function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export class AdminRevenueService {
  async getDashboard() {
    const now = new Date();
    const today = startOfDay();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [todayRev, weeklyRev, monthlyRev, yearlyRev, byPlan, byCity, byState, byRestaurant, graph, transactions, refunds, failed] =
      await Promise.all([
        this.sumRevenue({ createdAt: { $gte: today } }),
        this.sumRevenue({ createdAt: { $gte: weekAgo } }),
        this.sumRevenue({ createdAt: { $gte: monthStart } }),
        this.sumRevenue({ createdAt: { $gte: yearStart } }),
        this.revenueByPlan(),
        this.revenueByLocation('address.city'),
        this.revenueByLocation('address.state'),
        this.revenueByRestaurant(),
        this.revenueGraph(12),
        this.listTransactions({ page: 1, limit: 10 }),
        this.listTransactions({ page: 1, limit: 10, status: 'refunded' }),
        this.listTransactions({ page: 1, limit: 10, status: 'failed' }),
      ]);

    return {
      todayRevenue: todayRev,
      weeklyRevenue: weeklyRev,
      monthlyRevenue: monthlyRev,
      yearlyRevenue: yearlyRev,
      revenueByPlan: byPlan,
      revenueByCity: byCity,
      revenueByState: byState,
      revenueByRestaurant: byRestaurant,
      revenueGraph: graph,
      recentTransactions: transactions.items,
      recentRefunds: refunds.items,
      recentFailed: failed.items,
    };
  }

  private async sumRevenue(match: Record<string, unknown>) {
    const result = await PaymentTransaction.aggregate([
      { $match: { isDeleted: false, status: 'success', ...match } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
  }

  private async revenueByPlan() {
    return PaymentTransaction.aggregate([
      { $match: { isDeleted: false, status: 'success', subscriptionId: { $exists: true } } },
      { $lookup: { from: 'subscriptions', localField: 'subscriptionId', foreignField: '_id', as: 'sub' } },
      { $unwind: '$sub' },
      { $lookup: { from: 'subscriptionplans', localField: 'sub.planId', foreignField: '_id', as: 'plan' } },
      { $unwind: '$plan' },
      { $group: { _id: '$plan.name', revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
    ]);
  }

  private async revenueByLocation(field: string) {
    return PaymentTransaction.aggregate([
      { $match: { isDeleted: false, status: 'success' } },
      { $lookup: { from: 'restaurants', localField: 'restaurantId', foreignField: '_id', as: 'restaurant' } },
      { $unwind: '$restaurant' },
      { $group: { _id: `$restaurant.${field}`, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 20 },
    ]);
  }

  private async revenueByRestaurant() {
    return PaymentTransaction.aggregate([
      { $match: { isDeleted: false, status: 'success' } },
      { $group: { _id: '$restaurantId', revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
      { $unwind: '$restaurant' },
      { $project: { restaurantId: '$_id', name: '$restaurant.name', revenue: 1, count: 1 } },
    ]);
  }

  private async revenueGraph(months: number) {
    const from = new Date();
    from.setMonth(from.getMonth() - months);
    return PaymentTransaction.aggregate([
      { $match: { isDeleted: false, status: 'success', createdAt: { $gte: from } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
  }

  async listTransactions(options: QueryOptions & { status?: string; type?: string; restaurantId?: string }) {
    const { page, limit, skip, sort } = getPaginationParams(options);
    const filter: Record<string, unknown> = { isDeleted: false };
    if (options.status) filter.status = options.status;
    if (options.type) filter.type = options.type;
    if (options.restaurantId) filter.restaurantId = new Types.ObjectId(options.restaurantId);

    const [items, total] = await Promise.all([
      PaymentTransaction.find(filter)
        .populate('restaurantId', 'name slug')
        .skip(skip).limit(limit).sort(sort).lean(),
      PaymentTransaction.countDocuments(filter),
    ]);
    return paginateResult(items, total, page, limit);
  }

  async exportRevenue(from: Date, to: Date) {
    return PaymentTransaction.find({
      isDeleted: false,
      status: 'success',
      createdAt: { $gte: from, $lte: to },
    })
      .populate('restaurantId', 'name slug')
      .sort({ createdAt: -1 })
      .lean();
  }
}

export const adminRevenueService = new AdminRevenueService();
