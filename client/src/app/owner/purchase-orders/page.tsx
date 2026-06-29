'use client';

import { useEffect, useState, useCallback } from 'react';
import { purchaseOrdersApi, suppliersApi } from '@/lib/api/owner';
import { Plus, ChevronRight } from 'lucide-react';

interface PO { _id: string; poNumber: string; supplierName: string; status: string; totalAmount: number; expectedDelivery?: string; createdAt: string }
interface Supplier { _id: string; name: string }

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  sent: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  partial: 'bg-amber-100 text-amber-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function PurchaseOrdersPage() {
  const [pos, setPOs] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({ items: [] });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [poRes, supRes] = await Promise.all([purchaseOrdersApi.list(), suppliersApi.list()]);
      setPOs((poRes as { data: { items: PO[] } }).data.items ?? []);
      setSuppliers((supRes as { data: { items: Supplier[] } }).data.items ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try { await purchaseOrdersApi.create(form); setModal(false); load(); } finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await purchaseOrdersApi.updateStatus(id, status);
    load();
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Purchase Orders</h1>
        <button onClick={() => { setForm({ items: [], supplierId: suppliers[0]?._id }); setModal(true); }} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
          <Plus className="h-4 w-4" /> New PO
        </button>
      </div>

      {loading ? <div className="flex h-40 items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" /></div> : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                {['PO Number', 'Supplier', 'Amount', 'Expected', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {pos.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-sm text-zinc-500">No purchase orders yet</td></tr>}
              {pos.map(po => (
                <tr key={po._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="px-4 py-3 font-mono text-sm font-medium text-zinc-900 dark:text-white">{po.poNumber}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{po.supplierName}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-white">{fmt(po.totalAmount)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[po.status] ?? 'bg-zinc-100 text-zinc-600'}`}>{po.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {po.status === 'draft' && (
                      <button onClick={() => updateStatus(po._id, 'sent')} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        Send <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                    {po.status === 'confirmed' && (
                      <button onClick={() => updateStatus(po._id, 'received')} className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                        Receive <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">New Purchase Order</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Supplier</label>
                <select value={form['supplierId'] as string} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Expected Delivery</label>
                <input type="date" value={form['expectedDelivery'] as string ?? ''} onChange={e => setForm(f => ({ ...f, expectedDelivery: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Notes</label>
                <textarea value={form['notes'] as string ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
              <p className="text-xs text-zinc-500">Items can be added after creating the PO from the detail view.</p>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setModal(false)} className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
              <button onClick={save} disabled={saving || !form['supplierId']} className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">{saving ? 'Creating...' : 'Create PO'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
