'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp, ShoppingBag, Clock, CheckCircle2, XCircle,
  Table2, Users, QrCode, UtensilsCrossed, FolderOpen,
  CreditCard, BarChart3, ArrowUpRight, ArrowDownRight, AlertCircle,
  ReceiptText,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { dashboardApi, analyticsApi, ownerOrdersApi } from '@/lib/api/owner';
import { DashboardStats } from '@/types/owner';
import type { Order, OrderStatus } from '@/types/customer';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

function getDaysUntilExpiry(expiresAt: string) {
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return null;

  const now = new Date();
  const endOfExpiryDay = new Date(expiry);
  endOfExpiryDay.setHours(23, 59, 59, 999);

  return Math.ceil((endOfExpiryDay.getTime() - now.getTime()) / 86400000);
}

function shouldShowRenewalAlert(subscription: DashboardStats['subscription']) {
  if (!subscription) return false;

  const daysUntilExpiry = getDaysUntilExpiry(subscription.expiresAt);
  return daysUntilExpiry !== null && daysUntilExpiry <= 7;
}

function formatOrderTime(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '-';

  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function orderItemsSummary(items: Order['items']) {
  if (!items?.length) return 'No items';

  const visible = items.slice(0, 2).map((item) => `${item.quantity}x ${item.name}`);
  const extra = items.length > 2 ? ` +${items.length - 2} more` : '';
  return `${visible.join(', ')}${extra}`;
}

function statusClass(status: OrderStatus) {
  if (status === 'completed' || status === 'served') return 'badge-success';
  if (status === 'cancelled') return 'badge-danger';
  if (status === 'ready') return 'badge-info';
  return 'badge-warning';
}

function paymentClass(status: Order['paymentStatus']) {
  return status === 'paid' ? 'badge-success' : status === 'failed' ? 'badge-danger' : 'badge-warning';
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  sub?: string;
  trend?: number;
}

function StatCard({ label, value, icon: Icon, iconBg, sub, trend }: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in-up">
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: iconBg }}
        >
          <Icon size={17} className="text-white" />
        </div>
        {trend !== undefined && (
          <span
            className="flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded"
            style={{
              background: trend >= 0 ? '#d1fae5' : '#fee2e2',
              color: trend >= 0 ? '#065f46' : '#991b1b',
            }}
          >
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{value}</p>
      <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>{label}</p>
      {sub && <p className="mt-1 text-xs" style={{ color: 'var(--foreground-subtle)' }}>{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h2>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>{sub}</p>}
    </div>
  );
}

const PIE_COLORS = ['#0f766e', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'];

const NEXT_STATUS_OPTIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['served'],
  served: ['completed'],
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-lg px-3 py-2 text-xs shadow-lg"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
        }}
      >
        <p className="font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>{label}</p>
        <p className="font-bold">{fmt(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function OwnerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [daily, setDaily] = useState<{ _id: string; revenue: number; orders: number }[]>([]);
  const [topItems, setTopItems] = useState<{ _id: string; totalQty: number; totalRevenue: number }[]>([]);
  const [statusDist, setStatusDist] = useState<{ _id: string; count: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const [statsRes, dailyRes, topItemsRes, analyticsRes, ordersRes] = await Promise.allSettled([
        dashboardApi.getStats(),
        analyticsApi.daily(14),
        analyticsApi.topItems(5),
        analyticsApi.full(),
        ownerOrdersApi.recent(8),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data) setStats(statsRes.value.data as unknown as DashboardStats);
      if (dailyRes.status === 'fulfilled' && dailyRes.value.data) setDaily(dailyRes.value.data as typeof daily);
      if (topItemsRes.status === 'fulfilled' && topItemsRes.value.data) setTopItems(topItemsRes.value.data as typeof topItems);
      if (analyticsRes.status === 'fulfilled') {
        const full = analyticsRes.value.data as Record<string, unknown>;
        if (full?.statusDist) setStatusDist(full.statusDist as typeof statusDist);
      }
      if (ordersRes.status === 'fulfilled') {
        setRecentOrders(ordersRes.value.data?.orders ?? []);
        setOrdersError(null);
      } else {
        setOrdersError('Order details could not load. Please refresh after the server restarts.');
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  const handleStatusChange = async (order: Order, nextStatus: OrderStatus) => {
    setStatusUpdating(order._id);
    setStatusError(null);
    try {
      const res = await ownerOrdersApi.updateStatus(
        order._id,
        nextStatus,
        nextStatus === 'cancelled' ? 'Cancelled from owner dashboard' : undefined
      );
      const updated = res.data as Order | null;
      if (updated) {
        setRecentOrders((orders) => orders.map((item) => item._id === order._id ? updated : item));
      }
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Could not update order status');
    } finally {
      setStatusUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 skeleton" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-64 skeleton lg:col-span-2" />
          <div className="h-64 skeleton" />
        </div>
      </div>
    );
  }

  const s = stats;
  const showRenewalAlert = shouldShowRenewalAlert(s?.subscription ?? null);

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* Subscription Alert */}
      {showRenewalAlert && s?.subscription && (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{
            background: 'var(--primary-light)',
            border: '1px solid var(--primary)',
          }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={16} style={{ color: 'var(--primary)' }} />
            <div>
              <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                {s.subscription.plan} Plan
              </span>
              <span className="ml-2 text-xs" style={{ color: 'var(--primary)' }}>
                · Expires {new Date(s.subscription.expiresAt).toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>
          <span
            className="badge badge-teal capitalize"
            style={{ textTransform: 'capitalize' }}
          >
            {s.subscription.status}
          </span>
        </div>
      )}

      {/* KPI Row 1 */}
      <div>
        <SectionHeader title="Today's Performance" sub="Real-time metrics for today" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Today's Revenue"    value={fmt(s?.today.revenue ?? 0)}            icon={TrendingUp}   iconBg="#0f766e" />
          <StatCard label="Today's Orders"     value={s?.today.orders ?? 0}                  icon={ShoppingBag}  iconBg="#3b82f6" />
          <StatCard label="Pending Orders"     value={s?.today.pendingOrders ?? 0}           icon={Clock}        iconBg="#f59e0b" />
          <StatCard label="Completed Orders"   value={s?.today.completedOrders ?? 0}         icon={CheckCircle2} iconBg="#10b981" />
        </div>
      </div>

      {/* KPI Row 2 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cancelled Orders"  value={s?.today.cancelledOrders ?? 0}                                  icon={XCircle}       iconBg="#ef4444" />
        <StatCard label="Tables Occupied"   value={`${s?.tables.occupied ?? 0} / ${s?.tables.total ?? 0}`}         icon={Table2}        iconBg="#8b5cf6" />
        <StatCard label="Monthly Revenue"   value={fmt(s?.monthly.revenue ?? 0)}   sub={`${s?.monthly.orders ?? 0} orders`}  icon={BarChart3}     iconBg="#6366f1" />
        <StatCard label="Avg Order Value"   value={fmt(s?.today.avgOrderValue ?? 0)}                               icon={CreditCard}    iconBg="#ec4899" />
      </div>

      {/* KPI Row 3 */}
      <div>
        <SectionHeader title="Restaurant Overview" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Menu Items"    value={s?.menu.items ?? 0}      icon={UtensilsCrossed} iconBg="#0f766e" />
          <StatCard label="Categories"   value={s?.menu.categories ?? 0} icon={FolderOpen}      iconBg="#14b8a6" />
          <StatCard label="Staff Members"value={s?.staff.count ?? 0}     icon={Users}           iconBg="#6366f1" />
          <StatCard label="QR Codes"     value={s?.qrCodes.generated ?? 0}icon={QrCode}         iconBg="#f59e0b" />
        </div>
      </div>

      {/* Order Details */}
      <div className="content-card p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <SectionHeader title="Order Details" sub="Latest customer orders from QR, menu and counter flows" />
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: '#dbeafe', color: '#1d4ed8' }}
          >
            <ReceiptText size={18} />
          </div>
        </div>
        {statusError && (
          <div className="mb-3 rounded-lg px-3 py-2 text-xs font-medium badge-danger">
            {statusError}
          </div>
        )}

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr style={{ color: 'var(--foreground-muted)' }}>
                  <th className="border-b px-3 py-2 text-xs font-semibold" style={{ borderColor: 'var(--border)' }}>Order</th>
                  <th className="border-b px-3 py-2 text-xs font-semibold" style={{ borderColor: 'var(--border)' }}>Customer</th>
                  <th className="border-b px-3 py-2 text-xs font-semibold" style={{ borderColor: 'var(--border)' }}>Items</th>
                  <th className="border-b px-3 py-2 text-xs font-semibold" style={{ borderColor: 'var(--border)' }}>Payment</th>
                  <th className="border-b px-3 py-2 text-xs font-semibold" style={{ borderColor: 'var(--border)' }}>Total</th>
                  <th className="border-b px-3 py-2 text-xs font-semibold" style={{ borderColor: 'var(--border)' }}>Invoice</th>
                  <th className="border-b px-3 py-2 text-xs font-semibold" style={{ borderColor: 'var(--border)' }}>Status</th>
                  <th className="border-b px-3 py-2 text-xs font-semibold" style={{ borderColor: 'var(--border)' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id} className="align-top">
                    <td className="border-b px-3 py-3 font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                      #{order.orderNumber}
                    </td>
                    <td className="border-b px-3 py-3" style={{ borderColor: 'var(--border)' }}>
                      <p className="font-medium" style={{ color: 'var(--foreground)' }}>{order.customerName || 'Guest'}</p>
                      <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                        {order.tableNumber ? `Table ${order.tableNumber}` : 'No table'}
                        {order.customerPhone ? ` · ${order.customerPhone}` : ''}
                      </p>
                    </td>
                    <td className="max-w-[260px] border-b px-3 py-3 text-xs leading-5" style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}>
                      {orderItemsSummary(order.items)}
                    </td>
                    <td className="border-b px-3 py-3" style={{ borderColor: 'var(--border)' }}>
                      <span className={`badge ${paymentClass(order.paymentStatus)} capitalize`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="border-b px-3 py-3 font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                      {fmt(order.totalAmount)}
                    </td>
                    <td className="border-b px-3 py-3 text-xs font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}>
                      {order.gstInvoiceNumber || 'Generating'}
                    </td>
                    <td className="border-b px-3 py-3" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex flex-col gap-2">
                        <span className={`badge ${statusClass(order.status)} w-fit capitalize`}>
                          {order.status}
                        </span>
                        {(NEXT_STATUS_OPTIONS[order.status]?.length ?? 0) > 0 && (
                          <select
                            value=""
                            disabled={statusUpdating === order._id}
                            onChange={(event) => {
                              const nextStatus = event.target.value as OrderStatus;
                              if (nextStatus) handleStatusChange(order, nextStatus);
                            }}
                            className="h-8 rounded-md border px-2 text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60"
                            style={{
                              background: 'var(--surface)',
                              borderColor: 'var(--border)',
                              color: 'var(--foreground)',
                            }}
                          >
                            <option value="">
                              {statusUpdating === order._id ? 'Updating...' : 'Change status'}
                            </option>
                            {NEXT_STATUS_OPTIONS[order.status]?.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="border-b px-3 py-3 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}>
                      {formatOrderTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className="flex min-h-32 items-center justify-center rounded-lg border border-dashed text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}
          >
            {ordersError ?? 'No orders placed yet'}
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="content-card p-5 lg:col-span-2">
          <SectionHeader title="Revenue Trend" sub="Last 14 days" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={daily} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0f766e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="_id"
                tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }}
                tickFormatter={v => v.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0f766e"
                strokeWidth={2}
                fill="url(#revGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#0f766e', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="content-card p-5">
          <SectionHeader title="Order Status" sub="Distribution" />
          {statusDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusDist}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="45%"
                  outerRadius={75}
                  innerRadius={40}
                  paddingAngle={3}
                >
                  {statusDist.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--foreground)',
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: 'var(--foreground-muted)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div
              className="flex h-[220px] items-center justify-center text-xs"
              style={{ color: 'var(--foreground-muted)' }}
            >
              No order data yet
            </div>
          )}
        </div>
      </div>

      {/* Top Items */}
      {topItems.length > 0 && (
        <div className="content-card p-5">
          <SectionHeader title="Top Selling Items" sub="By quantity sold" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topItems} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="_id"
                tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--foreground)',
                }}
              />
              <Bar dataKey="totalQty" fill="#0f766e" radius={[4, 4, 0, 0]} name="Qty Sold" maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
