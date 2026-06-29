'use client';

import { useState } from 'react';
import { AdminHeader } from '@/components/admin/header';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'sonner';
import { Download, FileText } from 'lucide-react';

const reportTypes = [
  { id: 'restaurants', label: 'Restaurant Report', fn: () => adminApi.reports.restaurants() },
  { id: 'subscriptions', label: 'Subscription Report', fn: () => adminApi.reports.subscriptions() },
  { id: 'customers', label: 'Customer Report', fn: () => adminApi.reports.customers() },
  { id: 'support', label: 'Support Report', fn: () => adminApi.reports.support() },
];

export default function ReportsPage() {
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async (type: typeof reportTypes[0]) => {
    setLoading(true);
    try {
      const res = await type.fn();
      if (res.data) {
        setReport(res.data as Record<string, unknown>);
        toast.success(`${type.label} generated`);
      }
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(false); }
  };

  const downloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.json';
    a.click();
  };

  return (
    <div>
      <AdminHeader title="Reports" />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => generateReport(type)}
              disabled={loading}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200/50 bg-white/60 p-5 text-left backdrop-blur-xl transition-all hover:border-orange-500/30 dark:border-zinc-800/50 dark:bg-zinc-900/40"
            >
              <FileText size={24} className="text-orange-500" />
              <span className="font-medium">{type.label}</span>
            </button>
          ))}
        </div>

        {report && (
          <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-5 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/40">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Report Preview</h3>
              <Button size="sm" variant="outline" onClick={downloadJson}>
                <Download size={16} className="mr-2" /> Download JSON
              </Button>
            </div>
            <pre className="max-h-96 overflow-auto rounded-lg bg-zinc-100/50 p-4 text-xs dark:bg-zinc-800/50">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
