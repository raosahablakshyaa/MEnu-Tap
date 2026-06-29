'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, ChefHat, Bell, Star, Loader2, ArrowLeft, Phone } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useCustomer } from '@/lib/customer/customer-context';
import { orderApi } from '@/lib/api/customer';
import type { Order, OrderStatus } from '@/types/customer';

const STATUS_STEPS: { status: OrderStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { status: 'pending',   label: 'Order Received',  icon: <Bell size={20} />,       color: 'text-zinc-500' },
  { status: 'confirmed', label: 'Accepted',         icon: <CheckCircle2 size={20} />, color: 'text-blue-500' },
  { status: 'preparing', label: 'Preparing',        icon: <ChefHat size={20} />,    color: 'text-amber-500' },
  { status: 'ready',     label: 'Ready to Serve',   icon: <Bell size={20} />,       color: 'text-emerald-500' },
  { status: 'served',    label: 'Served',            icon: <CheckCircle2 size={20} />, color: 'text-emerald-600' },
  { status: 'completed', label: 'Completed',         icon: <CheckCircle2 size={20} />, color: 'text-emerald-700' },
];

const STATUS_ORDER: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed'];

function getStepIndex(status: OrderStatus) {
  return STATUS_ORDER.indexOf(status);
}

export default function OrderTrackingPage() {
  const { token, orderId } = useParams() as { token: string; orderId: string };
  const router = useRouter();
  const { sessionId, qrData, initSession } = useCustomer();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [food, setFood] = useState(5);
  const [service, setService] = useState(5);
  const [ambience, setAmbience] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);

  const themeColor = qrData?.restaurant.branding?.themeColor ?? '#ea580c';

  // Re-init if needed
  useEffect(() => {
    if (!qrData && token) {
      initSession(token).catch(() => router.push(`/menu/${token}`));
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrder = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await orderApi.getById(orderId, sessionId);
      setOrder(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [orderId, sessionId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Show feedback when served/completed
  useEffect(() => {
    if (order && ['served', 'completed'].includes(order.status) && !order.feedbackGiven && !feedbackDone) {
      const t = setTimeout(() => setShowFeedback(true), 2000);
      return () => clearTimeout(t);
    }
  }, [order?.status, order?.feedbackGiven, feedbackDone]);

  // Socket.IO live tracking
  useEffect(() => {
    if (!sessionId) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:5000';

    const socket: Socket = io(apiBase, {
      auth: { sessionId },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('order:track', orderId);
    });

    socket.on('order:statusUpdate', (data: { orderId: string; status: OrderStatus }) => {
      if (data.orderId === orderId) {
        setOrder(prev => prev ? { ...prev, status: data.status } : prev);
      }
    });

    return () => {
      socket.emit('order:untrack', orderId);
      socket.disconnect();
    };
  }, [sessionId, orderId]);

  const submitFeedback = async () => {
    if (!sessionId || !order) return;
    setSubmittingFeedback(true);
    try {
      await orderApi.submitFeedback(order._id, sessionId, {
        foodRating: food,
        serviceRating: service,
        ambienceRating: ambience,
        comment: comment || undefined,
      });
      setFeedbackDone(true);
      setShowFeedback(false);
    } catch { /* ignore */ }
    finally { setSubmittingFeedback(false); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 size={28} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center">
        <p className="text-sm text-zinc-500">Order not found.</p>
        <button onClick={() => router.push(`/menu/${token}/browse`)}
          className="mt-4 rounded-xl px-5 py-2 text-sm font-semibold text-white"
          style={{ background: themeColor }}>
          Back to Menu
        </button>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const currentStep = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-zinc-50 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
        <button onClick={() => router.push(`/menu/${token}/browse`)}
          className="rounded-xl p-1.5 text-zinc-500 hover:bg-zinc-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-zinc-900">Order #{order.orderNumber}</h1>
          <p className="text-xs text-zinc-400">Table {order.tableNumber}</p>
        </div>
        {order.estimatedPrepTime && (
          <div className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
            <Clock size={12} /> ~{order.estimatedPrepTime} min
          </div>
        )}
      </div>

      {/* Status card */}
      <div className="mx-4 mt-4">
        {isCancelled ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl bg-red-50 p-5 text-center shadow-sm">
            <p className="text-2xl">😔</p>
            <p className="mt-2 font-bold text-red-700">Order Cancelled</p>
            {order.cancelReason && <p className="mt-1 text-sm text-red-500">{order.cancelReason}</p>}
          </motion.div>
        ) : (
          <motion.div layout className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="relative">
              {/* Progress bar */}
              <div className="absolute left-4 top-0 h-full w-0.5 bg-zinc-100" style={{ top: '20px', height: 'calc(100% - 40px)' }} />
              <div className="space-y-5">
                {STATUS_STEPS.filter(s => s.status !== 'completed' || order.status === 'completed').map((step, idx) => {
                  const stepIdx = getStepIndex(step.status);
                  const isDone = stepIdx < currentStep;
                  const isActive = stepIdx === currentStep;
                  const isFuture = stepIdx > currentStep;
                  return (
                    <motion.div key={step.status} className="flex items-center gap-4">
                      <div className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                        isDone ? 'border-emerald-500 bg-emerald-500 text-white'
                          : isActive ? `border-orange-500 bg-orange-500 text-white`
                          : 'border-zinc-200 bg-white text-zinc-300'
                      }`}>
                        {isDone ? <CheckCircle2 size={16} /> : step.icon}
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${isDone || isActive ? 'text-zinc-900' : 'text-zinc-400'}`}>
                          {step.label}
                        </p>
                        {isActive && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-xs text-orange-500 font-medium">
                            {step.status === 'pending' ? 'Waiting for kitchen to confirm…'
                              : step.status === 'confirmed' ? 'Your order has been accepted!'
                              : step.status === 'preparing' ? 'Our chefs are working on it…'
                              : step.status === 'ready' ? 'Your food is ready! 🎉'
                              : step.status === 'served' ? 'Enjoy your meal!'
                              : 'Order complete!'}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Order items */}
      <div className="mx-4 mt-3 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-zinc-800">Your Order</h3>
        <div className="space-y-2">
          {order.items.map(item => (
            <div key={item._id} className="flex justify-between text-sm">
              <div className="flex-1 min-w-0">
                <p className="text-zinc-800 truncate">{item.quantity}× {item.name}</p>
                {item.variantName && <p className="text-xs text-zinc-400">{item.variantName}</p>}
                {item.notes && <p className="text-[11px] italic text-zinc-400">"{item.notes}"</p>}
              </div>
              <span className="shrink-0 ml-2 text-zinc-700 font-medium">₹{item.subtotal.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-zinc-100 pt-2 font-bold text-zinc-900">
            <span>Total</span>
            <span>₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            Payment: {order.paymentStatus === 'paid' ? 'Paid ✓' : 'Pending'}
          </span>
          {order.paymentMethod && (
            <span className="text-xs text-zinc-400 capitalize">{order.paymentMethod}</span>
          )}
        </div>
      </div>

      {/* Order more / feedback */}
      {!isCancelled && (
        <div className="mx-4 mt-3 flex gap-2">
          <button onClick={() => router.push(`/menu/${token}/browse`)}
            className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            Order More
          </button>
          {feedbackDone && (
            <div className="flex-1 flex items-center justify-center rounded-2xl bg-emerald-50 py-3">
              <CheckCircle2 size={16} className="mr-2 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700">Thanks!</span>
            </div>
          )}
        </div>
      )}

      {/* Contact */}
      {qrData?.restaurant.contact?.phone && (
        <div className="mt-4 text-center">
          <a href={`tel:${qrData.restaurant.contact.phone}`}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
            <Phone size={12} /> Need help? Call staff
          </a>
        </div>
      )}

      {/* Feedback bottom sheet */}
      <AnimatePresence>
        {showFeedback && !feedbackDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
            onClick={() => setShowFeedback(false)}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="rounded-t-3xl bg-white p-6"
              onClick={e => e.stopPropagation()}>
              <h2 className="mb-1 text-center text-lg font-bold text-zinc-900">How was your experience?</h2>
              <p className="mb-5 text-center text-sm text-zinc-400">Your feedback helps us improve</p>

              {[
                { label: 'Food', value: food, set: setFood },
                { label: 'Service', value: service, set: setService },
                { label: 'Ambience', value: ambience, set: setAmbience },
              ].map(({ label, value, set }) => (
                <div key={label} className="mb-4">
                  <p className="mb-1.5 text-sm font-medium text-zinc-700">{label}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => set(n)}
                        className="flex-1 rounded-xl py-2 text-lg transition"
                        style={{ background: n <= value ? `${themeColor}22` : '#f4f4f5' }}>
                        <Star size={20} className={`mx-auto ${n <= value ? 'fill-orange-500 text-orange-500' : 'text-zinc-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Tell us more (optional)…"
                rows={2}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none mb-4" />

              <div className="flex gap-3">
                <button onClick={() => setShowFeedback(false)}
                  className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600">
                  Skip
                </button>
                <button onClick={submitFeedback} disabled={submittingFeedback}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white"
                  style={{ background: themeColor }}>
                  {submittingFeedback ? <Loader2 size={16} className="animate-spin" /> : 'Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
