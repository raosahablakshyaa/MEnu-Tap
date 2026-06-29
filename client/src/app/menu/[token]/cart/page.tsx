'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, Loader2, Tag } from 'lucide-react';
import { useCustomer } from '@/lib/customer/customer-context';
import { menuApi } from '@/lib/api/customer';
import type { PublicMenuItem } from '@/types/customer';

export default function CartPage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const { cart, qrData, updateCartItem, removeFromCart, initSession } = useCustomer();
  const [upsell, setUpsell] = useState<PublicMenuItem[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { addToCart } = useCustomer();

  // Re-init if landed directly
  useEffect(() => {
    if (!qrData && token) {
      initSession(token).catch(() => router.push(`/menu/${token}`));
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load upsell suggestions
  useEffect(() => {
    if (!cart?.items.length || !token) { setUpsell([]); return; }
    const ids = cart.items.map(i => i.menuItemId);
    menuApi.getUpsell(token, ids)
      .then(res => setUpsell(res.data ?? []))
      .catch(() => setUpsell([]));
  }, [cart?.items.length, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const themeColor = qrData?.restaurant.branding?.themeColor ?? '#ea580c';

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center">
        <ShoppingBag size={56} className="text-zinc-200" />
        <h2 className="mt-4 text-lg font-bold text-zinc-700">Your cart is empty</h2>
        <p className="mt-1 text-sm text-zinc-400">Add items from the menu to get started.</p>
        <button onClick={() => router.push(`/menu/${token}/browse`)}
          className="mt-6 rounded-2xl px-6 py-3 text-sm font-semibold text-white"
          style={{ background: themeColor }}>
          Browse Menu
        </button>
      </div>
    );
  }

  const tax = cart.items.reduce((s, item) => s + item.subtotal * 0.05, 0); // 5% blended GST estimate
  const total = cart.subtotal + tax;

  return (
    <div className="min-h-screen bg-zinc-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
        <button onClick={() => router.back()} className="rounded-xl p-1.5 text-zinc-500 hover:bg-zinc-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-base font-bold text-zinc-900">Your Cart</h1>
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
          {cart.totalItems} items
        </span>
      </div>

      {/* Table info */}
      <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2.5 text-xs text-orange-700">
        <Tag size={13} className="shrink-0" />
        <span>Table <strong>{cart.tableNumber}</strong> · {qrData?.restaurant.name}</span>
      </div>

      {/* Cart items */}
      <div className="mt-3 space-y-2 px-4">
        <AnimatePresence>
          {cart.items.map(item => (
            <motion.div key={item._id} layout exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-zinc-900 line-clamp-2">{item.name}</p>
                  {item.variantName && <p className="text-xs text-zinc-400">{item.variantName}</p>}
                  {item.addons.length > 0 && (
                    <p className="text-[11px] text-zinc-400">{item.addons.map(a => a.name).join(', ')}</p>
                  )}
                  {item.notes && <p className="mt-0.5 text-[11px] italic text-zinc-400">"{item.notes}"</p>}
                </div>
                <button onClick={() => removeFromCart(item._id)}
                  className="rounded-xl p-1.5 text-red-400 hover:bg-red-50">
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="font-bold text-zinc-900">₹{item.subtotal.toFixed(2)}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateCartItem(item._id, item.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 active:scale-95">
                    <Minus size={14} />
                  </button>
                  <span className="min-w-[20px] text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateCartItem(item._id, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white active:scale-95">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Upsell */}
      {upsell.length > 0 && (
        <div className="mt-4 px-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">You might also like</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {upsell.map(item => (
              <div key={item._id} className="shrink-0 w-36 rounded-2xl bg-white p-3 shadow-sm">
                <div className="h-20 w-full overflow-hidden rounded-xl bg-zinc-100 mb-2">
                  {item.images[0]
                    ? <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
                    : <div className="flex h-full items-center justify-center text-2xl">🍽️</div>
                  }
                </div>
                <p className="line-clamp-2 text-xs font-semibold text-zinc-800">{item.name}</p>
                <p className="text-xs font-bold text-zinc-900 mt-0.5">₹{item.discountPrice ?? item.price}</p>
                <button
                  disabled={addingId === item._id}
                  onClick={async () => {
                    setAddingId(item._id);
                    try { await addToCart(item._id, 1); }
                    finally { setAddingId(null); }
                  }}
                  className="mt-2 w-full rounded-xl py-1.5 text-xs font-semibold text-white flex items-center justify-center gap-1"
                  style={{ background: themeColor }}
                >
                  {addingId === item._id ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bill summary */}
      <div className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-zinc-800">Bill Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal</span>
            <span>₹{cart.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>GST (approx.)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-100 pt-2 font-bold text-zinc-900">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Proceed button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-4 pb-6 pt-3 shadow-lg">
        <button
          onClick={() => router.push(`/menu/${token}/checkout`)}
          className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-white shadow-xl"
          style={{ background: themeColor }}
        >
          <span className="text-sm font-semibold">Proceed to Checkout</span>
          <span className="font-bold">₹{total.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
}
