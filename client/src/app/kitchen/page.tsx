'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import {
  ChefHat, Bell, CheckCircle2, Clock, Loader2,
  AlertTriangle, History, Star, LogOut, Wifi, WifiOff,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { kitchenApi } from '@/lib/api/kitchen';
import { apiClient } from '@/lib/api/client';
import type { Order, OrderStatus } from '@/types/customer';
import { cn } from '@/lib/utils';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; borderColor: string; emoji: string }
> = {
  pending:   { label: 'New',       color: 'text-amber-700',   bg: 'bg-amber-50',    borderColor: 'border-amber-400',  emoji: '🔔' },
  confirmed: { label: 'Accepted',  color: 'text-blue-700',    bg: 'bg-blue-50',     borderColor: 'border-blue-400',   emoji: '✅' },
  preparing: { label: 'Preparing', color: 'text-orange-700',  bg: 'bg-orange-50',   borderColor: 'border-orange-400', emoji: '👨‍🍳' },
  ready:     { label: 'Ready',     color: 'text-emerald-700', bg: 'bg-emerald-50',  borderColor: 'border-emerald-400',emoji: '🍽️' },
  served:    { label: 'Served',    color: 'text-zinc-600',    bg: 'bg-zinc-50',     borderColor: 'border-zinc-300',   emoji: '✓' },
  cancelled: { label: 'Cancelled', color: 'text-red-600',     bg: 'bg-red-50',      borderColor: 'border-red-300',    emoji: '✕' },
};

// next valid transitions per status (kitchen UI only shows sensible next steps)
const NEXT_ACTIONS: Record<string, { status: string; label: string; color: string }[]> = {
  pending:   [{ status: 'confirmed', label: 'Accept',  color: 'bg-blue-600' }, { status: 'cancelled', label: 'Reject', color: 'bg-red-500' }],
  confirmed: [{ status: 'preparing', label: 'Preparing', color: 'bg-orange-500' }, { status: 'cancelled', label: 'Cancel', color: 'bg-red-500' }],
  preparing: [{ status: 'ready',    label: 'Mark Ready', color: 'bg-emerald-600' }],
  ready:     [{ status: 'served',   label: 'Mark Served', color: 'bg-emerald-700' }],
  served:    [{ status: 'completed', label: 'Complete', color: 'bg-zinc-700' }],
};

// How long each status "column" gets before visual urgency triggers (ms)
const URGENCY_MS: Record<string, number> = {
  pending: 3 * 60 * 1000,   // 3 min
  confirmed: 2 * 60 * 1000, // 2 min
  preparing: 15 * 60 * 1000,// 15 min
  ready: 5 * 60 * 1000,     // 5 min
};

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '< 1 min';
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function isUrgent(order: Order): boolean {
  const limit = URGENCY_MS[order.status];
  if (!limit) return false;
  return Date.now() - new Date(order.updatedAt).getTime() > limit;
}

