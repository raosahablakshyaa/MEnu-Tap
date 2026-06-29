'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminHeader } from '@/components/admin/header';
import { DataTable, StatusBadge, Pagination } from '@/components/admin/data-table';
import { adminApi } from '@/lib/api/admin';
import { SupportTicket } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.support.list({ page, limit: 20 });
      if (res.data) { setTickets(res.data.items); setTotalPages(res.data.totalPages); }
    } catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return (
    <div>
      <AdminHeader title="Support" />
      <div className="space-y-4 p-6">
        <DataTable<SupportTicket & Record<string, unknown>>
          loading={loading}
          data={tickets as (SupportTicket & Record<string, unknown>)[]}
          columns={[
            { key: 'ticketNumber', header: 'Ticket', render: (t) => <span className="font-mono text-xs">{t.ticketNumber as string}</span> },
            { key: 'subject', header: 'Subject', render: (t) => <span className="font-medium">{t.subject as string}</span> },
            { key: 'restaurant', header: 'Restaurant', render: (t) => (t.restaurantId as { name: string })?.name || '-' },
            { key: 'priority', header: 'Priority', render: (t) => <StatusBadge status={t.priority as string} /> },
            { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status as string} /> },
            { key: 'date', header: 'Created', render: (t) => new Date(t.createdAt as string).toLocaleDateString() },
            { key: 'actions', header: 'Actions', render: (t) => (
              <div className="flex gap-2">
                {t.status !== 'closed' && (
                  <Button size="sm" variant="outline" onClick={async () => { await adminApi.support.close(t._id as string); toast.success('Closed'); fetchTickets(); }}>Close</Button>
                )}
                {t.status === 'closed' && (
                  <Button size="sm" variant="outline" onClick={async () => { await adminApi.support.reopen(t._id as string); toast.success('Reopened'); fetchTickets(); }}>Reopen</Button>
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
