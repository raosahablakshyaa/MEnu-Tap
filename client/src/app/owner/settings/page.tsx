'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { restaurantApi } from '@/lib/api/restaurant';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED'];
const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'America/New_York', 'Europe/London', 'Asia/Singapore'];
const LANGUAGES = [{ value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' }];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({
    currency: 'INR', taxRate: 18, serviceCharge: 0, language: 'en',
    timezone: 'Asia/Kolkata', invoicePrefix: 'INV', orderPrefix: 'ORD', qrPrefix: 'QR',
    notificationPreferences: { email: true, sms: true, push: true, whatsapp: false },
  });

  useEffect(() => {
    restaurantApi.getSettings().then(res => {
      if (res.data) setForm(res.data as Record<string, unknown>);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: unknown) => setForm(p => ({ ...p, [key]: value }));
  const setNotif = (key: string, value: boolean) => {
    setForm(p => ({
      ...p,
      notificationPreferences: { ...(p.notificationPreferences as Record<string, unknown>), [key]: value },
    }));
  };

  const notif = (form.notificationPreferences as Record<string, boolean>) || {};

  const handleSave = async () => {
    setSaving(true);
    try {
      await restaurantApi.updateSettings(form);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* General */}
      <Section title="General">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Currency" value={form.currency as string} onChange={v => set('currency', v)} options={CURRENCIES.map(c => ({ value: c, label: c }))} />
          <SelectField label="Language" value={form.language as string} onChange={v => set('language', v)} options={LANGUAGES} />
          <SelectField label="Timezone" value={form.timezone as string} onChange={v => set('timezone', v)} options={TIMEZONES.map(t => ({ value: t, label: t }))} />
          <NumberField label="Tax Rate (%)" value={form.taxRate as number} onChange={v => set('taxRate', v)} min={0} max={100} />
          <NumberField label="Service Charge (%)" value={form.serviceCharge as number} onChange={v => set('serviceCharge', v)} min={0} max={100} />
        </div>
      </Section>

      {/* Prefixes */}
      <Section title="Prefix Settings">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Invoice Prefix" value={form.invoicePrefix as string} onChange={v => set('invoicePrefix', v)} />
          <TextField label="Order Prefix" value={form.orderPrefix as string} onChange={v => set('orderPrefix', v)} />
          <TextField label="QR Prefix" value={form.qrPrefix as string} onChange={v => set('qrPrefix', v)} />
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <div className="grid gap-3 sm:grid-cols-2">
          {(['email', 'sms', 'push', 'whatsapp'] as const).map(key => (
            <Toggle key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} checked={!!notif[key]} onChange={v => setNotif(key, v)} />
          ))}
        </div>
      </Section>

      <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
        {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
        Save Settings
      </Button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
      <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      {children}
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      <input value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
    </div>
  );
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      <input type="number" value={value ?? ''} min={min} max={max} onChange={e => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
      <span className="text-sm text-zinc-700 dark:text-zinc-300">{label} Notifications</span>
      <button onClick={() => onChange(!checked)} role="switch" aria-checked={checked}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-orange-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
