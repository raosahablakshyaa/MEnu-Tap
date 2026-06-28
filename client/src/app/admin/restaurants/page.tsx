'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin/header';
import { DataTable, StatusBadge, Pagination } from '@/components/admin/data-table';
import { adminApi } from '@/lib/api/admin';
import { Restaurant } from '@/types/admin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Search, CheckCircle, XCircle, Pause, Play } from 'lucide-react';

export default function RestaurantsPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.restaurants.list(params);
      if (res.data) {
        setRestaurants(res.data.items);
        setTotalPages(res.data.totalPages);
      }
    } catch {
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  const handleAction = async (id: string, action: string) => {
    try {
      switch (action) {
        case 'approve': await adminApi.restaurants.approve(id); toast.success('Restaurant approved'); break;
        case 'reject': await adminApi.restaurants.reject(id, 'Rejected by admin'); toast.success('Restaurant rejected'); break;
        case 'suspend': await adminApi.restaurants.suspend(id, 'Suspended by admin'); toast.success('Restaurant suspended'); break;
        case 'activate': await adminApi.restaurants.activate(id); toast.success('Restaurant activated'); break;
      }
      fetchRestaurants();
    } catch {
      toast.error('Action failed');
    }
  };

  return (
    <div>
      <AdminHeader title="Restaurants" />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input placeholder="Search restaurants..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-200/50 bg-white/60 px-3 py-2 text-sm dark:border-zinc-700/50 dark:bg-zinc-900/40"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <Button onClick={() => { setPage(1); fetchRestaurants(); }}>Search</Button>
        </div>

        <DataTable<Restaurant & Record<string, unknown>>
          loading={loading}
          data={restaurants as (Restaurant & Record<string, unknown>)[]}
          onRowClick={(r) => router.push(`/admin/restaurants/${r._id}`)}
          columns={[
            { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.name as string}</span> },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status as string} /> },
            { key: 'owner', header: 'Owner', render: (r) => {
              const owner = r.ownerId as { firstName: string; lastName: string; email: string };
              return owner ? `${owner.firstName} ${owner.lastName}` : '-';
            }},
            { key: 'city', header: 'City', render: (r) => (r.address as { city: string })?.city || '-' },
            { key: 'actions', header: 'Actions', render: (r) => (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                {r.status === 'pending' || r.status === 'pending_approval' ? (
                  <>
                    <button onClick={() => handleAction(r._id as string, 'approve')} className="rounded p-1 text-emerald-500 hover:bg-emerald-500/10"><CheckCircle size={16} /></button>
                    <button onClick={() => handleAction(r._id as string, 'reject')} className="rounded p-1 text-red-500 hover:bg-red-500/10"><XCircle size={16} /></button>
                  </>
                ) : null}
                {r.status === 'approved' && (
                  <button onClick={() => handleAction(r._id as string, 'suspend')} className="rounded p-1 text-amber-500 hover:bg-amber-500/10"><Pause size={16} /></button>
                )}
                {r.status === 'suspended' && (
                  <button onClick={() => handleAction(r._id as string, 'activate')} className="rounded p-1 text-emerald-500 hover:bg-emerald-500/10"><Play size={16} /></button>
                )}
              </div>
            )},
          ]}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
