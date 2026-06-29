import {
  Restaurant, Subscription, PaymentTransaction,
  Order, User, SupportTicket, Coupon, Notification,
} from '../../models';
import { ROLE_SLUGS } from '../../constants';
import { getIO } from '../../socket';

function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date = new Date()): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

export class AdminDashboardService {
  async getStats() {
    const today = startOfDay();
    const monthStart = startOfMonth();
    const yearStart = startOfYear();

    const [
      totalRestaurants,
      activeRestaurants,
      inactiveRestaurants,
      pendingApprovals,
      expiredSubscriptions,
      todayOrders,
      todayRevenueAgg,
      platformCustomers,
      platformStaff,
      monthlyRevenueAgg,
      yearlyRevenueAgg,
      topRestaurants,
      recentRestaurants,
      revenueGrowth,
      subscriptionGrowth,
      ordersGrowth,
      restaurantGrowth,
      customerGrowth,
    ] = await Promise.all([
      Restaurant.countDocuments({ isDeleted: false }),
      Restaurant.countDocuments({ isDeleted: false, isActive: true, status: 'approved' }),
      Restaurant.countDocuments({ isDeleted: false, $or: [{ isActive: false }, { status: 'suspended' }] }),
      Restaurant.countDocuments({ isDeleted: false, status: 'pending' }),
      Subscription.countDocuments({ isDeleted: false, status: 'expired' }),
      Order.countDocuments({ isDeleted: false, createdAt: { $gte: today } }),
      PaymentTransaction.aggregate([
        { $match: { isDeleted: false, status: 'success', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.countDocuments({ isDeleted: false, roleId: { $exists: true } }).then(async () =>
        User.aggregate([
          { $lookup: { from: 'roles', localField: 'roleId', foreignField: '_id', as: 'role' } },
          { $unwind: '$role' },
          { $match: { isDeleted: false, 'role.slug': ROLE_SLUGS.CUSTOMER } },
          { $count: 'total' },
        ]).then((r: { total?: number }[]) => r[0]?.total || 0)
      ),
      User.aggregate([
        { $lookup: { from: 'roles', localField: 'roleId', foreignField: '_id', as: 'role' } },
        { $unwind: '$role' },
        {
          $match: {
            isDeleted: false,
            'role.slug': { $in: [ROLE_SLUGS.RESTAURANT_OWNER, ROLE_SLUGS.RESTAURANT_MANAGER, ROLE_SLUGS.KITCHEN_STAFF, ROLE_SLUGS.WAITER] },
          },
        },
        { $count: 'total' },
      ]).then((r) => r[0]?.total || 0),
      PaymentTransaction.aggregate([
        { $match: { isDeleted: false, status: 'success', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      PaymentTransaction.aggregate([
        { $match: { isDeleted: false, status: 'success', createdAt: { $gte: yearStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.getTopRestaurants(),
      Restaurant.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5)
        .populate('ownerId', 'firstName lastName email').lean(),
      this.getMonthlySeries(PaymentTransaction, 'amount', 12, { status: 'success' }),
      this.getMonthlyCountSeries(Subscription, 12),
      this.getMonthlyCountSeries(Order, 12),
      this.getMonthlyCountSeries(Restaurant, 12),
      this.getCustomerGrowthSeries(12),
    ]);

    const todayRevenue = todayRevenueAgg[0]?.total || 0;
    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;
    const yearlyRevenue = yearlyRevenueAgg[0]?.total || 0;
    const mrr = monthlyRevenue;
    const arr = mrr * 12;

    const avgRevenuePerRestaurant = totalRestaurants > 0 ? todayRevenue / totalRestaurants : 0;
    const avgOrdersPerRestaurant = totalRestaurants > 0 ? todayOrders / totalRestaurants : 0;

    const stats = {
      platformRevenue: yearlyRevenue,
      mrr,
      arr,
      totalRestaurants,
      activeRestaurants,
      inactiveRestaurants,
      pendingApprovals,
      expiredSubscriptions,
      todayOrders,
      todayRevenue,
      platformCustomers,
      platformStaff,
      avgRevenuePerRestaurant: Math.round(avgRevenuePerRestaurant * 100) / 100,
      avgOrdersPerRestaurant: Math.round(avgOrdersPerRestaurant * 100) / 100,
      topRestaurants,
      recentRestaurants,
      charts: {
        revenueGrowth,
        subscriptionGrowth,
        ordersGrowth,
        restaurantGrowth,
        customerGrowth,
      },
    };

    try {
      getIO().to('admin').emit('dashboard:stats', stats);
    } catch { /* socket not ready */ }

    return stats;
  }

  private async getTopRestaurants() {
    return PaymentTransaction.aggregate([
      { $match: { isDeleted: false, status: 'success' } },
      { $group: { _id: '$restaurantId', revenue: { $sum: '$amount' }, transactions: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurant',
        },
      },
      { $unwind: '$restaurant' },
      {
        $project: {
          restaurantId: '$_id',
          name: '$restaurant.name',
          slug: '$restaurant.slug',
          revenue: 1,
          transactions: 1,
        },
      },
    ]);
  }

  private async getMonthlySeries(
    Model: typeof PaymentTransaction,
    sumField: string,
    months: number,
    match: Record<string, unknown> = {}
  ) {
    const from = monthsAgo(months);
    return Model.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: from }, ...match } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          value: { $sum: `$${sumField}` },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          label: { $concat: [{ $toString: '$_id.year' }, '-', { $toString: '$_id.month' }] },
          value: 1,
        },
      },
    ]);
  }

  private async getMonthlyCountSeries(Model: typeof Restaurant | typeof Order | typeof Subscription, months: number) {
    const from = monthsAgo(months);
    return Model.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: from } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          value: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          label: { $concat: [{ $toString: '$_id.year' }, '-', { $toString: '$_id.month' }] },
          value: 1,
        },
      },
    ]);
  }

  private async getCustomerGrowthSeries(months: number) {
    const from = monthsAgo(months);
    return User.aggregate([
      { $lookup: { from: 'roles', localField: 'roleId', foreignField: '_id', as: 'role' } },
      { $unwind: '$role' },
      { $match: { isDeleted: false, 'role.slug': ROLE_SLUGS.CUSTOMER, createdAt: { $gte: from } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          value: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          label: { $concat: [{ $toString: '$_id.year' }, '-', { $toString: '$_id.month' }] },
          value: 1,
        },
      },
    ]);
  }

  async getOverviewCounts() {
    const [openTickets, activeCoupons, pendingNotifications] = await Promise.all([
      SupportTicket.countDocuments({ isDeleted: false, status: { $in: ['open', 'assigned', 'in_progress', 'reopened'] } }),
      Coupon.countDocuments({ isDeleted: false, status: 'active' }),
      Notification.countDocuments({ isDeleted: false, status: 'scheduled' }),
    ]);
    return { openTickets, activeCoupons, pendingNotifications };
  }
}

export const adminDashboardService = new AdminDashboardService();
