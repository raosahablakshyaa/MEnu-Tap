'use client';

import { useEffect, useState, useCallback } from 'react';
import { posApi } from '@/lib/api/owner';
import { Plus, Trash2, Printer, Receipt, X } from 'lucide-react';

interface BillItem { name: string; quantity: number; unitPrice: number; discount: number; subtotal: number }
interface Transaction {
  _id: string; billNumber: string; orderType: string; totalAmount: number;
  status: string; paymentMethod: string; createdAt: string; customerName?: string;
}

const PAYMENT_METHODS = ['cash', 'upi', 'card', 'wallet'];
const ORDER_TYPES = ['dine_in', 'takeaway', 'delivery'];

export default function POSPage() {
  const [view, setView] = useState<'billing' | 'transactions'>('billing');
  const [items, setItems] = useState<BillItem[]>([]);
  const [itemForm, setItemForm] = useState({ name: '', quantity: 1, unitPrice: 0, discount: 0 });
  const [billMeta, setBillMeta] = useState({ orderType: 'dine_in', tableNumber: '', customerName: '', customerPhone: '', paymentMethod: 'cash', gstRate: 5, cashReceived: 0, isIntraState: true });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastBill, setLastBill] = useState<Record<string, unknown> | null>(null);

  const loadTransactions = useCallback(async () => {
    const res = await posApi.list({ limit: '20' });
    setTransactions((res as { data: { items: Transaction[] } }).data.items ?? []);
  }, []);

  useEffect(() => { if (view === 'transactions') loadTransactions(); }, [view, loadTransactions]);

  const addItem = () => {
    if (!itemForm.name || itemForm.unitPrice <= 0) return;
    const subtotal = itemForm.quantity * itemForm.unitPrice - itemForm.discount;
    setItems(prev => [...prev, { ...itemForm, subtotal }]);
    setItemForm({ name: '', quantity: 1, unitPrice: 0, discount: 0 });
  };

  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const taxableAmount = subtotal;
  const gst = (taxableAmount * billMeta.gstRate) / 100;
  const cgst = billMeta.isIntraState ? gst / 2 : 0;
  const sgst = billMeta.isIntraState ? gst / 2 : 0;
  const igst = !billMeta.isIntraState ? gst : 0;
  const total = taxableAmount + gst;
  const change = billMeta.paymentMethod === 'cash' ? Math.max(0, billMeta.cashReceived - total) : 0;

  const createBill = async () => {
    if (items.length === 0) return;
    setSaving(true);
    try {
      const res = await posApi.createBill({
        ...billMeta,
        items: items.map(i => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount, subtotal: i.subtotal })),
        gstRate: billMeta.gstRate,
        serviceCharge: 0,
        packingCharge: 0,
        changeGiven: change,
      });
      setLastBill((res as { data: Record<string, unknown> }).data);
      setItems([]);
    } finally { setSaving(false); }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700">
          {(['billing', 'transactions'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${view === v ? 'bg-orange-500 text-white' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400'} rounded-lg`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'billing' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Item Entry + List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Add Item */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 font-semibold text-zinc-900 dark:text-white">Add Item</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <input placeholder="Item name" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                  className="col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                <input type="number" placeholder="Qty" min="1" value={itemForm.quantity} onChange={e => setItemForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                <input type="number" placeholder="Price ₹" min="0" value={itemForm.unitPrice || ''} onChange={e => setItemForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
              <button onClick={addItem} className="mt-3 flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
                <Plus className="h-4 w-4" /> Add to Bill
              </button>
            </div>

            {/* Bill Items */}
            {items.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="min-w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-900">
                    <tr>
                      {['Item', 'Qty', 'Price', 'Subtotal', ''].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-sm text-zinc-900 dark:text-white">{item.name}</td>
                        <td className="px-4 py-2 text-sm text-zinc-600">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-zinc-600">{fmt(item.unitPrice)}</td>
                        <td className="px-4 py-2 text-sm font-medium text-zinc-900 dark:text-white">{fmt(item.subtotal)}</td>
                        <td className="px-4 py-2">
                          <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bill Meta */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 font-semibold text-zinc-900 dark:text-white">Bill Details</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Order Type</label>
                  <select value={billMeta.orderType} onChange={e => setBillMeta(f => ({ ...f, orderType: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    {ORDER_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Customer Name</label>
                  <input value={billMeta.customerName} onChange={e => setBillMeta(f => ({ ...f, customerName: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Table No.</label>
                  <input value={billMeta.tableNumber} onChange={e => setBillMeta(f => ({ ...f, tableNumber: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Payment Method</label>
                  <select value={billMeta.paymentMethod} onChange={e => setBillMeta(f => ({ ...f, paymentMethod: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">GST Rate (%)</label>
                  <select value={billMeta.gstRate} onChange={e => setBillMeta(f => ({ ...f, gstRate: parseInt(e.target.value) }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                {billMeta.paymentMethod === 'cash' && (
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Cash Received</label>
                    <input type="number" value={billMeta.cashReceived || ''} onChange={e => setBillMeta(f => ({ ...f, cashReceived: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Bill Summary */}
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold text-zinc-900 dark:text-white">Bill Summary</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-600"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                {cgst > 0 && <div className="flex justify-between text-zinc-600"><span>CGST ({billMeta.gstRate / 2}%)</span><span>{fmt(cgst)}</span></div>}
                {sgst > 0 && <div className="flex justify-between text-zinc-600"><span>SGST ({billMeta.gstRate / 2}%)</span><span>{fmt(sgst)}</span></div>}
                {igst > 0 && <div className="flex justify-between text-zinc-600"><span>IGST ({billMeta.gstRate}%)</span><span>{fmt(igst)}</span></div>}
                <div className="border-t border-zinc-200 pt-2 flex justify-between font-bold text-zinc-900 dark:text-white dark:border-zinc-700"><span>Total</span><span className="text-lg">{fmt(total)}</span></div>
                {billMeta.paymentMethod === 'cash' && billMeta.cashReceived > 0 && (
                  <div className="flex justify-between text-green-600 font-medium"><span>Change</span><span>{fmt(change)}</span></div>
                )}
              </div>
              <button onClick={createBill} disabled={saving || items.length === 0}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50">
                <Printer className="h-4 w-4" />
                {saving ? 'Processing...' : 'Create Bill & Print'}
              </button>
            </div>

            {/* Last Bill Confirmation */}
            {lastBill && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-green-700">Bill Created!</p>
                    <p className="text-sm text-green-600">Bill #{lastBill['billNumber'] as string}</p>
                    <p className="text-sm text-green-600">Total: {fmt(lastBill['totalAmount'] as number)}</p>
                  </div>
                  <button onClick={() => setLastBill(null)}><X className="h-4 w-4 text-green-500" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'transactions' && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                {['Bill #', 'Type', 'Customer', 'Amount', 'Payment', 'Status', 'Time'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {transactions.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-zinc-500">No transactions yet</td></tr>
              )}
              {transactions.map(tx => (
                <tr key={tx._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-zinc-900 dark:text-white">{tx.billNumber}</td>
                  <td className="px-4 py-3 text-sm capitalize text-zinc-500">{tx.orderType.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{tx.customerName || '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-white">{fmt(tx.totalAmount)}</td>
                  <td className="px-4 py-3 text-sm capitalize text-zinc-500">{tx.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tx.status === 'paid' ? 'bg-green-100 text-green-700' : tx.status === 'voided' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-600'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
