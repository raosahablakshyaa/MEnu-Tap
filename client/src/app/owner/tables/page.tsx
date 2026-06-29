'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Loader2, Layers } from 'lucide-react';
import { tablesApi } from '@/lib/api/owner';
import { Table, TableStatus } from '@/types/owner';
import { Button } from '@/components/ui/button';

const STATUS_COLORS: Record<TableStatus, string> = {
  available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  occupied: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  reserved: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  cleaning: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  disabled: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800',
};

export default function TablesPage() {
  const [data, setData] = useState<{ tables: Table[]; floors: Record<string, { floorName: string; tables: Table[] }> }>({ tables: [], floors: {} });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editing, setEditing] = useState<Table | null>(null);
  const [form, setForm] = useState({ tableNumber: '', displayName: '', floor: 0, floorName: 'Ground Floor', capacity: 4 });
  const [bulkForm, setBulkForm] = useState([{ floorNumber: 0, floorName: 'Ground Floor', tableCount: 10, startNumber: 1 }]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    tablesApi.list().then(res => { if (res.data) setData(res.data as unknown as typeof data); })
      .catch(() => toast.error('Failed to load tables')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (t: Table) => { setEditing(t); setForm({ tableNumber: t.tableNumber, displayName: t.displayName, floor: t.floor, floorName: t.floorName || '', capacity: t.capacity }); setShowForm(true); };
  const openCreate = () => { setEditing(null); setForm({ tableNumber: '', displayName: '', floor: 0, floorName: 'Ground Floor', capacity: 4 }); setShowForm(true); };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editing) { await tablesApi.update(editing._id, form); toast.success('Table updated'); }
      else { await tablesApi.create(form); toast.success('Table created'); }
      setShowForm(false); load();
    } catch (e: unknown) { toast.error((e as Error).message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleBulk = async () => {
    setSaving(true);
    try {
      await tablesApi.bulkCreate({ floors: bulkForm });
      toast.success('Tables created');
      setShowBulk(false); load();
    } catch (e: unknown) { toast.error((e as Error).message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete table?')) return;
    setDeletingId(id);
    try { await tablesApi.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); } finally { setDeletingId(null); }
  };

  const handleStatusUpdate = async (id: string, status: TableStatus) => {
    try { await tablesApi.update(id, { status }); load(); }
    catch { toast.error('Failed'); }
  };

  const floors = Object.entries(data.floors).sort(([a], [b]) => Number(a) - Number(b));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-zinc-500 flex-1">{data.tables.length} tables</p>
        <Button variant="outline" onClick={() => setShowBulk(true)} className="gap-2">
          <Layers size={16} /> Bulk Create
        </Button>
        <Button onClick={openCreate} className="gap-2 bg-orange-600 hover:bg-orange-700">
          <Plus size={16} /> Add Table
        </Button>
      </div>

      {/* Single Form */}
      <AnimatePresence>
        {showForm && (
          <Modal title={editing ? 'Edit Table' : 'New Table'} onClose={() => setShowForm(false)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <LF label="Table Number"><input value={form.tableNumber} onChange={e => setForm(p => ({ ...p, tableNumber: e.target.value }))} className={ic} /></LF>
              <LF label="Display Name"><input value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} className={ic} /></LF>
              <LF label="Floor Number"><input type="number" value={form.floor} onChange={e => setForm(p => ({ ...p, floor: Number(e.target.value) }))} className={ic} min={0} /></LF>
              <LF label="Floor Name"><input value={form.floorName} onChange={e => setForm(p => ({ ...p, floorName: e.target.value }))} className={ic} /></LF>
              <LF label="Capacity"><input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))} className={ic} min={1} /></LF>
            </div>
            <div className="mt-4 flex gap-3">
              <Button onClick={handleSubmit} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700">
                {saving && <Loader2 size={14} className="mr-2 animate-spin" />} Save
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Bulk Form */}
      <AnimatePresence>
        {showBulk && (
          <Modal title="Bulk Create Tables" onClose={() => setShowBulk(false)}>
            <p className="mb-3 text-xs text-zinc-500">Define floors and table counts. Tables will be auto-numbered.</p>
            {bulkForm.map((f, i) => (
              <div key={i} className="mb-3 grid gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700 sm:grid-cols-4">
                <LF label="Floor #"><input type="number" value={f.floorNumber} onChange={e => setBulkForm(p => p.map((x, j) => j === i ? { ...x, floorNumber: Number(e.target.value) } : x))} className={ic} min={0} /></LF>
                <LF label="Floor Name"><input value={f.floorName} onChange={e => setBulkForm(p => p.map((x, j) => j === i ? { ...x, floorName: e.target.value } : x))} className={ic} /></LF>
                <LF label="# Tables"><input type="number" value={f.tableCount} onChange={e => setBulkForm(p => p.map((x, j) => j === i ? { ...x, tableCount: Number(e.target.value) } : x))} className={ic} min={1} /></LF>
                <LF label="Start #"><input type="number" value={f.startNumber} onChange={e => setBulkForm(p => p.map((x, j) => j === i ? { ...x, startNumber: Number(e.target.value) } : x))} className={ic} min={1} /></LF>
              </div>
            ))}
            <button onClick={() => setBulkForm(p => [...p, { floorNumber: p.length, floorName: `Floor ${p.length}`, tableCount: 5, startNumber: p.length * 100 + 1 }])}
              className="mb-4 flex items-center gap-1 text-xs text-orange-600">
              <Plus size={12} /> Add Floor
            </button>
            <div className="flex gap-3">
              <Button onClick={handleBulk} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700">
                {saving && <Loader2 size={14} className="mr-2 animate-spin" />} Create Tables
              </Button>
              <Button variant="outline" onClick={() => setShowBulk(false)} className="flex-1">Cancel</Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Tables by floor */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />)}
        </div>
      ) : floors.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-700">
          <span className="text-4xl">🪑</span>
          <p className="mt-3 text-sm text-zinc-500">No tables yet. Use Bulk Create to set up your floors.</p>
        </div>
      ) : (
        floors.map(([floorNum, floorData]) => (
          <div key={floorNum}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">{floorData.floorName}</h3>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {floorData.tables.map(t => (
                <motion.div key={t._id} layout className="rounded-xl border border-zinc-200/60 bg-white p-3 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-zinc-400">Table</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t.tableNumber}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">Capacity: {t.capacity}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <select value={t.status} onChange={e => handleStatusUpdate(t._id, e.target.value as TableStatus)}
                      className="flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-1 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                      {(['available', 'occupied', 'reserved', 'cleaning', 'disabled'] as TableStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => openEdit(t)} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(t._id)} disabled={deletingId === t._id} className="rounded-md p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                      {deletingId === t._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const ic = 'w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';

function LF({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</label>{children}</div>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-semibold">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  );
}
