'use client';

import { useState } from 'react';
import { Download, FileJson, FileText, Table } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

type ExportType = 'orders' | 'menu' | 'customers' | 'expenses' | 'pos' | 'stock-movements';
type ExportFormat = 'json' | 'csv' | 'excel';

const EXPORTS: Array<{ key: ExportType; label: string; desc: string; hasDates: boolean }> = [
  { key: 'orders', label: 'Orders', desc: 'All orders with status and payment info', hasDates: true },
  { key: 'menu', label: 'Menu Items', desc: 'Complete menu with prices and categories', hasDates: false },
  { key: 'customers', label: 'Customers', desc: 'Customer profiles, visits, and loyalty data', hasDates: false },
  { key: 'expenses', label: 'Expenses', desc: 'All recorded expenses by category', hasDates: true },
  { key: 'pos', label: 'POS Transactions', desc: 'All paid bills with GST breakdown', hasDates: true },
  { key: 'stock-movements', label: 'Stock Movements', desc: 'Full inventory ledger', hasDates: true },
];

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  json: <FileJson className="h-4 w-4" />,
  csv: <FileText className="h-4 w-4" />,
  excel: <Table className="h-4 w-4" />,
};

const FORMAT_LABELS: Record<ExportFormat, string> = { json: 'JSON', csv: 'CSV', excel: 'Excel' };

export default function ExportPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [dates, setDates] = useState({ from: '', to: '' });

  const handleExport = async (type: ExportType, format: ExportFormat) => {
    const key = `${type}-${format}`;
    setLoading(key);
    try {
      const params = new URLSearchParams({ format });
      if (dates.from) params.set('from', dates.from);
      if (dates.to) params.set('to', dates.to);

      const token = apiClient.getAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      const res = await fetch(`${baseUrl}/owner/export/${type}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="(.+)"/);
      const filename = match ? match[1] : `${type}.${format === 'excel' ? 'xlsx' : format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Export Data</h1>
        <p className="text-sm text-zinc-500">Download your restaurant data in JSON, CSV, or Excel format.</p>
      </div>

      {/* Date range filter */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Date Range (for time-based exports)</p>
        <div className="flex gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">From</label>
            <input type="date" value={dates.from} onChange={e => setDates(d => ({ ...d, from: e.target.value }))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">To</label>
            <input type="date" value={dates.to} onChange={e => setDates(d => ({ ...d, to: e.target.value }))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
          </div>
          <button onClick={() => setDates({ from: '', to: '' })}
            className="self-end rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700">
            Clear
          </button>
        </div>
      </div>

      {/* Export cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORTS.map(exp => (
          <div key={exp.key} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">{exp.label}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">{exp.desc}</p>
                {exp.hasDates && dates.from && (
                  <p className="mt-1 text-xs text-orange-600">{dates.from} → {dates.to || 'today'}</p>
                )}
              </div>
              <Download className="h-4 w-4 flex-shrink-0 text-zinc-400" />
            </div>
            <div className="mt-4 flex gap-2">
              {(['json', 'csv', 'excel'] as ExportFormat[]).map(fmt => {
                const key = `${exp.key}-${fmt}`;
                return (
                  <button key={fmt} onClick={() => handleExport(exp.key, fmt)} disabled={loading === key}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                    {loading === key ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" /> : FORMAT_ICONS[fmt]}
                    {FORMAT_LABELS[fmt]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">WhatsApp Share</p>
        <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
          To share your menu or promotions via WhatsApp, go to Analytics → Share on WhatsApp. This generates a pre-filled message link — no WhatsApp Business API required.
        </p>
      </div>
    </div>
  );
}
