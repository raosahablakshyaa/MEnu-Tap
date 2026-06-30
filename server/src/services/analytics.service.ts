import { Order } from '../models/order.model';
import { Types } from 'mongoose';

export class AnalyticsService {
  async getRevenueSummary(restaurantId: string, period: 'today' | 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 86400000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const orders = await Order.find({
      restaurantId,
      createdAt: { $gte: startDate },
      status: { $in: ['completed', 'served'] },
    }).lean();

    const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const avgOrderValue = orders.length ? revenue / orders.length : 0;

    return {
      period,
      startDate,
      totalRevenue: revenue,
      totalOrders: orders.length,
      avgOrderValue,
    };
  }

  async getDailyRevenue(restaurantId: string, days = 30) {
    const startDate = new Date(Date.now() - days * 86400000);
    const restaurantObjectId = new Types.ObjectId(restaurantId);
    const data = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurantObjectId,
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'served'] },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return data;
  }

  async getPeakHours(restaurantId: string) {
    const startDate = new Date(Date.now() - 30 * 86400000);
    const restaurantObjectId = new Types.ObjectId(restaurantId);
    const data = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurantObjectId,
          createdAt: { $gte: startDate },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return data;
  }

  async getOrderStatusDistribution(restaurantId: string) {
    const restaurantObjectId = new Types.ObjectId(restaurantId);
    const data = await Order.aggregate([
      { $match: { restaurantId: restaurantObjectId, isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return data;
  }

  async getTopSellingItems(restaurantId: string, limit = 10) {
    const restaurantObjectId = new Types.ObjectId(restaurantId);
    const data = await Order.aggregate([
      { $match: { restaurantId: restaurantObjectId, status: { $in: ['completed', 'served'] }, isDeleted: false } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.total' } } },
      { $sort: { totalQty: -1 } },
      { $limit: limit },
    ]);
    return data;
  }

  async getMonthlyRevenue(restaurantId: string, months = 12) {
    const startDate = new Date(Date.now() - months * 30 * 86400000);
    const restaurantObjectId = new Types.ObjectId(restaurantId);
    const data = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurantObjectId,
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'served'] },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return data;
  }

  async getFullAnalytics(restaurantId: string) {
    const [revenue, daily, peakHours, statusDist, topItems, monthly] = await Promise.all([
      this.getRevenueSummary(restaurantId, 'month'),
      this.getDailyRevenue(restaurantId, 30),
      this.getPeakHours(restaurantId),
      this.getOrderStatusDistribution(restaurantId),
      this.getTopSellingItems(restaurantId, 10),
      this.getMonthlyRevenue(restaurantId, 12),
    ]);
    return { revenue, daily, peakHours, statusDist, topItems, monthly };
  }
}

export const analyticsService = new AnalyticsService();
