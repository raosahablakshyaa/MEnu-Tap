'use client';

import { useEffect, useState, useCallback } from 'react';
import { inventoryApi } from '@/lib/api/owner';
import { Plus, AlertTriangle, Package, RefreshCw, TrendingDown } from 'lucide-react';

interface Ingredient {
  _id: string; name: string; category: string; unit: string;
  currentStock: number; minimumStock: number; reorderPoint: number;
  unitCost: number; averageCost: number; isActive: boolean;
}

interface Valuation {
  summary: { totalValue: number; totalItems: number; lowStock: number; outOfStock: number };
  byCategory: Array<{ _id: string; totalItems: number; totalValue: number; lowStockCount: number }>;
}

type ModalMode = 'create' | 'adjust' | null;

const UNITS = ['kg', 'g', 'l', 'ml', 'pcs', 'dozen', 'pack', 'box', 'bottle', 'can'];
const CATEGORIES = ['produce', 'dairy', 'meat', 'seafood', 'bakery', 'beverage', 'spice', 'oil', 'grain', 'other'];

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState({ search: '', lowStock: false });

  const load = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (filter.search) params.search = filter.search;
      if (filter.lowStock) params.lowStock = 'true';
      const [ingRes, valRes] = await Promise.all([inventoryApi.list(params), inventoryApi.valuation()]);
      setIngredients((ingRes as { data: { items: Ingredient[] } }).data.items ?? []);
      setValuation((valRes as { data: Valuation }).data);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ currentStock: 0, minimumStock: 0, reorderPoint: 0, unitCost: 0, unit: 'kg', category: 'other' }); setModal('create'); };
  const openAdjust = (ing: Ingredient) => { setSelected(ing); setForm({ quantity: 0, type: 'adjustment', notes: '' }); setModal('adjust'); };

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'create') await inventoryApi.create(form);
      else if (modal === 'adjust' && selected) await inventoryApi.adjustStock(selected._id, form);
      setModal(null);
      load();
    } finally { setSaving(false); }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const stockColor = (ing: Ingredient) => {
    if (ing.currentStock === 0) return 'text-red-600 bg-red-50';
    if (ing.currentStock <= ing.reorderPoint) return 'text-amber-600 bg-amber-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Inventory Management</h1>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
          <Plus className="h-4 w-4" /> Add Ingredient
        </button>
      </div>

      {/* Valuation Summary */}
      {valuation && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500">Total Value</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{fmt(valuation.summary.totalValue)}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500">Total Items</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{valuation.summary.totalItems}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-xs text-amber-600">Low Stock</p>
            <p className="text-xl font-bold text-amber-700">{valuation.summary.lowStock}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-xs text-red-600">Out of Stock</p>
            <p className="text-xl font-bold text-red-700">{valuation.summary.outOfStock}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search ingredients..."
          value={filter.search}
          onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
        <button
          onClick={() => setFilter(f => ({ ...f, lowStock: !f.lowStock }))}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${filter.lowStock ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50'}`}
        >
          <AlertTriangle className="h-4 w-4" /> Low Stock
        </button>
        <button onClick={() => load()} className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                {['Ingredient', 'Category', 'Stock', 'Unit', 'Unit Cost', 'Value', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {ingredients.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-zinc-500">
                  <Package className="mx-auto mb-2 h-8 w-8 text-zinc-300" />No ingredients yet. Add your first ingredient!
                </td></tr>
              )}
              {ingredients.map(ing => (
                <tr key={ing._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{ing.name}</td>
                  <td className="px-4 py-3 text-sm capitalize text-zinc-500">{ing.category}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{ing.currentStock}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{ing.unit}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{fmt(ing.averageCost)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{fmt(ing.currentStock * ing.averageCost)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stockColor(ing)}`}>
                      {ing.currentStock === 0 ? 'Out of Stock' : ing.currentStock <= ing.reorderPoint ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openAdjust(ing)} className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700">
                      <TrendingDown className="h-3 w-3" /> Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">
              {modal === 'create' ? 'Add Ingredient' : `Adjust Stock — ${selected?.name}`}
            </h2>

            {modal === 'create' && (
              <div className="space-y-3">
                {[['name', 'Name', 'text'], ['currentStock', 'Opening Stock', 'number'], ['minimumStock', 'Minimum Stock', 'number'], ['reorderPoint', 'Reorder Point', 'number'], ['unitCost', 'Unit Cost (₹)', 'number']].map(([k, l, t]) => (
                  <div key={k as string}>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">{l as string}</label>
                    <input type={t as string} value={form[k as string] as string ?? ''} onChange={e => setForm(f => ({ ...f, [k as string]: t === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                ))}
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Unit</label>
                  <select value={form['unit'] as string} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Category</label>
                  <select value={form['category'] as string} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            {modal === 'adjust' && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Adjustment Type</label>
                  <select value={form['type'] as string} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    {['adjustment', 'waste', 'purchase', 'transfer_in', 'transfer_out'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Quantity</label>
                  <input type="number" min="0" value={form['quantity'] as number} onChange={e => setForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Notes</label>
                  <input type="text" value={form['notes'] as string} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancel</button>
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
