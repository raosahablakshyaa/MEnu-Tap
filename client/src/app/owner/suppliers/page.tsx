'use client';

import { useEffect, useState, useCallback } from 'react';
import { suppliersApi } from '@/lib/api/owner';
import { Plus, Phone, Mail, Star } from 'lucide-react';

interface Supplier { _id: string; name: string; contactPerson?: string; phone?: string; email?: string; city?: string; rating: number; totalOrders: number; totalValue: number; outstandingBalance: number; isActive: boolean }

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({ paymentTermsDays: 30, rating: 5 });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await suppliersApi.list();
      setSuppliers((res as { data: { items: Supplier[] } }).data.items ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try { await suppliersApi.create(form); setModal(false); load(); } finally { setSaving(false); }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Suppliers</h1>
        <button onClick={() => { setForm({ paymentTermsDays: 30, rating: 5 }); setModal(true); }} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
          <Plus className="h-4 w-4" /> Add Supplier
        </button>
      </div>

      {loading ? <div className="flex h-40 items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" /></div> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.length === 0 && <p className="col-span-3 py-12 text-center text-sm text-zinc-500">No suppliers added yet</p>}
          {suppliers.map(s => (
            <div key={s._id} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">{s.name}</h3>
                  {s.contactPerson && <p className="text-sm text-zinc-500">{s.contactPerson}</p>}
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">{s.rating}</span>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {s.phone && <div className="flex items-center gap-2 text-xs text-zinc-500"><Phone className="h-3 w-3" />{s.phone}</div>}
                {s.email && <div className="flex items-center gap-2 text-xs text-zinc-500"><Mail className="h-3 w-3" />{s.email}</div>}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <div className="text-center"><p className="text-sm font-semibold text-zinc-900 dark:text-white">{s.totalOrders}</p><p className="text-xs text-zinc-500">Orders</p></div>
                <div className="text-center"><p className="text-sm font-semibold text-zinc-900 dark:text-white">{fmt(s.totalValue)}</p><p className="text-xs text-zinc-500">Total</p></div>
                <div className="text-center"><p className={`text-sm font-semibold ${s.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(s.outstandingBalance)}</p><p className="text-xs text-zinc-500">Due</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">Add Supplier</h2>
            <div className="space-y-3">
              {[['name', 'Name *', 'text'], ['contactPerson', 'Contact Person', 'text'], ['phone', 'Phone', 'text'], ['email', 'Email', 'email'], ['address', 'Address', 'text'], ['city', 'City', 'text'], ['gstNumber', 'GST Number', 'text'], ['paymentTermsDays', 'Payment Terms (days)', 'number']].map(([k, l, t]) => (
                <div key={k as string}>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">{l as string}</label>
                  <input type={t as string} value={form[k as string] as string ?? ''} onChange={e => setForm(f => ({ ...f, [k as string]: t === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setModal(false)} className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
