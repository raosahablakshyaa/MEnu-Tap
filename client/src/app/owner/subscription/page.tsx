'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle2, Clock, Star, Loader2, ArrowUpRight } from 'lucide-react';
import { restaurantApi } from '@/lib/api/restaurant';
import { Button } from '@/components/ui/button';
import { useRazorpay } from '@/hooks/use-razorpay';

interface Plan {
  _id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  maxStaff?: number;
  maxTables?: number;
  maxMenuItems?: number;
  maxBranches?: number;
  isPopular?: boolean;
}

interface CurrentSub {
  _id: string;
  planId: Plan;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  amount: number;
}

interface BillingEntry {
  _id: string;
  planId: { name: string; price: number };
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<CurrentSub | null>(null);
  const [history, setHistory] = useState<BillingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingPlanId, setPayingPlanId] = useState<string | null>(null);
  const razorpayLoaded = useRazorpay();

  useEffect(() => {
    Promise.all([
      restaurantApi.getPlans(),
      restaurantApi.getCurrentSubscription(),
      restaurantApi.getSubscriptionHistory(),
    ]).then(([p, c, h]) => {
      if (p.data) setPlans(p.data as unknown as Plan[]);
      if (c.data) setCurrent(c.data as unknown as CurrentSub);
      if (h.data) setHistory(h.data as unknown as BillingEntry[]);
    }).catch(() => toast.error('Failed to load subscription data'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (!razorpayLoaded) { toast.error('Payment gateway loading, please wait'); return; }
    setPayingPlanId(planId);
    try {
      const order = await restaurantApi.createPaymentOrder(planId);
      if (!order.data) throw new Error('Failed to create order');
      const { orderId, amount, currency, keyId } = order.data;

      const rzp = new window.Razorpay({
        key: keyId,
        amount: amount * 100,
        currency,
        name: 'TapMenu',
        description: 'Subscription Plan',
        order_id: orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await restaurantApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Subscription activated!');
            window.location.reload();
          } catch { toast.error('Payment verification failed'); }
        },
        theme: { color: '#f97316' },
      });
      rzp.open();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Payment failed');
    } finally {
      setPayingPlanId(null);
    }
  };

  const daysLeft = current
    ? Math.max(0, Math.ceil((new Date(current.endDate).getTime() - Date.now()) / 86400000))
    : 0;

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-orange-500" size={32} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Current plan banner */}
      {current ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-orange-200/60 bg-gradient-to-r from-orange-50 to-amber-50 p-6 dark:border-orange-800/40 dark:from-orange-950/20 dark:to-amber-950/20">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500">
              <CreditCard className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{current.planId?.name} Plan</p>
              <p className="text-sm text-zinc-500">
                Active · Expires {new Date(current.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-1.5 text-sm dark:bg-zinc-800/60">
                  <Clock size={14} className="text-orange-500" />
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{daysLeft} days left</span>
                </div>
                <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${current.autoRenew ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
                  <CheckCircle2 size={14} />
                  {current.autoRenew ? 'Auto-renew on' : 'Auto-renew off'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50 p-5 dark:border-amber-800/40 dark:bg-amber-950/20">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">No active subscription. Choose a plan below to get started.</p>
        </div>
      )}

      {/* Plans */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Available Plans</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map(plan => {
            const isCurrentPlan = current?.planId?._id === plan._id;
            return (
              <motion.div key={plan._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className={`relative rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900 ${plan.isPopular ? 'border-orange-400 ring-1 ring-orange-400/30' : 'border-zinc-200/60 dark:border-zinc-800/60'}`}>
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 rounded-full bg-orange-500 px-3 py-0.5 text-xs font-medium text-white">
                      <Star size={11} /> Popular
                    </span>
                  </div>
                )}
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{plan.name}</h3>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{plan.price.toLocaleString('en-IN')}
                  </span>
                  <span className="mb-1 text-sm text-zinc-400">/{plan.duration}d</span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-zinc-500">
                  {plan.maxStaff && <p>👥 Up to {plan.maxStaff} staff</p>}
                  {plan.maxTables && <p>🪑 Up to {plan.maxTables} tables</p>}
                  {plan.maxMenuItems && <p>🍽️ Up to {plan.maxMenuItems} menu items</p>}
                  {plan.maxBranches && <p>🏪 Up to {plan.maxBranches} branches</p>}
                </div>

                {plan.features?.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-5">
                  {isCurrentPlan ? (
                    <div className="rounded-lg bg-emerald-100 py-2 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Current Plan
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan._id)}
                      disabled={payingPlanId === plan._id}
                      className={`w-full gap-2 ${plan.isPopular ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                      variant={plan.isPopular ? 'default' : 'outline'}
                    >
                      {payingPlanId === plan._id
                        ? <><Loader2 size={14} className="animate-spin" /> Processing...</>
                        : <><ArrowUpRight size={14} /> {current ? 'Switch Plan' : 'Get Started'}</>
                      }
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Billing history */}
      {history.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Billing History</h2>
          <div className="rounded-2xl border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(entry => (
                  <tr key={entry._id} className="border-b border-zinc-50 last:border-0 dark:border-zinc-800/50">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{entry.planId?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(entry.startDate).toLocaleDateString('en-IN')} – {new Date(entry.endDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">₹{entry.amount?.toLocaleString('en-IN') || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        entry.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                        entry.status === 'expired' ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800' :
                        'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
