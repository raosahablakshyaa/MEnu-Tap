'use client';

import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  emptyMessage = 'No data found',
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200/50 bg-white/60 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/40">
        <div className="animate-pulse space-y-3 p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/60 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/40">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200/50 dark:border-zinc-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-zinc-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={(item._id as string) || idx}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'border-b border-zinc-100/50 transition-colors dark:border-zinc-800/30',
                    onRowClick && 'cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-sm', col.className)}>
                      {col.render ? col.render(item) : (item[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rejected: 'bg-red-500/10 text-red-600 dark:text-red-400',
    suspended: 'bg-red-500/10 text-red-600 dark:text-red-400',
    expired: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
    cancelled: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
    open: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    closed: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    failed: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', colors[status] || 'bg-zinc-500/10 text-zinc-600')}>
      {status}
    </span>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="text-sm text-zinc-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-zinc-200/50 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700/50"
        >
          Previous
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-zinc-200/50 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700/50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