// ── OrderCard ─────────────────────────────────────────────────────────────────
function OrderCard({
  order,
  onAction,
  actionLoading,
}: {
  order: Order;
  onAction: (orderId: string, status: string) => void;
  actionLoading: string | null;
}) {
  const meta = STATUS_META[order.status] ?? STATUS_META['pending'];
  const actions = NEXT_ACTIONS[order.status] ?? [];
  const urgent = isUrgent(order);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, height: 0 }}
      className={cn(
        'rounded-2xl border-2 bg-white p-4 shadow-sm transition-all',
        urgent ? 'border-red-400 animate-pulse-slow' : meta.borderColor,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{meta.emoji}</span>
            <span className="font-bold text-zinc-900 text-sm">#{order.orderNumber}</span>
            {urgent && (
              <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                <AlertTriangle size={9} /> URGENT
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-zinc-400">
            Table {order.tableNumber}
            {order.customerName && ` · ${order.customerName}`}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', meta.bg, meta.color)}>
            {meta.label}
          </div>
          <div className="mt-0.5 flex items-center justify-end gap-1 text-xs text-zinc-400">
            <Clock size={10} />
            {timeSince(order.updatedAt)}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mb-3 space-y-1.5 rounded-xl bg-zinc-50 p-2.5">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-start justify-between gap-2 text-xs">
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-zinc-800">{item.quantity}×</span>
              <span className="ml-1 text-zinc-700 truncate">{item.name}</span>
              {item.variantName && (
                <span className="ml-1 text-zinc-400">({item.variantName})</span>
              )}
              {item.addons?.length > 0 && (
                <div className="text-zinc-400 pl-4">+ {item.addons.map(a => a.name).join(', ')}</div>
              )}
              {item.notes && (
                <div className="pl-4 italic text-amber-600">⚠ {item.notes}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Order notes */}
      {order.notes && (
        <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          📝 {order.notes}
        </div>
      )}

      {/* Payment info */}
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className={cn(
          'rounded-full px-2 py-0.5 font-medium',
          order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        )}>
          {order.paymentStatus === 'paid' ? '💰 Paid' : '⏳ Payment Pending'}
        </span>
        <span className="text-zinc-400">₹{order.totalAmount.toFixed(2)}</span>
        {order.paymentMethod && (
          <span className="text-zinc-400 capitalize">({order.paymentMethod})</span>
        )}
      </div>

      {/* Action buttons */}
      {actions.length > 0 && (
        <div className="flex gap-2">
          {actions.map(action => (
            <button
              key={action.status}
              onClick={() => onAction(order._id, action.status)}
              disabled={actionLoading === order._id}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white transition active:scale-95',
                action.color
              )}
            >
              {actionLoading === order._id ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                action.label
              )}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── KDS Columns ───────────────────────────────────────────────────────────────
const COLUMNS: { status: OrderStatus; title: string; icon: React.ReactNode }[] = [
  { status: 'pending',   title: 'New Orders',  icon: <Bell size={16} /> },
  { status: 'confirmed', title: 'Accepted',    icon: <CheckCircle2 size={16} /> },
  { status: 'preparing', title: 'Preparing',   icon: <ChefHat size={16} /> },
  { status: 'ready',     title: 'Ready',       icon: <CheckCircle2 size={16} className="text-emerald-500" /> },
];

// ── Main KDS Page ─────────────────────────────────────────────────────────────
export default function KitchenPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [view, setView] = useState<'live' | 'history'>('live');
  const [cancelModal, setCancelModal] = useState<{ orderId: string; status: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await kitchenApi.getOrders();
      setOrders(res.data ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Socket.IO connection
  useEffect(() => {
    const token = apiClient.getAccessToken();
    if (!token || !user) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:5000';
    const socket: Socket = io(apiBase, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('order:new', (data: Order) => {
      setOrders(prev => {
        const exists = prev.some(o => o._id === data._id || o.orderNumber === data.orderNumber);
        if (exists) return prev;
        // Play notification sound
        if (audioRef.current) {
          audioRef.current.play().catch(() => {/* user hasn't interacted yet */});
        }
        return [data, ...prev];
      });
    });

    socket.on('order:statusUpdate', (data: { orderId: string; status: OrderStatus; updatedAt: string }) => {
      setOrders(prev =>
        prev.map(o =>
          o._id === data.orderId
            ? { ...o, status: data.status, updatedAt: data.updatedAt }
            : o
        ).filter(o => !['completed', 'cancelled'].includes(o.status))
      );
    });

    socket.on('order:paid', (data: { orderId: string }) => {
      setOrders(prev =>
        prev.map(o => o._id === data.orderId ? { ...o, paymentStatus: 'paid' } : o)
      );
    });

    return () => { socket.disconnect(); };
  }, [user]);

  const handleAction = async (orderId: string, status: string) => {
    if (status === 'cancelled') {
      setCancelModal({ orderId, status });
      return;
    }
    setActionLoading(orderId);
    try {
      await kitchenApi.updateStatus(orderId, status);
      // Optimistic update; socket will also fire
      setOrders(prev =>
        prev
          .map(o => o._id === orderId ? { ...o, status: status as OrderStatus, updatedAt: new Date().toISOString() } : o)
          .filter(o => !['completed', 'cancelled'].includes(o.status))
      );
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  const handleCancel = async () => {
    if (!cancelModal) return;
    setActionLoading(cancelModal.orderId);
    try {
      await kitchenApi.updateStatus(cancelModal.orderId, 'cancelled', cancelReason);
      setOrders(prev => prev.filter(o => o._id !== cancelModal.orderId));
    } catch { /* ignore */ }
    finally {
      setActionLoading(null);
      setCancelModal(null);
      setCancelReason('');
    }
  };

  const ordersInColumn = (status: OrderStatus) =>
    orders.filter(o => o.status === status).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      {/* Hidden audio for new order notification */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src="/notification.mp3" preload="none" />

      {/* Header */}
      <header className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-900 px-6 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600">
            <ChefHat size={16} />
          </div>
          <span className="font-bold text-sm">Kitchen Display</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-zinc-800 p-1">
          <button
            onClick={() => setView('live')}
            className={cn('rounded-full px-3 py-1 text-xs font-medium transition', view === 'live' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white')}
          >
            Live Queue
          </button>
          <button
            onClick={() => setView('history')}
            className={cn('rounded-full px-3 py-1 text-xs font-medium transition', view === 'history' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white')}
          >
            History
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Connection indicator */}
          <div className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs', connected ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400')}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'Live' : 'Offline'}
          </div>

          <span className="text-xs text-zinc-400">{user.firstName}</span>

          <button onClick={() => logout().then(() => router.push('/login'))}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Live KDS Board */}
      {view === 'live' && (
        <div className="flex flex-1 gap-4 overflow-x-auto p-4">
          {COLUMNS.map(col => {
            const colOrders = ordersInColumn(col.status);
            return (
              <div key={col.status} className="flex w-80 shrink-0 flex-col gap-3">
                {/* Column header */}
                <div className={cn(
                  'flex items-center justify-between rounded-xl px-3 py-2',
                  col.status === 'pending'   ? 'bg-amber-950/60 border border-amber-800/50' :
                  col.status === 'confirmed' ? 'bg-blue-950/60 border border-blue-800/50' :
                  col.status === 'preparing' ? 'bg-orange-950/60 border border-orange-800/50' :
                  'bg-emerald-950/60 border border-emerald-800/50'
                )}>
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <span className="text-sm font-bold">{col.title}</span>
                  </div>
                  <span className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                    colOrders.length > 0 ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-zinc-400'
                  )}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
                  {loading ? (
                    [...Array(2)].map((_, i) => (
                      <div key={i} className="h-40 animate-pulse rounded-2xl bg-zinc-800" />
                    ))
                  ) : colOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 py-10 text-center">
                      <p className="text-3xl">😴</p>
                      <p className="mt-2 text-xs text-zinc-500">No orders here</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {colOrders.map(order => (
                        <OrderCard
                          key={order._id}
                          order={order}
                          onAction={handleAction}
                          actionLoading={actionLoading}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History view */}
      {view === 'history' && <OrderHistoryView />}

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {cancelModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700 p-5"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="mb-3 font-bold">Cancel Order?</h3>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)"
                rows={2}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 mb-4 resize-none"
              />
              <div className="flex gap-3">
                <button onClick={() => { setCancelModal(null); setCancelReason(''); }}
                  className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-sm font-medium text-zinc-400 hover:text-white">
                  Keep Order
                </button>
                <button onClick={handleCancel} disabled={actionLoading === cancelModal.orderId}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700">
                  {actionLoading === cancelModal.orderId
                    ? <Loader2 size={14} className="animate-spin" />
                    : 'Cancel Order'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Order History Sub-view ────────────────────────────────────────────────────
function OrderHistoryView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (statusFilter) params.status = statusFilter;
      const res = await kitchenApi.getHistory(params);
      setOrders(res.data?.orders ?? []);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const markCashPaid = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await kitchenApi.markCashPaid(orderId);
      await load();
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {['', 'completed', 'served', 'cancelled', 'pending'].map(s => (
          <button key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition capitalize',
              statusFilter === s
                ? 'border-orange-500 bg-orange-600 text-white'
                : 'border-zinc-700 text-zinc-400 hover:text-white'
            )}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-zinc-800" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <History size={40} className="text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-400">No orders found</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {orders.map(order => {
            const meta = STATUS_META[order.status] ?? STATUS_META['pending'];
            return (
              <div key={order._id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">#{order.orderNumber}</p>
                    <p className="text-xs text-zinc-400">Table {order.tableNumber}</p>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', meta.bg, meta.color)}>
                    {meta.label}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 space-y-0.5 mb-3">
                  {order.items.slice(0, 3).map((item, i) => (
                    <p key={i}>{item.quantity}× {item.name}</p>
                  ))}
                  {order.items.length > 3 && <p>+{order.items.length - 3} more</p>}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300">₹{order.totalAmount.toFixed(2)}</span>
                  <span className={order.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}>
                    {order.paymentStatus === 'paid' ? 'Paid ✓' : 'Unpaid'}
                  </span>
                </div>
                {order.paymentStatus !== 'paid' && order.paymentMethod === 'cash' && (
                  <button
                    onClick={() => markCashPaid(order._id)}
                    disabled={actionLoading === order._id}
                    className="mt-2 w-full rounded-xl bg-emerald-700 py-1.5 text-xs font-semibold text-white flex items-center justify-center gap-1 hover:bg-emerald-600"
                  >
                    {actionLoading === order._id ? <Loader2 size={12} className="animate-spin" /> : '💰 Mark Cash Paid'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 disabled:opacity-40 hover:text-white">
            Prev
          </button>
          <span className="text-xs text-zinc-400">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 disabled:opacity-40 hover:text-white">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
