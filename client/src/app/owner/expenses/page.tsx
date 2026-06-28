'use client';

import { useEffect, useState, useCallback } from 'react';
import { expensesApi } from '@/lib/api/owner';
import { Plus, DollarSign } from 'lucide-react';

interface Expense {
  _id: string; title: string; category: string; totalAmount: number;
  status: string; expenseDate: string; vendorName?: string;
}
interface Summary { byCategory: Array<{ _id: string; total: number; count: number }>; total: number; count: number }

const CATEGORIES = ['rent', 'salaries', 'utilities', 'inventory', 'marketing', 'maintenance', 'equipment', 'packaging', 'delivery', 'taxes', 'insurance', 'software', 'other'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({ category: 'other', status: 'paid', amount: 0, taxAmount: 0 });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [expRes, sumRes] = await Promise.all([expensesApi.list(), expensesApi.summary()]);
      setExpenses((expRes as { data: { items: Expense[] } }).data.items ?? []);
      setSummary((sumRes as { data: Summary }).data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await expensesApi.create({ ...form, expenseDate: form['expenseDate'] || new Date().toISOString() });
      setModal(false);
      load();
    } finally { setSaving(false); }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  if (loading) return <div className="flex h-40 items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Expenses</h1>
        <button onClick={() => { setForm({ category: 'other', status: 'paid', amount: 0, taxAmount: 0, expenseDate: new Date().toISOString().split('T')[0] }); setModal(true); }}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
          <Plus className="h-4 w-4" /> Add Expense
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-red-500" /><span className="text-sm text-zinc-500">Total Expenses</span></div>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">{fmt(summary.total)}</p>
            <p className="text-xs text-zinc-500">{summary.count} records</p>
          </div>
          <div className="sm:col-span-2 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">By Category</p>
            <div className="grid grid-cols-2 gap-2">
              {summary.byCategory.slice(0, 6).map(cat => (
                <div key={cat._id} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-zinc-600 dark:text-zinc-400">{cat._id}</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{fmt(cat.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              {['Title', 'Category', 'Vendor', 'Date', 'Amount', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {expenses.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-sm text-zinc-500">No expenses recorded yet</td></tr>}
            {expenses.map(exp => (
              <tr key={exp._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{exp.title}</td>
                <td className="px-4 py-3 text-sm capitalize text-zinc-500">{exp.category}</td>
                <td className="px-4 py-3 text-sm text-zinc-500">{exp.vendorName || '—'}</td>
                <td className="px-4 py-3 text-sm text-zinc-500">{new Date(exp.expenseDate).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3 text-sm font-semibold text-red-600">{fmt(exp.totalAmount)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${exp.status === 'paid' ? 'bg-green-100 text-green-700' : exp.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-zinc-100 text-zinc-600'}`}>
                    {exp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">Add Expense</h2>
            <div className="space-y-3">
              {[['title', 'Title', 'text'], ['vendorName', 'Vendor Name', 'text'], ['amount', 'Amount (₹)', 'number'], ['taxAmount', 'Tax Amount (₹)', 'number'], ['invoiceNumber', 'Invoice #', 'text']].map(([k, l, t]) => (
                <div key={k as string}>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">{l as string}</label>
                  <input type={t as string} value={form[k as string] as string ?? ''} onChange={e => setForm(f => ({ ...f, [k as string]: t === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Category</label>
                <select value={form['category'] as string} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Expense Date</label>
                <input type="date" value={form['expenseDate'] as string} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setModal(false)} className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
