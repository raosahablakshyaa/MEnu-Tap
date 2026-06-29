import { Types } from 'mongoose';
import { Order } from '../models/order.model';
import { Expense } from '../models/expense.model';
import { Ingredient } from '../models/ingredient.model';
import { Customer } from '../models/customer.model';
import { AIReport, IAIInsight, IAIRecommendation } from '../models/aiReport.model';
import { logger } from '../utils/logger';

export class AIService {
  async generateDailyReport(restaurantId: string): Promise<typeof AIReport.prototype> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const last7 = new Date(today.getTime() - 7 * 86400000);
    const last30 = new Date(today.getTime() - 30 * 86400000);

    const rid = new Types.ObjectId(restaurantId);

    const [todayOrders, yesterdayOrders, last7Orders, expensesMonth, ingredients, newCustomers, repeatCustomers] =
      await Promise.all([
        Order.find({ restaurantId: rid, createdAt: { $gte: today }, status: { $in: ['completed', 'served'] } }).lean(),
        Order.find({ restaurantId: rid, createdAt: { $gte: yesterday, $lt: today }, status: { $in: ['completed', 'served'] } }).lean(),
        Order.find({ restaurantId: rid, createdAt: { $gte: last7 }, status: { $in: ['completed', 'served'] } }).lean(),
        Expense.find({ restaurantId: rid, status: { $in: ['approved', 'paid'] }, expenseDate: { $gte: last30 } }).lean(),
        Ingredient.find({ restaurantId: rid, isActive: true, $expr: { $lte: ['$currentStock', '$reorderPoint'] } }).lean(),
        Customer.countDocuments({ restaurantId: rid, firstVisitAt: { $gte: today } }),
        Customer.countDocuments({ restaurantId: rid, totalVisits: { $gt: 1 }, lastVisitAt: { $gte: last7 } }),
      ]);

