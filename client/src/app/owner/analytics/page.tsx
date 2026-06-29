'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api/owner';
import { Loader2 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

type Period = 'today' | 'week' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today', week: 'This Week', month: 'This Month', year: 'This Year',
};
const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4'];

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [revenue, setRevenue] = useState<Record<string, unknown> | null>(null);
  const [daily, setDaily] = useState<{ _id: string; revenue: number; orders: number }[]>([]);
  const [monthly, setMonthly] = useState<{ _id: string; revenue: number; orders: number }[]>([]);
  const [peakHours, setPeakHours] = useState<{ _id: number; orders: number; revenue: number }[]>([]);
  const [topItems, setTopItems] = useState<{ _id: string; totalQty: number; totalRevenue: number }[]>([]);
  const [statusDist, setStatusDist] = useState<{ _id: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsApi.revenue(period),
      analyticsApi.daily(30),
      analyticsApi.monthly(12),
      analyticsApi.peakHours(),
      analyticsApi.topItems(10),
      analyticsApi.full(),
    ]).then(([r, d, m, p, t, full]) => {
      if (r.data) setRevenue(r.data as Record<string, unknown>);
      if (d.data) setDaily(d.data as typeof daily);
      if (m.data) setMonthly(m.data as typeof monthly);
      if (p.data) setPeakHours(p.data as typeof peakHours);
      if (t.data) setTopItems(t.data as typeof topItems);
      const f = full.data as Record<string, unknown>;
      if (f?.statusDist) setStatusDist(f.statusDist as typeof statusDist);
    }).finally(() => setLoading(false));
  }, [period]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-orange-500" size={32} />
    </div>
  );

  const peakHoursFormatted = peakHours.map(h => ({
    ...h,
    hour: `${h._id}:00`,
  }));

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${period === p ? 'bg-orange-600 text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:border-orange-400 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'}`}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Revenue summary cards */}
      {revenue && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Revenue" value={fmt(revenue.totalRevenue as number)} />
          <StatCard label="Total Orders" value={String(revenue.totalOrders)} />
          <StatCard label="Avg Order Value" value={fmt(revenue.avgOrderValue as number)} />
        </div>
      )}

      {/* Daily Revenue Chart */}
      <ChartCard title="Daily Revenue (Last 30 Days)">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={daily} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
            <Tooltip formatter={(v) => fmt(Number(v))} />
            <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#rev)" name="Revenue" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Monthly Orders + Revenue */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Monthly Revenue (12 Months)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Orders">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthly} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={false} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Peak Hours + Order Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Peak Hours (Last 30 Days)">
          {peakHoursFormatted.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={peakHoursFormatted} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </ChartCard>

        <ChartCard title="Order Status Distribution">
          {statusDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusDist} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80}>
                  {statusDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </ChartCard>
      </div>

      {/* Top Items */}
      {topItems.length > 0 && (
        <ChartCard title="Top Selling Items">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 8, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="_id" type="category" tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={(v, name) => [name === 'totalRevenue' ? fmt(Number(v)) : v, name === 'totalRevenue' ? 'Revenue' : 'Qty']} />
              <Bar dataKey="totalQty" fill="#f97316" radius={[0, 4, 4, 0]} name="Qty Sold" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h3>
      {children}
    </div>
  );
}

function Empty() {
  return <div className="flex h-[220px] items-center justify-center text-sm text-zinc-400">No data yet</div>;
}
