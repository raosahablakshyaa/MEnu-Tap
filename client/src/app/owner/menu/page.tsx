'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Copy, Loader2, Search, Filter } from 'lucide-react';
import { menuApi, categoriesApi } from '@/lib/api/owner';
import { MenuItem, Category } from '@/types/owner';
import { Button } from '@/components/ui/button';
import MenuItemForm from './form';

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = (extra: Record<string, string> = {}) => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (filterCat) params.categoryId = filterCat;
    Object.assign(params, extra);
    menuApi.list(params).then(res => {
      if (res.data) {
        setItems(res.data.items as MenuItem[]);
        setTotal(res.data.total);
      }
    }).catch(() => toast.error('Failed to load menu')).finally(() => setLoading(false));
  };

  useEffect(() => {
    categoriesApi.list().then(res => { if (res.data) setCategories(res.data as Category[]); });
  }, []);

  useEffect(() => { load(); }, [search, filterCat]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    setDeletingId(id);
    try { await menuApi.delete(id); toast.success('Deleted'); load(); }
    catch (e: unknown) { toast.error((e as Error).message || 'Failed'); }
    finally { setDeletingId(null); }
  };

  const handleDuplicate = async (id: string) => {
    try { await menuApi.duplicate(id); toast.success('Duplicated'); load(); }
    catch { toast.error('Failed to duplicate'); }
  };

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (item: MenuItem) => { setEditing(item); setShowForm(true); };

  const foodTypeColor: Record<string, string> = {
    veg: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
    non_veg: 'text-red-600 bg-red-50 dark:bg-red-950/40',
    vegan: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40',
    jain: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
    egg: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40',
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <Button onClick={openCreate} className="gap-2 bg-orange-600 hover:bg-orange-700">
          <Plus size={16} /> Add Item
        </Button>
      </div>

      <p className="text-xs text-zinc-400">{total} items</p>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <MenuItemForm
            item={editing}
            categories={categories}
            onClose={() => setShowForm(false)}
            onSave={() => { setShowForm(false); load(); }}
          />
        )}
      </AnimatePresence>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-700">
          <span className="text-4xl">🍽️</span>
          <p className="mt-3 text-sm text-zinc-500">No menu items yet.</p>
          <Button onClick={openCreate} className="mt-4 gap-2 bg-orange-600 hover:bg-orange-700"><Plus size={16} /> Add Item</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <motion.div key={item._id} layout
              className="group rounded-2xl border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 overflow-hidden">
              {item.images?.[0] && (
                <div className="relative h-40 overflow-hidden">
                  <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {item.isBestSeller && (
                    <span className="absolute top-2 left-2 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">Best Seller</span>
                  )}
                  {item.isOutOfStock && (
                    <span className="absolute top-2 right-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">Out of Stock</span>
                  )}
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">{item.name}</h3>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium capitalize ${foodTypeColor[item.foodType] || ''}`}>
                    {item.foodType.replace('_', ' ')}
                  </span>
                </div>
                {item.description && <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{item.description}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">₹{item.price}</span>
                    {item.discountPrice && <span className="ml-1.5 text-xs text-zinc-400 line-through">₹{item.discountPrice}</span>}
                  </div>
                  <span className={`text-xs font-medium ${item.isAvailable ? 'text-emerald-600' : 'text-zinc-400'}`}>
                    {item.isAvailable ? 'Available' : 'Hidden'}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <button onClick={() => openEdit(item)} className="flex-1 rounded-lg border border-zinc-200 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 flex items-center justify-center gap-1">
                    <Pencil size={12} /> Edit
                  </button>
                  <button onClick={() => handleDuplicate(item._id)} className="rounded-lg border border-zinc-200 p-1.5 text-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => handleDelete(item._id)} disabled={deletingId === item._id}
                    className="rounded-lg border border-red-200 p-1.5 text-red-400 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30">
                    {deletingId === item._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
