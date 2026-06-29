'use client';

import { useEffect, useState, useCallback } from 'react';
import { branchesApi } from '@/lib/api/owner';
import { Plus, MapPin, Phone, Building2 } from 'lucide-react';

interface Branch { _id: string; name: string; code: string; isHeadOffice: boolean; status: string; address: string; city: string; state: string; phone?: string; managerId?: { firstName: string; lastName: string } }

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-zinc-100 text-zinc-600',
  under_renovation: 'bg-amber-100 text-amber-700',
  closed: 'bg-red-100 text-red-700',
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await branchesApi.list();
      setBranches((res as { data: Branch[] }).data ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try { await branchesApi.create(form); setModal(false); load(); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Branch Management</h1>
        <button onClick={() => { setForm({ status: 'active' }); setModal(true); }} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
          <Plus className="h-4 w-4" /> Add Branch
        </button>
      </div>

      {loading ? <div className="flex h-40 items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" /></div> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.length === 0 && <p className="col-span-3 py-12 text-center text-sm text-zinc-500">No branches configured yet</p>}
          {branches.map(b => (
            <div key={b._id} className={`rounded-xl border p-5 ${b.isHeadOffice ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20' : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-zinc-500" />
                    <h3 className="font-semibold text-zinc-900 dark:text-white">{b.name}</h3>
                    {b.isHeadOffice && <span className="rounded-full bg-orange-200 px-2 py-0.5 text-xs font-medium text-orange-800">HQ</span>}
                  </div>
                  <p className="text-xs text-zinc-500">Code: {b.code}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[b.status] ?? ''}`}>
                  {b.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex items-start gap-2 text-xs text-zinc-500"><MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />{b.address}, {b.city}, {b.state}</div>
                {b.phone && <div className="flex items-center gap-2 text-xs text-zinc-500"><Phone className="h-3 w-3" />{b.phone}</div>}
                {b.managerId && <p className="text-xs text-zinc-500">Manager: {b.managerId.firstName} {b.managerId.lastName}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">Add Branch</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {[['name', 'Branch Name *', 'text'], ['code', 'Branch Code *', 'text'], ['address', 'Address *', 'text'], ['city', 'City *', 'text'], ['state', 'State *', 'text'], ['pincode', 'Pincode *', 'text'], ['phone', 'Phone', 'text'], ['email', 'Email', 'email'], ['gstNumber', 'GST Number', 'text'], ['openingTime', 'Opening Time', 'time'], ['closingTime', 'Closing Time', 'time'], ['seatingCapacity', 'Seating Capacity', 'number']].map(([k, l, t]) => (
                <div key={k as string}>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">{l as string}</label>
                  <input type={t as string} value={form[k as string] as string ?? ''} onChange={e => setForm(f => ({ ...f, [k as string]: t === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                </div>
              ))}
              <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                <input type="checkbox" checked={!!form['isHeadOffice']} onChange={e => setForm(f => ({ ...f, isHeadOffice: e.target.checked }))} className="rounded" />
                Is Head Office
              </label>
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
