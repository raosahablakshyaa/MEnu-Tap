'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, ShoppingBag, Clock, CheckCircle2, XCircle,
  Table2, Users, QrCode, UtensilsCrossed, FolderOpen,
  CreditCard, BarChart3, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { dashboardApi, analyticsApi } from '@/lib/api/owner';
import { DashboardStats } from '@/types/owner';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
  trend?: number;
}

function StatCard({ label, value, icon: Icon, color, sub, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
      <p className="mt-0.5 text-sm text-zinc-500">{label}</p>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </motion.div>
  );
}

const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6'];

export default function OwnerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [daily, setDaily] = useState<{ _id: string; revenue: number; orders: number }[]>([]);
  const [topItems, setTopItems] = useState<{ _id: string; totalQty: number; totalRevenue: number }[]>([]);
  const [statusDist, setStatusDist] = useState<{ _id: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.getStats(),
      analyticsApi.daily(14),
      analyticsApi.topItems(5),
      analyticsApi.full(),
    ]).then(([s, d, t, a]) => {
      if (s.data) setStats(s.data as unknown as DashboardStats);
      if (d.data) setDaily(d.data as typeof daily);
      if (t.data) setTopItems(t.data as typeof topItems);
      const full = a.data as Record<string, unknown>;
      if (full?.statusDist) setStatusDist(full.statusDist as typeof statusDist);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  const s = stats;

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Revenue" value={fmt(s?.today.revenue ?? 0)} icon={TrendingUp} color="bg-orange-500" />
        <StatCard label="Today's Orders" value={s?.today.orders ?? 0} icon={ShoppingBag} color="bg-blue-500" />
        <StatCard label="Pending Orders" value={s?.today.pendingOrders ?? 0} icon={Clock} color="bg-amber-500" />
        <StatCard label="Completed Orders" value={s?.today.completedOrders ?? 0} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard label="Cancelled Orders" value={s?.today.cancelledOrders ?? 0} icon={XCircle} color="bg-red-500" />
        <StatCard label="Occupied Tables" value={`${s?.tables.occupied ?? 0}/${s?.tables.total ?? 0}`} icon={Table2} color="bg-violet-500" />
        <StatCard label="Monthly Revenue" value={fmt(s?.monthly.revenue ?? 0)} icon={BarChart3} color="bg-indigo-500" sub={`${s?.monthly.orders ?? 0} orders`} />
        <StatCard label="Avg Order Value" value={fmt(s?.today.avgOrderValue ?? 0)} icon={TrendingUp} color="bg-pink-500" />
      </div>

      {/* Second row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Menu Items" value={s?.menu.items ?? 0} icon={UtensilsCrossed} color="bg-teal-500" />
        <StatCard label="Categories" value={s?.menu.categories ?? 0} icon={FolderOpen} color="bg-cyan-500" />
        <StatCard label="Staff Members" value={s?.staff.count ?? 0} icon={Users} color="bg-fuchsia-500" />
        <StatCard label="QR Codes" value={s?.qrCodes.generated ?? 0} icon={QrCode} color="bg-rose-500" />
      </div>

      {/* Subscription Banner */}
      {s?.subscription && (
        <div className="flex items-center justify-between rounded-2xl border border-orange-200/60 bg-orange-50 px-5 py-4 dark:border-orange-900/40 dark:bg-orange-950/20">
          <div className="flex items-center gap-3">
            <CreditCard className="text-orange-600" size={20} />
            <div>
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                {s.subscription.plan} Plan
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Expires {new Date(s.subscription.expiresAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium capitalize text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
            {s.subscription.status}
          </span>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Revenue — Last 14 days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={daily} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={(v) => fmt(Number(v))} labelFormatter={l => `Date: ${l}`} />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Order Status</h3>
          {statusDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusDist} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label>
                  {statusDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-zinc-400">No order data yet</div>
          )}
        </div>
      </div>

      {/* Top Items */}
      {topItems.length > 0 && (
        <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topItems} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="totalQty" fill="#f97316" radius={[4, 4, 0, 0]} name="Qty Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
