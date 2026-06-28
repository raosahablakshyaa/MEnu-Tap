'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminHeader } from '@/components/admin/header';
import { DataTable, StatusBadge, Pagination } from '@/components/admin/data-table';
import { adminApi } from '@/lib/api/admin';
import { SubscriptionPlan, Subscription } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<'plans' | 'subscriptions'>('plans');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'plans') {
        const res = await adminApi.subscriptions.listPlans({ page, limit: 20 });
        if (res.data) { setPlans(res.data.items); setTotalPages(res.data.totalPages); }
      } else {
        const res = await adminApi.subscriptions.list({ page, limit: 20 });
        if (res.data) { setSubscriptions(res.data.items); setTotalPages(res.data.totalPages); }
      }
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, [tab, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePause = async (id: string) => {
    try { await adminApi.subscriptions.pausePlan(id); toast.success('Plan paused'); fetchData(); }
    catch { toast.error('Failed'); }
  };

  const handleDuplicate = async (id: string) => {
    try { await adminApi.subscriptions.duplicatePlan(id); toast.success('Plan duplicated'); fetchData(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <AdminHeader title="Subscriptions" />
      <div className="space-y-4 p-6">
        <div className="flex gap-2">
          <Button variant={tab === 'plans' ? 'default' : 'outline'} size="sm" onClick={() => { setTab('plans'); setPage(1); }}>Plans</Button>
          <Button variant={tab === 'subscriptions' ? 'default' : 'outline'} size="sm" onClick={() => { setTab('subscriptions'); setPage(1); }}>Active Subscriptions</Button>
        </div>

        {tab === 'plans' ? (
          <DataTable<SubscriptionPlan & Record<string, unknown>>
            loading={loading}
            data={plans as (SubscriptionPlan & Record<string, unknown>)[]}
            columns={[
              { key: 'name', header: 'Plan', render: (p) => (
                <div>
                  <span className="font-medium">{p.name as string}</span>
                  {(p as SubscriptionPlan).isPopular && <span className="ml-2 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs text-orange-500">Popular</span>}
                </div>
              )},
              { key: 'duration', header: 'Duration', render: (p) => <span className="capitalize">{(p.duration as string).replace('_', ' ')}</span> },
              { key: 'price', header: 'Price', render: (p) => formatCurrency(p.price as number) },
              { key: 'status', header: 'Status', render: (p) => <StatusBadge status={(p as SubscriptionPlan).isPaused ? 'suspended' : (p.isActive ? 'active' : 'expired')} /> },
              { key: 'actions', header: 'Actions', render: (p) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handlePause(p._id as string)}>Pause</Button>
                  <Button size="sm" variant="outline" onClick={() => handleDuplicate(p._id as string)}>Duplicate</Button>
                </div>
              )},
            ]}
          />
        ) : (
          <DataTable<Subscription & Record<string, unknown>>
            loading={loading}
            data={subscriptions as (Subscription & Record<string, unknown>)[]}
            columns={[
              { key: 'restaurant', header: 'Restaurant', render: (s) => (s.restaurantId as { name: string })?.name || '-' },
              { key: 'plan', header: 'Plan', render: (s) => (s.planId as { name: string })?.name || '-' },
              { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status as string} /> },
              { key: 'amount', header: 'Amount', render: (s) => formatCurrency(s.amount as number) },
              { key: 'endDate', header: 'Expires', render: (s) => new Date(s.endDate as string).toLocaleDateString() },
              { key: 'actions', header: 'Actions', render: (s) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={async () => { await adminApi.subscriptions.renew(s._id as string); toast.success('Renewed'); fetchData(); }}>Renew</Button>
                  <Button size="sm" variant="outline" onClick={async () => { await adminApi.subscriptions.generateInvoice(s._id as string); toast.success('Invoice generated'); }}>Invoice</Button>
                </div>
              )},
            ]}
          />
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
