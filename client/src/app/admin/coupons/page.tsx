'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminHeader } from '@/components/admin/header';
import { DataTable, StatusBadge, Pagination } from '@/components/admin/data-table';
import { adminApi } from '@/lib/api/admin';
import { Coupon } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.coupons.list({ page, limit: 20 });
      if (res.data) { setCoupons(res.data.items); setTotalPages(res.data.totalPages); }
    } catch { toast.error('Failed to load coupons'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  return (
    <div>
      <AdminHeader title="Coupons" />
      <div className="space-y-4 p-6">
        <DataTable<Coupon & Record<string, unknown>>
          loading={loading}
          data={coupons as (Coupon & Record<string, unknown>)[]}
          columns={[
            { key: 'code', header: 'Code', render: (c) => <span className="font-mono font-bold">{c.code as string}</span> },
            { key: 'name', header: 'Name' },
            { key: 'type', header: 'Type', render: (c) => <span className="capitalize">{c.type as string}</span> },
            { key: 'discount', header: 'Discount', render: (c) => c.type === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}` },
            { key: 'usage', header: 'Usage', render: (c) => `${c.usageCount}/${c.usageLimit}` },
            { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status as string} /> },
            { key: 'expires', header: 'Expires', render: (c) => new Date(c.endDate as string).toLocaleDateString() },
            { key: 'actions', header: '', render: (c) => (
              <Button size="sm" variant="outline" onClick={async () => { await adminApi.coupons.delete(c._id as string); toast.success('Deleted'); fetchCoupons(); }}>Delete</Button>
            )},
          ]}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
