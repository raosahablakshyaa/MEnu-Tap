'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, RefreshCw, Trash2, Download, Loader2, Zap,
  Power, PowerOff, Printer, BarChart2, X, Calendar, CheckCircle2,
} from 'lucide-react';
import { qrApi, tablesApi } from '@/lib/api/owner';
import { apiClient } from '@/lib/api/client';
import type { QrCode as QrCodeType, Table } from '@/types/owner';
import { Button } from '@/components/ui/button';

// ── Types ─────────────────────────────────────────────────────────────────────
interface QrAnalytics {
  totalScans: number;
  activeCount: number;
  totalQrCodes: number;
  topScanned: { tableNumber: string; scansCount: number; lastScannedAt?: string; lastDevice?: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function svgToPngDataUrl(svgString: string, size = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function QrPage() {
  const [qrCodes, setQrCodes] = useState<QrCodeType[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [preview, setPreview] = useState<QrCodeType | null>(null);
  const [analytics, setAnalytics] = useState<QrAnalytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [expiryModal, setExpiryModal] = useState<QrCodeType | null>(null);
  const [expiryDate, setExpiryDate] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([qrApi.list(), tablesApi.list()])
      .then(([q, t]) => {
        if (q.data) setQrCodes(q.data as QrCodeType[]);
        if (t.data) setTables(t.data.tables as Table[]);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await apiClient.get<QrAnalytics>('/owner/qr/analytics');
      setAnalytics(res.data);
    } catch { toast.error('Failed to load analytics'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleGenerateAll = async () => {
    setGeneratingAll(true);
    try { await qrApi.generateAll(); toast.success('QR codes generated for all tables'); load(); }
    catch (e: unknown) { toast.error((e as Error).message); }
    finally { setGeneratingAll(false); }
  };

  const handleGenerate = async (tableId: string) => {
    setActionId(tableId);
    try { await qrApi.generate(tableId); toast.success('QR generated'); load(); }
    catch (e: unknown) { toast.error((e as Error).message); }
    finally { setActionId(null); }
  };

  const handleRegenerate = async (qrId: string) => {
    setActionId(qrId);
    try { await qrApi.regenerate(qrId); toast.success('QR regenerated'); load(); }
    catch { toast.error('Failed'); }
    finally { setActionId(null); }
  };

  const handleDelete = async (qrId: string) => {
    if (!confirm('Delete this QR code? It cannot be undone.')) return;
    setActionId(qrId);
    try { await qrApi.delete(qrId); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
    finally { setActionId(null); }
  };

  const handleToggleActive = async (qr: QrCodeType) => {
    setActionId(qr._id);
    try {
      if (qr.isActive) {
        await apiClient.put(`/owner/qr/${qr._id}/deactivate`);
        toast.success('QR deactivated');
      } else {
        await apiClient.put(`/owner/qr/${qr._id}/activate`);
        toast.success('QR activated');
      }
      load();
    } catch { toast.error('Failed'); }
    finally { setActionId(null); }
  };

  const handleSetExpiry = async () => {
    if (!expiryModal || !expiryDate) return;
    setActionId(expiryModal._id);
    try {
      await apiClient.put(`/owner/qr/${expiryModal._id}/expiry`, { expiresAt: new Date(expiryDate).toISOString() });
      toast.success('Expiry set');
      setExpiryModal(null); setExpiryDate('');
      load();
    } catch { toast.error('Failed to set expiry'); }
    finally { setActionId(null); }
  };

  // ── Downloads ─────────────────────────────────────────────────────────────
  const downloadSvg = (qr: QrCodeType) => {
    if (!qr.svgData) { toast.error('No SVG available'); return; }
    downloadBlob(new Blob([qr.svgData], { type: 'image/svg+xml' }), `qr-table-${qr.tableNumber}.svg`);
  };

  const downloadPng = async (qr: QrCodeType) => {
    if (!qr.svgData) { toast.error('No SVG available'); return; }
    setActionId(qr._id + '_png');
    try {
      const dataUrl = await svgToPngDataUrl(qr.svgData, 600);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      downloadBlob(blob, `qr-table-${qr.tableNumber}.png`);
    } catch { toast.error('PNG export failed'); }
    finally { setActionId(null); }
  };

  const downloadAllZip = async () => {
    const active = qrCodes.filter(q => q.svgData);
    if (!active.length) { toast.error('No QR codes to export'); return; }
    toast.info(`Downloading ${active.length} QR codes as individual PNGs…`);
    for (const qr of active) {
      if (qr.svgData) await downloadPng(qr);
    }
  };

  const printAll = () => {
    const content = qrCodes
      .filter(q => q.svgData && q.isActive)
      .map(q => {
        const tableInfo = typeof q.tableId === 'object' ? q.tableId as Table : null;
        return `
          <div class="qr-item">
            ${q.svgData}
            <p class="label">Table ${q.tableNumber}</p>
            ${tableInfo?.floorName ? `<p class="floor">${tableInfo.floorName}</p>` : ''}
            <p class="url">${q.url}</p>
          </div>`;
      }).join('');

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>QR Codes — TapMenu</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .qr-item { text-align: center; border: 1px solid #e5e5e5; border-radius: 12px; padding: 16px; break-inside: avoid; }
        .qr-item svg { width: 160px; height: 160px; }
        .label { font-size: 14px; font-weight: bold; margin: 8px 0 2px; }
        .floor { font-size: 11px; color: #888; margin: 0 0 4px; }
        .url { font-size: 8px; color: #aaa; word-break: break-all; }
        @media print { body { padding: 0; } }
      </style></head>
      <body><div class="grid">${content}</div>
      <script>window.onload = () => { window.print(); window.close(); }</script>
      </body></html>`);
    win.document.close();
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const qrTableIds = new Set(qrCodes.map(q =>
    (typeof q.tableId === 'object' ? (q.tableId as Table)._id : q.tableId)
  ));
  const tablesWithoutQr = tables.filter(t => !qrTableIds.has(t._id));

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="grid gap-3 xl:flex xl:items-center">
        <p className="text-sm text-zinc-500 xl:flex-1">
          {qrCodes.length} QR codes · {tablesWithoutQr.length} tables without QR ·{' '}
          {qrCodes.filter(q => q.isActive).length} active
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button variant="outline" onClick={() => { setShowAnalytics(true); loadAnalytics(); }} className="gap-2">
            <BarChart2 size={16} /> Analytics
          </Button>
          <Button variant="outline" onClick={printAll} className="gap-2">
            <Printer size={16} /> Print All
          </Button>
          <Button variant="outline" onClick={downloadAllZip} className="gap-2">
            <Download size={16} /> Export All
          </Button>
          <Button onClick={handleGenerateAll} disabled={generatingAll} className="gap-2 bg-orange-600 hover:bg-orange-700">
            {generatingAll ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            Generate All
          </Button>
        </div>
      </div>

      {/* Tables without QR */}
      {tablesWithoutQr.length > 0 && (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
          <p className="mb-3 text-sm font-medium text-amber-800 dark:text-amber-300">
            {tablesWithoutQr.length} tables need QR codes
          </p>
          <div className="flex flex-wrap gap-2">
            {tablesWithoutQr.map(t => (
              <button key={t._id} onClick={() => handleGenerate(t._id)} disabled={actionId === t._id}
                className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-orange-50 hover:text-orange-700 dark:bg-zinc-800 dark:text-zinc-300">
                {actionId === t._id ? <Loader2 size={12} className="animate-spin" /> : <QrCode size={12} />}
                Table {t.tableNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QR Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />)}
        </div>
      ) : qrCodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-700">
          <QrCode size={40} className="text-zinc-300" />
          <p className="mt-3 text-sm text-zinc-500">No QR codes yet. Click &quot;Generate All&quot; to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {qrCodes.map(qr => {
            const tableInfo = typeof qr.tableId === 'object' ? qr.tableId as Table : null;
            return (
              <motion.div key={qr._id} layout
                className="rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
                {/* QR Preview */}
                <div className="relative flex cursor-pointer items-center justify-center rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800"
                  onClick={() => setPreview(qr)}>
                  {qr.svgData
                    ? <div className={`h-32 w-32 overflow-hidden transition-opacity [&_svg]:h-full [&_svg]:w-full ${!qr.isActive ? 'opacity-40 grayscale' : ''}`}
                        dangerouslySetInnerHTML={{ __html: qr.svgData }} />
                    : <QrCode size={80} className="text-zinc-300" />
                  }
                  {!qr.isActive && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-900/40">
                      <span className="rounded-full bg-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-300">INACTIVE</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">Table {qr.tableNumber}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${qr.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
                      {qr.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {tableInfo && <p className="text-xs text-zinc-400">{tableInfo.floorName || `Floor ${tableInfo.floor}`}</p>}
                  <div className="mt-1 flex gap-3 text-xs text-zinc-400">
                    <span>👁 {qr.scansCount} scans</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {/* Download SVG */}
                  <button onClick={() => downloadSvg(qr)} title="Download SVG"
                    className="flex items-center justify-center gap-1 rounded-lg border border-zinc-200 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    <Download size={11} /> SVG
                  </button>
                  {/* Download PNG */}
                  <button onClick={() => downloadPng(qr)} disabled={actionId === qr._id + '_png'}
                    title="Download PNG"
                    className="flex items-center justify-center gap-1 rounded-lg border border-zinc-200 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    {actionId === qr._id + '_png' ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />} PNG
                  </button>
                  {/* Regenerate */}
                  <button onClick={() => handleRegenerate(qr._id)} disabled={actionId === qr._id}
                    title="Regenerate (rotates token)"
                    className="flex items-center justify-center gap-1 rounded-lg border border-zinc-200 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    {actionId === qr._id ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />} Regen
                  </button>
                  {/* Toggle active */}
                  <button onClick={() => handleToggleActive(qr)} disabled={actionId === qr._id}
                    title={qr.isActive ? 'Deactivate' : 'Activate'}
                    className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-medium transition ${qr.isActive ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'} dark:border-zinc-700`}>
                    {qr.isActive ? <PowerOff size={11} /> : <Power size={11} />}
                    {qr.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  {/* Set expiry */}
                  <button onClick={() => { setExpiryModal(qr); setExpiryDate(''); }}
                    className="flex items-center justify-center gap-1 rounded-lg border border-zinc-200 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    <Calendar size={11} /> Expiry
                  </button>
                  {/* Delete */}
                  <button onClick={() => handleDelete(qr._id)} disabled={actionId === qr._id}
                    className="flex items-center justify-center gap-1 rounded-lg border border-red-200 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* QR Preview Modal */}
      <AnimatePresence>
        {preview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setPreview(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Table {preview.tableNumber}</h3>
                <button onClick={() => setPreview(null)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X size={16} />
                </button>
              </div>
              {preview.svgData && (
                <div className="flex justify-center rounded-xl bg-white p-4">
                  <div className="h-48 w-48 overflow-hidden [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: preview.svgData }} />
                </div>
              )}
              <p className="mt-3 text-center text-xs text-zinc-400 break-all">{preview.url}</p>
              <p className="mt-1 text-center text-xs text-zinc-400">Scans: {preview.scansCount}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button onClick={() => downloadSvg(preview)} variant="outline" className="gap-2">
                  <Download size={14} /> SVG
                </Button>
                <Button onClick={() => downloadPng(preview)} className="gap-2 bg-orange-600 hover:bg-orange-700">
                  <Download size={14} /> PNG
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set Expiry Modal */}
      <AnimatePresence>
        {expiryModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setExpiryModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
              onClick={e => e.stopPropagation()}>
              <h3 className="mb-3 font-semibold">Set Expiry — Table {expiryModal.tableNumber}</h3>
              <p className="mb-3 text-xs text-zinc-500">After this date the QR will stop working for customers.</p>
              <input type="datetime-local" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 mb-4" />
              <div className="flex gap-3">
                <Button onClick={handleSetExpiry} disabled={!expiryDate || actionId === expiryModal._id}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 gap-2">
                  {actionId === expiryModal._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Set Expiry
                </Button>
                <Button variant="outline" onClick={() => setExpiryModal(null)} className="flex-1">Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Panel */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 sm:items-center"
            onClick={() => setShowAnalytics(false)}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold">QR Scan Analytics</h3>
                <button onClick={() => setShowAnalytics(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X size={16} />
                </button>
              </div>

              {!analytics ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-orange-500" />
                </div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="mb-5 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Scans', value: analytics.totalScans, icon: '👁' },
                      { label: 'Active QRs', value: analytics.activeCount, icon: '✅' },
                      { label: 'Total QRs', value: analytics.totalQrCodes, icon: '📱' },
                    ].map(card => (
                      <div key={card.label} className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-zinc-800">
                        <p className="text-xl">{card.icon}</p>
                        <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">{card.value}</p>
                        <p className="text-xs text-zinc-400">{card.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Top scanned tables */}
                  {analytics.topScanned.length > 0 && (
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Top Scanned Tables</p>
                      <div className="space-y-2">
                        {analytics.topScanned.map((item, idx) => (
                          <div key={item.tableNumber}
                            className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                            <span className="w-5 text-center text-xs font-bold text-zinc-400">{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Table {item.tableNumber}</p>
                              {item.lastScannedAt && (
                                <p className="text-xs text-zinc-400">
                                  Last scan: {new Date(item.lastScannedAt).toLocaleDateString()}
                                  {item.lastDevice && ` · ${item.lastDevice}`}
                                </p>
                              )}
                            </div>
                            <span className="shrink-0 font-bold text-orange-600">{item.scansCount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
