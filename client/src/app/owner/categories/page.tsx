'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, GripVertical } from 'lucide-react';
import { categoriesApi } from '@/lib/api/owner';
import { Category } from '@/types/owner';
import { Button } from '@/components/ui/button';

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    categoriesApi.list().then(res => {
      if (res.data) setCats(res.data as Category[]);
    }).catch(() => toast.error('Failed to load categories')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', isActive: true }); setShowForm(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, description: c.description || '', isActive: c.isActive }); setShowForm(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await categoriesApi.update(editing._id, form);
        toast.success('Category updated');
      } else {
        await categoriesApi.create(form);
        toast.success('Category created');
      }
      setShowForm(false);
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await categoriesApi.delete(id);
      toast.success('Deleted');
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Cannot delete');
    } finally { setDeletingId(null); }
  };

  const toggleActive = async (cat: Category) => {
    try {
      await categoriesApi.update(cat._id, { isActive: !cat.isActive });
      load();
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{cats.length} categories</p>
        <Button onClick={openCreate} className="gap-2 bg-orange-600 hover:bg-orange-700">
          <Plus size={16} /> Add Category
        </Button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="mb-4 text-base font-semibold">{editing ? 'Edit Category' : 'New Category'}</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Name *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" placeholder="e.g. Starters" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="accent-orange-500" />
                  <label htmlFor="isActive" className="text-sm text-zinc-600 dark:text-zinc-400">Active</label>
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <Button onClick={handleSubmit} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700">
                  {saving && <Loader2 size={14} className="mr-2 animate-spin" />} Save
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />)}
        </div>
      ) : cats.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-700">
          <FolderEmptyIcon />
          <p className="mt-3 text-sm text-zinc-500">No categories yet. Add your first one.</p>
          <Button onClick={openCreate} className="mt-4 gap-2 bg-orange-600 hover:bg-orange-700"><Plus size={16} /> Add Category</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {cats.map(cat => (
            <motion.div key={cat._id} layout
              className="flex items-center gap-3 rounded-xl border border-zinc-200/60 bg-white p-4 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
              <GripVertical size={16} className="shrink-0 cursor-grab text-zinc-300" />
              {cat.image && <img src={cat.image} alt={cat.name} className="h-10 w-10 rounded-lg object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{cat.name}</p>
                {cat.description && <p className="truncate text-xs text-zinc-400">{cat.description}</p>}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cat.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
                {cat.isActive ? 'Active' : 'Hidden'}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleActive(cat)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" title={cat.isActive ? 'Hide' : 'Show'}>
                  {cat.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button onClick={() => openEdit(cat)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(cat._id)} disabled={deletingId === cat._id}
                  className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                  {deletingId === cat._id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function FolderEmptyIcon() {
  return <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-2xl">📁</div>;
}
