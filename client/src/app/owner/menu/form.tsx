'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Loader2, X, Plus, Trash2 } from 'lucide-react';
import { menuApi } from '@/lib/api/owner';
import { MenuItem, Category, Variant, Addon } from '@/types/owner';
import { Button } from '@/components/ui/button';

interface Props {
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

const FOOD_TYPES = ['veg', 'non_veg', 'vegan', 'jain', 'egg'];
const SPICE_LEVELS = ['mild', 'medium', 'hot', 'extra_hot'];

export default function MenuItemForm({ item, categories, onClose, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    categoryId: (typeof item?.categoryId === 'object' ? item.categoryId._id : item?.categoryId) || '',
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    discountPrice: item?.discountPrice || '',
    taxRate: item?.taxRate || 0,
    foodType: item?.foodType || 'veg',
    spiceLevel: item?.spiceLevel || '',
    preparationTime: item?.preparationTime || '',
    calories: item?.calories || '',
    ingredients: '',
    isAvailable: item?.isAvailable !== false,
    isOutOfStock: item?.isOutOfStock || false,
    isBestSeller: item?.isBestSeller || false,
    isChefRecommended: item?.isChefRecommended || false,
    isFeatured: item?.isFeatured || false,
    images: item?.images || [],
  });
  const [variants, setVariants] = useState<Variant[]>(item?.variants || []);
  const [addons, setAddons] = useState<Addon[]>(item?.addons || []);

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const addVariant = () => setVariants(p => [...p, { name: '', price: 0, isAvailable: true }]);
  const removeVariant = (i: number) => setVariants(p => p.filter((_, idx) => idx !== i));
  const updateVariant = (i: number, k: keyof Variant, v: unknown) =>
    setVariants(p => p.map((v2, idx) => idx === i ? { ...v2, [k]: v } : v2));

  const addAddon = () => setAddons(p => [...p, { name: '', price: 0, isAvailable: true }]);
  const removeAddon = (i: number) => setAddons(p => p.filter((_, idx) => idx !== i));
  const updateAddon = (i: number, k: keyof Addon, v: unknown) =>
    setAddons(p => p.map((a, idx) => idx === i ? { ...a, [k]: v } : a));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    if (!form.categoryId) { toast.error('Category required'); return; }
    if (!form.price || form.price <= 0) { toast.error('Price required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, variants, addons };
      if (item) { await menuApi.update(item._id, payload); toast.success('Item updated'); }
      else { await menuApi.create(payload); toast.success('Item created'); }
      onSave();
    } catch (e: unknown) { toast.error((e as Error).message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-8">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 mb-8">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <h2 className="font-semibold">{item ? 'Edit Item' : 'New Menu Item'}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={18} /></button>
        </div>

        <div className="space-y-5 p-6">
          {/* Basic */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <LabelField label="Category *">
                <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className={inputCls}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </LabelField>
            </div>
            <LabelField label="Item Name *">
              <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="e.g. Paneer Butter Masala" />
            </LabelField>
            <LabelField label="Food Type">
              <select value={form.foodType} onChange={e => set('foodType', e.target.value)} className={inputCls}>
                {FOOD_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </LabelField>
            <LabelField label="Price (₹) *">
              <input type="number" value={form.price} onChange={e => set('price', Number(e.target.value))} className={inputCls} min={0} />
            </LabelField>
            <LabelField label="Discount Price (₹)">
              <input type="number" value={form.discountPrice} onChange={e => set('discountPrice', e.target.value ? Number(e.target.value) : '')} className={inputCls} min={0} />
            </LabelField>
            <LabelField label="Tax Rate (%)">
              <input type="number" value={form.taxRate} onChange={e => set('taxRate', Number(e.target.value))} className={inputCls} min={0} max={100} />
            </LabelField>
            <LabelField label="Spice Level">
              <select value={form.spiceLevel} onChange={e => set('spiceLevel', e.target.value)} className={inputCls}>
                <option value="">None</option>
                {SPICE_LEVELS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </LabelField>
            <LabelField label="Prep Time (mins)">
              <input type="number" value={form.preparationTime} onChange={e => set('preparationTime', e.target.value ? Number(e.target.value) : '')} className={inputCls} min={0} />
            </LabelField>
            <LabelField label="Calories">
              <input type="number" value={form.calories} onChange={e => set('calories', e.target.value ? Number(e.target.value) : '')} className={inputCls} min={0} />
            </LabelField>
          </div>

          <LabelField label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className={inputCls} />
          </LabelField>

          {/* Flags */}
          <div className="flex flex-wrap gap-4">
            {([
              ['isAvailable', 'Available'],
              ['isOutOfStock', 'Out of Stock'],
              ['isBestSeller', 'Best Seller'],
              ['isChefRecommended', "Chef's Pick"],
              ['isFeatured', 'Featured'],
            ] as [keyof typeof form, string][]).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                <input type="checkbox" checked={!!form[k]} onChange={e => set(k, e.target.checked)} className="accent-orange-500" />
                {label}
              </label>
            ))}
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Variants</p>
              <button onClick={addVariant} className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700">
                <Plus size={12} /> Add
              </button>
            </div>
            {variants.map((v, i) => (
              <div key={i} className="mb-2 flex items-center gap-2">
                <input value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} placeholder="Name (e.g. Full)" className={`flex-1 ${inputCls}`} />
                <input type="number" value={v.price} onChange={e => updateVariant(i, 'price', Number(e.target.value))} placeholder="Price" className={`w-24 ${inputCls}`} min={0} />
                <button onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          {/* Addons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Add-ons</p>
              <button onClick={addAddon} className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700">
                <Plus size={12} /> Add
              </button>
            </div>
            {addons.map((a, i) => (
              <div key={i} className="mb-2 flex items-center gap-2">
                <input value={a.name} onChange={e => updateAddon(i, 'name', e.target.value)} placeholder="Name (e.g. Extra Cheese)" className={`flex-1 ${inputCls}`} />
                <input type="number" value={a.price} onChange={e => updateAddon(i, 'price', Number(e.target.value))} placeholder="Price" className={`w-24 ${inputCls}`} min={0} />
                <button onClick={() => removeAddon(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700">
            {saving && <Loader2 size={14} className="mr-2 animate-spin" />} Save
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const inputCls = 'w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';

function LabelField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      {children}
    </div>
  );
}
