'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminHeader } from '@/components/admin/header';
import { StatCard } from '@/components/admin/stat-card';
import { ChartCard } from '@/components/admin/chart-card';
import { adminApi } from '@/lib/api/admin';
import { DashboardStats } from '@/types/admin';
import {
  Store, Users, IndianRupee, TrendingUp, Clock,
  UserCheck, AlertTriangle,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { apiClient } from '@/lib/api/client';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.dashboard.getStats();
      if (res.data) setStats(res.data);
    } catch {
      /* handled by guard */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    const token = apiClient.getAccessToken();
    if (!token) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000', {
      auth: { token },
    });

    socket.on('dashboard:stats', (data: DashboardStats) => {
      setStats(data);
    });

    return () => { socket.disconnect(); };
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div>
        <AdminHeader title="Dashboard" />
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-t-transparent" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Dashboard" />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Platform Revenue" value={formatCurrency(stats.platformRevenue)} icon={IndianRupee} subtitle={`MRR: ${formatCurrency(stats.mrr)}`} />
          <StatCard title="ARR" value={formatCurrency(stats.arr)} icon={TrendingUp} />
          <StatCard title="Total Restaurants" value={stats.totalRestaurants} icon={Store} subtitle={`${stats.activeRestaurants} active`} />
          <StatCard title="Today's Revenue" value={formatCurrency(stats.todayRevenue)} icon={IndianRupee} subtitle={`${stats.todayOrders} orders today`} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Pending Approvals" value={stats.pendingApprovals} icon={Clock} />
          <StatCard title="Expired Subscriptions" value={stats.expiredSubscriptions} icon={AlertTriangle} />
          <StatCard title="Platform Customers" value={stats.platformCustomers} icon={Users} />
          <StatCard title="Platform Staff" value={stats.platformStaff} icon={UserCheck} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Revenue Growth" data={stats.charts.revenueGrowth} />
          <ChartCard title="Restaurant Growth" data={stats.charts.restaurantGrowth} type="bar" />
          <ChartCard title="Orders Growth" data={stats.charts.ordersGrowth} />
          <ChartCard title="Customer Growth" data={stats.charts.customerGrowth} type="bar" color="#8b5cf6" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="content-card p-5">
            <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Top Restaurants</h3>
            {stats.topRestaurants.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>No revenue data yet</p>
            ) : (
              <div className="space-y-3">
                {stats.topRestaurants.map((r, i) => (
                  <div key={r.restaurantId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{i + 1}</span>
                      <span className="text-sm font-medium">{r.name}</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>{formatCurrency(r.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="content-card p-5">
            <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Recently Registered</h3>
            {stats.recentRestaurants.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>No restaurants yet</p>
            ) : (
              <div className="space-y-3">
                {(stats.recentRestaurants as { name: string; status: string; createdAt: string }[]).map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{r.name}</span>
                    <span className="text-xs capitalize" style={{ color: 'var(--foreground-muted)' }}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
