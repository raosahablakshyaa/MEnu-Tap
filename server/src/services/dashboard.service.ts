import { Order } from '../models/order.model';
import { User } from '../models/user.model';
import { MenuCategory } from '../models/menuCategory.model';
import { MenuItem } from '../models/menuItem.model';
import { Table } from '../models/table.model';
import { QrCode } from '../models/qrCode.model';
import { Subscription } from '../models/subscription.model';

export class DashboardService {
  async getDashboardStats(restaurantId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todayOrders,
      monthOrders,
      allTables,
      menuItems,
      categories,
      staffCount,
      qrCount,
      subscription,
    ] = await Promise.all([
      Order.find({ restaurantId, createdAt: { $gte: todayStart, $lt: todayEnd } }).lean(),
      Order.find({ restaurantId, createdAt: { $gte: monthStart }, status: { $in: ['completed', 'served'] } }).lean(),
      Table.find({ restaurantId }).lean(),
      MenuItem.countDocuments({ restaurantId }),
      MenuCategory.countDocuments({ restaurantId }),
      User.countDocuments({ restaurantId, isDeleted: false }),
      QrCode.countDocuments({ restaurantId }),
      Subscription.findOne({ restaurantId, status: 'active' }).populate('planId', 'name price').lean(),
    ]);

    const completed = todayOrders.filter(o => ['completed', 'served'].includes(o.status));
    const pending = todayOrders.filter(o => o.status === 'pending');
    const cancelled = todayOrders.filter(o => o.status === 'cancelled');

    const todayRevenue = completed.reduce((sum, o) => sum + o.totalAmount, 0);
    const monthRevenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = completed.length > 0 ? todayRevenue / completed.length : 0;

    const occupiedTables = allTables.filter(t => t.status === 'occupied').length;
    const availableTables = allTables.filter(t => t.status === 'available').length;

    // Customer stats: unique sessions today (Phase 5 orders use sessionId; legacy used customerId)
    const sessionIds = todayOrders
      .map(o => (o as unknown as Record<string, unknown>).sessionId ?? (o as unknown as Record<string, unknown>).customerId)
      .filter(Boolean)
      .map(String);
    const uniqueCustomers = new Set(sessionIds).size;

    return {
      today: {
        revenue: todayRevenue,
        orders: todayOrders.length,
        pendingOrders: pending.length,
        completedOrders: completed.length,
        cancelledOrders: cancelled.length,
        customers: uniqueCustomers,
        avgOrderValue,
      },
      monthly: {
        revenue: monthRevenue,
        orders: monthOrders.length,
      },
      tables: {
        total: allTables.length,
        occupied: occupiedTables,
        available: availableTables,
      },
      menu: {
        items: menuItems,
        categories,
      },
      staff: { count: staffCount },
      qrCodes: { generated: qrCount },
      subscription: subscription
        ? {
            plan: (subscription.planId as unknown as Record<string, unknown>)?.name || 'Unknown',
            status: subscription.status,
            expiresAt: subscription.endDate,
          }
        : null,
    };
  }
}

export const dashboardService = new DashboardService();