    const todayRevenue = todayOrders.reduce((s, o) => s + o.totalAmount, 0);
    const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + o.totalAmount, 0);
    const totalExpenses = expensesMonth.reduce((s, e) => s + e.totalAmount, 0);
    const profit = todayRevenue - totalExpenses / 30;

    // Item frequency analysis
    const itemStats: Record<string, { quantity: number; revenue: number }> = {};
    for (const order of last7Orders) {
      for (const item of order.items) {
        const key = item.name;
        if (!itemStats[key]) itemStats[key] = { quantity: 0, revenue: 0 };
        itemStats[key].quantity += item.quantity;
        itemStats[key].revenue += item.subtotal;
      }
    }
    const sortedItems = Object.entries(itemStats)
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.revenue - a.revenue);
    const topItems = sortedItems.slice(0, 5);
    const leastItems = sortedItems.slice(-5).reverse();

    // Peak hour analysis
    const hourCounts: Record<number, number> = {};
    for (const o of last7Orders) {
      const h = new Date(o.createdAt).getHours();
      hourCounts[h] = (hourCounts[h] ?? 0) + 1;
    }
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '0';
    const peakHourFormatted = `${peakHour}:00 - ${String(parseInt(peakHour) + 1).padStart(2, '0')}:00`;

    // Revenue trend
    const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

    // Build insights
    const insights: IAIInsight[] = [];

    if (Math.abs(revenueChange) > 5) {
      insights.push({
        category: 'revenue',
        insight: `Revenue ${revenueChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(revenueChange).toFixed(1)}% compared to yesterday`,
        trend: revenueChange > 0 ? 'up' : 'down',
        changePercent: parseFloat(revenueChange.toFixed(1)),
        priority: Math.abs(revenueChange) > 20 ? 'high' : 'medium',
      });
    }

    if (topItems[0]) {
      insights.push({
        category: 'menu',
        insight: `${topItems[0].name} is the best-selling item with ₹${topItems[0].revenue.toFixed(0)} revenue this week`,
        trend: 'up',
        priority: 'low',
      });
    }

    if (ingredients.length > 0) {
      insights.push({
        category: 'inventory',
        insight: `${ingredients.length} ingredient(s) are at or below reorder point: ${ingredients.slice(0, 3).map(i => i.name).join(', ')}`,
        trend: 'down',
        priority: ingredients.length > 5 ? 'high' : 'medium',
      });
    }

    if (newCustomers > 0) {
      insights.push({
        category: 'customers',
        insight: `${newCustomers} new customer(s) visited today. ${repeatCustomers} repeat customers this week`,
        trend: 'up',
        priority: 'low',
      });
    }

    insights.push({
      category: 'operations',
      insight: `Peak hour is ${peakHourFormatted} — ensure adequate staffing during this period`,
      trend: 'stable',
      priority: 'medium',
    });

    // Build recommendations
    const recommendations: IAIRecommendation[] = [];

    if (ingredients.length > 0) {
      recommendations.push({
        action: `Create purchase orders for low-stock items: ${ingredients.slice(0, 3).map(i => i.name).join(', ')}`,
        reason: 'Stock levels are at or below reorder point which may cause stockouts',
        expectedImpact: 'Prevent service disruption and customer dissatisfaction',
        category: 'inventory',
        priority: 'high',
      });
    }

    if (leastItems[0]) {
      recommendations.push({
        action: `Consider a promotion or discount on ${leastItems[0].name}`,
        reason: 'This item has the lowest sales this week',
        expectedImpact: 'Increase item velocity and reduce potential waste',
        category: 'menu',
        priority: 'medium',
      });
    }

    if (topItems[0]) {
      recommendations.push({
        action: `Feature ${topItems[0].name} prominently on the menu and in promotions`,
        reason: 'It is your top-selling item by revenue',
        expectedImpact: 'Drive further sales and customer satisfaction',
        category: 'menu',
        priority: 'medium',
      });
    }

    if (parseInt(peakHour) >= 18) {
      recommendations.push({
        action: 'Run a Happy Hour promotion between 3 PM and 6 PM',
        reason: 'Evening is peak time — attract early diners with discounts',
        expectedImpact: 'Distribute customer load and increase off-peak revenue by 15-20%',
        category: 'revenue',
        priority: 'medium',
      });
    }

    if (revenueChange < -10) {
      recommendations.push({
        action: 'Review pricing strategy and run a targeted customer campaign',
        reason: `Revenue dropped ${Math.abs(revenueChange).toFixed(1)}% vs yesterday`,
        expectedImpact: 'Recover revenue to baseline within 3-5 days',
        category: 'revenue',
        priority: 'high',
      });
    }

    // Compute scores (0-100)
    const revenueScore = Math.min(100, Math.max(0, 50 + revenueChange));
    const inventoryScore = Math.max(0, 100 - ingredients.length * 10);
    const customersScore = Math.min(100, 60 + newCustomers * 5 + repeatCustomers);
    const overallScore = Math.round((revenueScore + inventoryScore + customersScore + 70) / 4);

    const inventoryValue = await Ingredient.aggregate([
      { $match: { restaurantId: rid, isActive: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$currentStock', '$averageCost'] } } } },
    ]).then(r => r[0]?.total ?? 0);

    const avgPrepTime = last7Orders.length > 0
      ? last7Orders.reduce((s, o) => {
          if (o.preparingAt && o.readyAt) {
            return s + (new Date(o.readyAt).getTime() - new Date(o.preparingAt).getTime()) / 60000;
          }
          return s + (o.estimatedPrepTime ?? 15);
        }, 0) / last7Orders.length
      : 0;

    // Delete existing report for today to avoid duplicates
    await AIReport.deleteOne({ restaurantId: rid, period: 'daily', reportDate: today });

    const report = await AIReport.create({
      restaurantId: rid,
      period: 'daily',
      reportDate: today,
      insights,
      recommendations,
      scores: {
        overall: overallScore,
        revenue: Math.round(revenueScore),
        operations: 70,
        customers: Math.round(customersScore),
        inventory: Math.round(inventoryScore),
        kitchen: 75,
      },
      metrics: {
        revenue: parseFloat(todayRevenue.toFixed(2)),
        expenses: parseFloat((totalExpenses / 30).toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        profitMargin: todayRevenue > 0 ? parseFloat(((profit / todayRevenue) * 100).toFixed(1)) : 0,
        orders: todayOrders.length,
        avgOrderValue: todayOrders.length > 0 ? parseFloat((todayRevenue / todayOrders.length).toFixed(2)) : 0,
        newCustomers,
        repeatCustomers,
        topItems,
        leastItems,
        peakHour: peakHourFormatted,
        avgPrepTime: parseFloat(avgPrepTime.toFixed(1)),
        wasteAmount: 0,
        inventoryValue: parseFloat(inventoryValue.toFixed(2)),
      },
    });

    logger.info(`AI daily report generated for restaurant ${restaurantId}`);
    return report;
  }

  async getLatestReport(restaurantId: string, period: string = 'daily') {
    return AIReport.findOne({ restaurantId, period })
      .sort({ reportDate: -1 })
      .lean();
  }

  async getReportHistory(restaurantId: string, period: string, limit: number = 30) {
    return AIReport.find({ restaurantId, period })
      .sort({ reportDate: -1 })
      .limit(limit)
      .lean();
  }

  async getSalesForecast(restaurantId: string) {
    const rid = new Types.ObjectId(restaurantId);
    const last30 = new Date(Date.now() - 30 * 86400000);

    // Daily revenue for last 30 days
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          restaurantId: rid,
          createdAt: { $gte: last30 },
          status: { $in: ['completed', 'served'] },
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

    if (dailyRevenue.length === 0) {
      return { forecast: [], confidence: 'low', avgDailyRevenue: 0, projectedMonthly: 0 };
    }

    const avg = dailyRevenue.reduce((s, d) => s + d.revenue, 0) / dailyRevenue.length;
    const recentAvg = dailyRevenue.slice(-7).reduce((s, d) => s + d.revenue, 0) / Math.min(7, dailyRevenue.length);

    // Linear trend: simple moving average projection for next 7 days
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() + (i + 1) * 86400000);
      const dayOfWeek = date.getDay();
      // Weekend boost
      const multiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.25 : 1.0;
      return {
        date: date.toISOString().split('T')[0],
        projectedRevenue: parseFloat((recentAvg * multiplier).toFixed(2)),
        dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
      };
    });

    return {
      forecast,
      confidence: dailyRevenue.length >= 14 ? 'high' : dailyRevenue.length >= 7 ? 'medium' : 'low',
      avgDailyRevenue: parseFloat(avg.toFixed(2)),
      projectedMonthly: parseFloat((recentAvg * 30).toFixed(2)),
      historicalData: dailyRevenue,
    };
  }

  async getExecutiveDashboard(restaurantId: string) {
    const rid = new Types.ObjectId(restaurantId);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      todayData,
      weekData,
      monthData,
      prevMonthData,
      expenseMonth,
      latestReport,
      inventoryAlerts,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { restaurantId: rid, createdAt: { $gte: todayStart }, status: { $in: ['completed', 'served'] } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 }, avgOrder: { $avg: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { restaurantId: rid, createdAt: { $gte: weekStart }, status: { $in: ['completed', 'served'] } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { restaurantId: rid, createdAt: { $gte: monthStart }, status: { $in: ['completed', 'served'] } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { restaurantId: rid, createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd }, status: { $in: ['completed', 'served'] } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { restaurantId: rid, status: { $in: ['approved', 'paid'] }, expenseDate: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      AIReport.findOne({ restaurantId: rid, period: 'daily' }).sort({ reportDate: -1 }).lean(),
      Ingredient.countDocuments({ restaurantId: rid, isActive: true, $expr: { $lte: ['$currentStock', '$reorderPoint'] } }),
    ]);

    const today = todayData[0] ?? { revenue: 0, orders: 0, avgOrder: 0 };
    const week = weekData[0] ?? { revenue: 0, orders: 0 };
    const month = monthData[0] ?? { revenue: 0, orders: 0 };
    const prevMonth = prevMonthData[0] ?? { revenue: 0, orders: 0 };
    const expenses = expenseMonth[0]?.total ?? 0;
    const profit = month.revenue - expenses;
    const profitMargin = month.revenue > 0 ? (profit / month.revenue) * 100 : 0;
    const monthGrowth = prevMonth.revenue > 0 ? ((month.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 : 0;

    return {
      today: {
        revenue: parseFloat(today.revenue.toFixed(2)),
        orders: today.orders,
        avgOrderValue: parseFloat((today.avgOrder ?? 0).toFixed(2)),
      },
      weekly: { revenue: parseFloat(week.revenue.toFixed(2)), orders: week.orders },
      monthly: {
        revenue: parseFloat(month.revenue.toFixed(2)),
        orders: month.orders,
        expenses: parseFloat(expenses.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(1)),
        growth: parseFloat(monthGrowth.toFixed(1)),
      },
      alerts: { lowStockIngredients: inventoryAlerts },
      aiReport: latestReport
        ? {
            scores: latestReport.scores,
            topInsights: latestReport.insights.filter((i) => i.priority === 'high').slice(0, 3),
            topRecommendations: latestReport.recommendations.filter((r) => r.priority === 'high').slice(0, 3),
          }
        : null,
    };
  }
}

export const aiService = new AIService();
