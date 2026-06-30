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
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ currentStock: 0, minimumStock: 0, reorderPoint: 0, unitCost: 0, unit: 'kg', category: 'other' }); setModal('create'); };
  const openAdjust = (ing: Ingredient) => { setSelected(ing); setForm({ quantity: 0, type: 'adjustment', notes: '' }); setModal('adjust'); };

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'create') await inventoryApi.create(form);
      else if (modal === 'adjust' && selected) await inventoryApi.adjustStock(selected._id, form);
      setModal(null); load();
    } finally { setSaving(false); }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const stockStatus = (ing: Ingredient) => {
    if (ing.currentStock === 0) return { label: 'Out of Stock', bg: '#fee2e2', color: '#991b1b' };
    if (ing.currentStock <= ing.reorderPoint) return { label: 'Low Stock', bg: '#fef3c7', color: '#92400e' };
    return { label: 'In Stock', bg: '#d1fae5', color: '#065f46' };
  };

  const inputCls = 'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors';
  const inputStyle = { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>Inventory Management</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>Track ingredients, stock levels and valuation</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--primary)' }}
        >
          <Plus className="h-4 w-4" /> Add Ingredient
        </button>
      </div>

      {/* Valuation Summary */}
      {valuation && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Value',   value: fmt(valuation.summary.totalValue), bg: 'var(--surface)', border: 'var(--border)', color: 'var(--foreground)' },
            { label: 'Total Items',   value: String(valuation.summary.totalItems), bg: 'var(--surface)', border: 'var(--border)', color: 'var(--foreground)' },
            { label: 'Low Stock',     value: String(valuation.summary.lowStock), bg: '#fef3c7', border: '#fde68a', color: '#92400e' },
            { label: 'Out of Stock',  value: String(valuation.summary.outOfStock), bg: '#fee2e2', border: '#fecaca', color: '#991b1b' },
          ].map(({ label, value, bg, border, color }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
              <p className="text-xs font-medium" style={{ color }}>{label}</p>
              <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search ingredients..."
          value={filter.search}
          onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors"
          style={inputStyle}
        />
        <button
          onClick={() => setFilter(f => ({ ...f, lowStock: !f.lowStock }))}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          style={filter.lowStock
            ? { background: '#fef3c7', borderColor: '#fbbf24', color: '#92400e' }
            : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground-muted)' }
          }
        >
          <AlertTriangle className="h-4 w-4" /> Low Stock
        </button>
        <button
          onClick={() => load()}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 skeleton" />)}
        </div>
      ) : (
        <div className="content-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                {['Ingredient', 'Category', 'Stock', 'Unit', 'Unit Cost', 'Value', 'Status', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ingredients.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Package className="mx-auto mb-2 h-8 w-8" style={{ color: 'var(--border-strong)' }} />
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>No ingredients yet. Add your first ingredient!</p>
                  </td>
                </tr>
              )}
              {ingredients.map(ing => {
                const status = stockStatus(ing);
                return (
                  <tr key={ing._id}>
                    <td className="font-medium" style={{ color: 'var(--foreground)' }}>{ing.name}</td>
                    <td className="capitalize" style={{ color: 'var(--foreground-muted)' }}>{ing.category}</td>
                    <td className="font-semibold" style={{ color: 'var(--foreground)' }}>{ing.currentStock}</td>
                    <td style={{ color: 'var(--foreground-muted)' }}>{ing.unit}</td>
                    <td style={{ color: 'var(--foreground-muted)' }}>{fmt(ing.averageCost)}</td>
                    <td style={{ color: 'var(--foreground-muted)' }}>{fmt(ing.currentStock * ing.averageCost)}</td>
                    <td>
                      <span className="badge" style={{ background: status.bg, color: status.color }}>{status.label}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => openAdjust(ing)}
                        className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors hover:opacity-80"
                        style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)', background: 'var(--surface-raised)' }}
                      >
                        <TrendingDown className="h-3 w-3" /> Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-xl p-6 shadow-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="mb-5 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {modal === 'create' ? 'Add Ingredient' : `Adjust Stock — ${selected?.name}`}
            </h2>

            {modal === 'create' && (
              <div className="space-y-3">
                {([['name', 'Name', 'text'], ['currentStock', 'Opening Stock', 'number'], ['minimumStock', 'Minimum Stock', 'number'], ['reorderPoint', 'Reorder Point', 'number'], ['unitCost', 'Unit Cost (₹)', 'number']] as [string, string, string][]).map(([k, l, t]) => (
                  <div key={k}>
                    <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>{l}</label>
                    <input type={t} value={form[k] as string ?? ''}
                      onChange={e => setForm(f => ({ ...f, [k]: t === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                      className={inputCls} style={inputStyle} />
                  </div>
                ))}
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>Unit</label>
                  <select value={form['unit'] as string} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className={inputCls} style={inputStyle}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>Category</label>
                  <select value={form['category'] as string} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className={inputCls} style={inputStyle}>
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            {modal === 'adjust' && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>Adjustment Type</label>
                  <select value={form['type'] as string} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className={inputCls} style={inputStyle}>
                    {['adjustment', 'waste', 'purchase', 'transfer_in', 'transfer_out'].map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>Quantity</label>
                  <input type="number" min="0" value={form['quantity'] as number}
                    onChange={e => setForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))}
                    className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>Notes</label>
                  <input type="text" value={form['notes'] as string}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 rounded-lg border py-2 text-sm font-medium transition-colors hover:opacity-80"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)', background: 'var(--surface-raised)' }}
              >Cancel</button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 rounded-lg py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--primary)' }}
              >{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
