'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Phone, Mail, CreditCard, Banknote,
  Smartphone, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useCustomer } from '@/lib/customer/customer-context';
import { orderApi } from '@/lib/api/customer';
import type { Order } from '@/types/customer';
import { cn } from '@/lib/utils';

type PaymentMethod = 'cash' | 'razorpay' | 'upi';

// Razorpay type is declared in src/hooks/use-razorpay.ts; no re-declaration needed here

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'cash', label: 'Pay at Counter', icon: <Banknote size={18} />, desc: 'Pay cash when bill arrives' },
  { id: 'upi', label: 'UPI / QR', icon: <Smartphone size={18} />, desc: 'Pay via any UPI app' },
  { id: 'razorpay', label: 'Card / Wallet', icon: <CreditCard size={18} />, desc: 'Card, netbanking, wallets' },
];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const { cart, qrData, sessionId, setCurrentOrder, initSession } = useCustomer();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-init if landed directly
  useEffect(() => {
    if (!qrData && token) {
      initSession(token).catch(() => router.push(`/menu/${token}`));
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const themeColor = qrData?.restaurant.branding?.themeColor ?? '#ea580c';

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center">
        <AlertCircle size={40} className="text-zinc-300" />
        <p className="mt-4 text-sm text-zinc-500">Cart is empty. Add items first.</p>
        <button onClick={() => router.push(`/menu/${token}/browse`)}
          className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: themeColor }}>
          Back to Menu
        </button>
      </div>
    );
  }

  const tax = cart.items.reduce((s, item) => s + item.subtotal * 0.05, 0);
  const total = cart.subtotal + tax;

  const placeOrder = async () => {
    if (!sessionId) return;
    setError(null);
    setPlacing(true);

    try {
      // Save customer details first
      if (name || phone || email) {
        await orderApi.saveDetails(sessionId, { name, phone, email, consentGiven });
      }

      // Place the order
      const orderRes = await orderApi.place({
        sessionId,
        paymentMethod,
        notes: notes || undefined,
      });

      const order: Order = orderRes.data!;
      setCurrentOrder(order);

      // Handle Razorpay payment flow
      if (paymentMethod === 'razorpay') {
        const loaded = await loadRazorpayScript();
        if (!loaded) throw new Error('Payment gateway failed to load');

        const rzpRes = await orderApi.createRazorpayOrder(order._id, sessionId);
        const rzpData = rzpRes.data!;

        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: rzpData.keyId,
            amount: rzpData.amount,
            currency: rzpData.currency,
            order_id: rzpData.razorpayOrderId,
            name: qrData?.restaurant.name ?? 'TapMenu',
            description: `Order #${order.orderNumber}`,
            handler: async (response: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
              try {
                await orderApi.verifyPayment({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                resolve();
              } catch (e) { reject(e); }
            },
            modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
            prefill: { name, contact: phone, email },
            theme: { color: themeColor },
          });
          rzp.open();
        });
      }

      router.push(`/menu/${token}/order/${order._id}`);
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-36">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
        <button onClick={() => router.back()} className="rounded-xl p-1.5 text-zinc-500 hover:bg-zinc-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-zinc-900">Checkout</h1>
      </div>

      <div className="space-y-3 p-4">
        {/* Customer details */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-zinc-800">Your Details (optional)</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2.5">
              <User size={16} className="text-zinc-400 shrink-0" />
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400" />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2.5">
              <Phone size={16} className="text-zinc-400 shrink-0" />
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="Phone number" type="tel"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400" />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2.5">
              <Mail size={16} className="text-zinc-400 shrink-0" />
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email (optional)" type="email"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400" />
            </div>
            {(name || phone || email) && (
              <label className="flex items-start gap-2 text-xs text-zinc-500">
                <input type="checkbox" checked={consentGiven} onChange={e => setConsentGiven(e.target.checked)}
                  className="mt-0.5 accent-orange-500" />
                I consent to my details being saved for faster future orders
              </label>
            )}
          </div>
        </div>

        {/* Order notes */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-zinc-800">Order Notes</h2>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Any special instructions for the kitchen…"
            rows={2}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none" />
        </div>

        {/* Payment method */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-zinc-800">Payment Method</h2>
          <div className="space-y-2">
            {PAYMENT_METHODS.map(pm => (
              <button key={pm.id}
                onClick={() => setPaymentMethod(pm.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition',
                  paymentMethod === pm.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-zinc-200'
                )}>
                <span className={paymentMethod === pm.id ? 'text-orange-600' : 'text-zinc-400'}>{pm.icon}</span>
                <div>
                  <p className={cn('text-sm font-semibold', paymentMethod === pm.id ? 'text-orange-700' : 'text-zinc-800')}>
                    {pm.label}
                  </p>
                  <p className="text-xs text-zinc-400">{pm.desc}</p>
                </div>
                {paymentMethod === pm.id && (
                  <CheckCircle2 size={16} className="ml-auto shrink-0 text-orange-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bill */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-zinc-800">Order Summary</h2>
          <div className="space-y-1.5 text-sm">
            {cart.items.map(item => (
              <div key={item._id} className="flex justify-between text-zinc-600">
                <span className="truncate flex-1">{item.name} × {item.quantity}</span>
                <span className="shrink-0 ml-2">₹{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-zinc-100 pt-1.5 text-zinc-500">
              <span>GST (approx.)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-100 pt-1.5 font-bold text-zinc-900">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* Place order CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-4 pb-6 pt-3 shadow-lg">
        <button
          onClick={placeOrder}
          disabled={placing}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white shadow-xl disabled:opacity-70"
          style={{ background: themeColor }}
        >
          {placing
            ? <><Loader2 size={16} className="animate-spin" /> Placing order…</>
            : <>Place Order · ₹{total.toFixed(2)}</>
          }
        </button>
      </div>
    </div>
  );
}
