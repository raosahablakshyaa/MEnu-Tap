'use client';

import { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/admin/header';
import { StatCard } from '@/components/admin/stat-card';
import { DataTable, StatusBadge, Pagination } from '@/components/admin/data-table';
import { adminApi } from '@/lib/api/admin';
import { PaymentTransaction } from '@/types/admin';
import { IndianRupee } from 'lucide-react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function RevenuePage() {
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [dashRes, txRes] = await Promise.all([
          adminApi.revenue.getDashboard(),
          adminApi.revenue.listTransactions({ page, limit: 20 }),
        ]);
        if (dashRes.data) setDashboard(dashRes.data as Record<string, unknown>);
        if (txRes.data) { setTransactions(txRes.data.items); setTotalPages(txRes.data.totalPages); }
      } finally { setLoading(false); }
    }
    load();
  }, [page]);

  return (
    <div>
      <AdminHeader title="Revenue" />
      <div className="space-y-6 p-6">
        {dashboard && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Today" value={formatCurrency(dashboard.todayRevenue as number)} icon={IndianRupee} />
            <StatCard title="This Week" value={formatCurrency(dashboard.weeklyRevenue as number)} icon={IndianRupee} />
            <StatCard title="This Month" value={formatCurrency(dashboard.monthlyRevenue as number)} icon={IndianRupee} />
            <StatCard title="This Year" value={formatCurrency(dashboard.yearlyRevenue as number)} icon={IndianRupee} />
          </div>
        )}

        <h2 className="text-lg font-semibold">Transactions</h2>
        <DataTable<PaymentTransaction & Record<string, unknown>>
          loading={loading}
          data={transactions as (PaymentTransaction & Record<string, unknown>)[]}
          columns={[
            { key: 'transactionId', header: 'ID', render: (t) => <span className="font-mono text-xs">{t.transactionId as string}</span> },
            { key: 'restaurant', header: 'Restaurant', render: (t) => (t.restaurantId as { name: string })?.name || '-' },
            { key: 'amount', header: 'Amount', render: (t) => formatCurrency(t.amount as number) },
            { key: 'type', header: 'Type', render: (t) => <span className="capitalize">{t.type as string}</span> },
            { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status as string} /> },
            { key: 'date', header: 'Date', render: (t) => new Date(t.createdAt as string).toLocaleDateString() },
          ]}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
