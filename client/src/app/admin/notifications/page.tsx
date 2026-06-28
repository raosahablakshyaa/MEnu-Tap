'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminHeader } from '@/components/admin/header';
import { DataTable, StatusBadge, Pagination } from '@/components/admin/data-table';
import { adminApi } from '@/lib/api/admin';
import { Notification } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.notifications.list({ page, limit: 20 });
      if (res.data) { setNotifications(res.data.items); setTotalPages(res.data.totalPages); }
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      <AdminHeader title="Notifications" />
      <div className="space-y-4 p-6">
        <DataTable<Notification & Record<string, unknown>>
          loading={loading}
          data={notifications as (Notification & Record<string, unknown>)[]}
          columns={[
            { key: 'title', header: 'Title', render: (n) => <span className="font-medium">{n.title as string}</span> },
            { key: 'channels', header: 'Channels', render: (n) => (n.channels as string[]).join(', ') },
            { key: 'target', header: 'Target', render: (n) => <span className="capitalize">{n.targetType as string}</span> },
            { key: 'status', header: 'Status', render: (n) => <StatusBadge status={n.status as string} /> },
            { key: 'recipients', header: 'Recipients', render: (n) => n.recipientCount as number },
            { key: 'date', header: 'Created', render: (n) => new Date(n.createdAt as string).toLocaleDateString() },
            { key: 'actions', header: 'Actions', render: (n) => (
              <div className="flex gap-2">
                {n.status === 'draft' && (
                  <Button size="sm" onClick={async () => { await adminApi.notifications.send(n._id as string); toast.success('Sent'); fetchData(); }}>Send</Button>
                )}
                {(n.status === 'draft' || n.status === 'scheduled') && (
                  <Button size="sm" variant="outline" onClick={async () => { await adminApi.notifications.cancel(n._id as string); toast.success('Cancelled'); fetchData(); }}>Cancel</Button>
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
