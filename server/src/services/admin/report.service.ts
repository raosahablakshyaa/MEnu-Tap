import { Restaurant, PaymentTransaction, Subscription, User, SupportTicket } from '../../models';
import { adminRevenueService } from './revenue.service';
import { adminUserService } from './user.service';
import { ROLE_SLUGS } from '../../constants';

export class AdminReportService {
  async restaurantReport() {
    const [total, byStatus, byCity, byState, recent] = await Promise.all([
      Restaurant.countDocuments({ isDeleted: false }),
      Restaurant.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Restaurant.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$address.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      Restaurant.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$address.state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Restaurant.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);
    return { total, byStatus, byCity, byState, recent, generatedAt: new Date() };
  }

  async revenueReport(from: Date, to: Date) {
    const data = await adminRevenueService.exportRevenue(from, to);
    const total = data.reduce((sum, t) => sum + t.amount, 0);
    return { transactions: data, total, count: data.length, from, to, generatedAt: new Date() };
  }

  async subscriptionReport() {
    const [byStatus, byPlan, expiringSoon] = await Promise.all([
      Subscription.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Subscription.aggregate([
        { $match: { isDeleted: false } },
        { $lookup: { from: 'subscriptionplans', localField: 'planId', foreignField: '_id', as: 'plan' } },
        { $unwind: '$plan' },
        { $group: { _id: '$plan.name', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
      ]),
      Subscription.find({
        isDeleted: false,
        status: 'active',
        endDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      }).populate('restaurantId', 'name').populate('planId', 'name').lean(),
    ]);
    return { byStatus, byPlan, expiringSoon, generatedAt: new Date() };
  }

  async customerReport() {
    const roleStats = await adminUserService.getRoleStats();
    const customers = roleStats.find((r) => r.slug === ROLE_SLUGS.CUSTOMER);
    const growth = await User.aggregate([
      { $lookup: { from: 'roles', localField: 'roleId', foreignField: '_id', as: 'role' } },
      { $unwind: '$role' },
      { $match: { isDeleted: false, 'role.slug': ROLE_SLUGS.CUSTOMER } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    return { totalCustomers: customers?.count || 0, roleStats, growth, generatedAt: new Date() };
  }

  async paymentReport(from: Date, to: Date) {
    const transactions = await PaymentTransaction.find({
      isDeleted: false,
      createdAt: { $gte: from, $lte: to },
    }).populate('restaurantId', 'name').sort({ createdAt: -1 }).lean();

    const summary = {
      total: transactions.reduce((s, t) => s + (t.status === 'success' ? t.amount : 0), 0),
      success: transactions.filter((t) => t.status === 'success').length,
      failed: transactions.filter((t) => t.status === 'failed').length,
      refunded: transactions.filter((t) => t.status === 'refunded').length,
    };
    return { transactions, summary, from, to, generatedAt: new Date() };
  }

  async supportReport() {
    const [byStatus, byPriority, avgResolution] = await Promise.all([
      SupportTicket.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      SupportTicket.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      SupportTicket.countDocuments({ isDeleted: false, status: { $in: ['resolved', 'closed'] } }),
    ]);
    return { byStatus, byPriority, resolvedCount: avgResolution, generatedAt: new Date() };
  }

  formatAsCsv(data: Record<string, unknown>[], columns: string[]): string {
    const header = columns.join(',');
    const rows = data.map((row) =>
      columns.map((col) => {
        const val = row[col];
        const str = val === null || val === undefined ? '' : String(val);
        return str.includes(',') ? `"${str}"` : str;
      }).join(',')
    );
    return [header, ...rows].join('\n');
  }
}

export const adminReportService = new AdminReportService();
