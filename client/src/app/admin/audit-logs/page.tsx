'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminHeader } from '@/components/admin/header';
import { DataTable, StatusBadge, Pagination } from '@/components/admin/data-table';
import { adminApi } from '@/lib/api/admin';
import { AuditLogEntry } from '@/types/admin';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.auditLogs.list({ page, limit: 30 });
      if (res.data) { setLogs(res.data.items); setTotalPages(res.data.totalPages); }
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div>
      <AdminHeader title="Audit Logs" />
      <div className="space-y-4 p-6">
        <DataTable<AuditLogEntry & Record<string, unknown>>
          loading={loading}
          data={logs as (AuditLogEntry & Record<string, unknown>)[]}
          columns={[
            { key: 'action', header: 'Action', render: (l) => <span className="font-mono text-xs">{l.action as string}</span> },
            { key: 'resource', header: 'Resource' },
            { key: 'user', header: 'User', render: (l) => (l.userEmail as string) || '-' },
            { key: 'role', header: 'Role', render: (l) => (l.userRole as string) || '-' },
            { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.status as string} /> },
            { key: 'date', header: 'Timestamp', render: (l) => new Date(l.createdAt as string).toLocaleString() },
          ]}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
