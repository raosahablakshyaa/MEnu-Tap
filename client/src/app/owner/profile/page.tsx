'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { restaurantApi } from '@/lib/api/restaurant';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CUISINES = ['Indian', 'Chinese', 'Italian', 'Mexican', 'Continental', 'Thai', 'Japanese', 'Mediterranean', 'Fast Food', 'Cafe'];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    restaurantApi.getProfile().then(res => {
      if (res.data) setForm(res.data as Record<string, unknown>);
    }).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false));
  }, []);

  const set = (path: string, value: unknown) => {
    setForm(prev => {
      const parts = path.split('.');
      if (parts.length === 1) return { ...prev, [path]: value };
      const top = parts[0]!;
      return { ...prev, [top]: { ...(prev[top] as Record<string, unknown> || {}), [parts[1]!]: value } };
    });
  };

  const get = (path: string): unknown => {
    const parts = path.split('.');
    if (parts.length === 1) return form[path];
    return (form[parts[0]!] as Record<string, unknown>)?.[parts[1]!];
  };

  const toggleDay = (day: string) => {
    const cur = ((form.operationalInfo as Record<string, unknown>)?.workingDays as string[]) || [];
    const updated = cur.includes(day) ? cur.filter(d => d !== day) : [...cur, day];
    set('operationalInfo.workingDays', updated);
  };

  const toggleCuisine = (c: string) => {
    const cur = ((form.businessDetails as Record<string, unknown>)?.cuisineTypes as string[]) || [];
    const updated = cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c];
    set('businessDetails.cuisineTypes', updated);
  };

  const handleUpload = async (file: File, type: string) => {
    try {
      const res = await restaurantApi.uploadImage(file, type);
      if (type === 'logo') set('logo', res.data?.url);
      else set('coverImage', res.data?.url);
      toast.success('Image uploaded');
    } catch { toast.error('Upload failed'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await restaurantApi.updateProfile(form);
      toast.success('Profile saved');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div>;

  const opInfo = (form.operationalInfo as Record<string, unknown>) || {};
  const bizDetails = (form.businessDetails as Record<string, unknown>) || {};
  const workingDays = (opInfo.workingDays as string[]) || [];
  const cuisineTypes = (bizDetails.cuisineTypes as string[]) || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Images */}
      <Section title="Branding">
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUpload label="Restaurant Logo" url={form.logo as string} onUpload={f => handleUpload(f, 'logo')} />
          <ImageUpload label="Cover Image" url={form.coverImage as string} onUpload={f => handleUpload(f, 'cover')} />
        </div>
      </Section>

      {/* Basic */}
      <Section title="Basic Info">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Restaurant Name" value={get('name') as string} onChange={v => set('name', v)} />
          <Field label="Owner Name" value={get('ownerName') as string} onChange={v => set('ownerName', v)} />
        </div>
        <TextArea label="Description" value={get('description') as string} onChange={v => set('description', v)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Theme Color" type="color" value={(get('branding.themeColor') as string) || '#f97316'} onChange={v => set('branding.themeColor', v)} />
          <Field label="Accent Color" type="color" value={(get('branding.accentColor') as string) || '#ea580c'} onChange={v => set('branding.accentColor', v)} />
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" value={get('contact.phone') as string} onChange={v => set('contact.phone', v)} />
          <Field label="Email" type="email" value={get('contact.email') as string} onChange={v => set('contact.email', v)} />
          <Field label="Website" value={get('contact.website') as string} onChange={v => set('contact.website', v)} />
        </div>
      </Section>

      {/* Business */}
      <Section title="Business Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GST Number" value={bizDetails.gstNumber as string} onChange={v => set('businessDetails.gstNumber', v)} />
          <Field label="FSSAI Number" value={bizDetails.fssaiNumber as string} onChange={v => set('businessDetails.fssaiNumber', v)} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Cuisine Types</p>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map(c => (
              <button key={c} onClick={() => toggleCuisine(c)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${cuisineTypes.includes(c) ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Address */}
      <Section title="Address">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Street" value={get('address.street') as string} onChange={v => set('address.street', v)} />
          <Field label="City" value={get('address.city') as string} onChange={v => set('address.city', v)} />
          <Field label="State" value={get('address.state') as string} onChange={v => set('address.state', v)} />
          <Field label="Postal Code" value={get('address.postalCode') as string} onChange={v => set('address.postalCode', v)} />
          <Field label="Latitude" value={get('address.latitude') as string} onChange={v => set('address.latitude', v)} />
          <Field label="Longitude" value={get('address.longitude') as string} onChange={v => set('address.longitude', v)} />
        </div>
        <Field label="Google Maps URL" value={get('address.googleMapsUrl') as string} onChange={v => set('address.googleMapsUrl', v)} />
      </Section>

      {/* Operational */}
      <Section title="Operational Info">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Opening Time" type="time" value={opInfo.openingTime as string} onChange={v => set('operationalInfo.openingTime', v)} />
          <Field label="Closing Time" type="time" value={opInfo.closingTime as string} onChange={v => set('operationalInfo.closingTime', v)} />
          <Field label="Avg Prep Time (mins)" type="number" value={opInfo.avgPrepTimeMinutes as string} onChange={v => set('operationalInfo.avgPrepTimeMinutes', Number(v))} />
          <Field label="Seating Capacity" type="number" value={opInfo.seatingCapacity as string} onChange={v => set('operationalInfo.seatingCapacity', Number(v))} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Working Days</p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(d => (
              <button key={d} onClick={() => toggleDay(d)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${workingDays.includes(d) ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
          {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
      <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3}
        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
    </div>
  );
}

function ImageUpload({ label, url, onUpload }: { label: string; url?: string; onUpload: (f: File) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-4 hover:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800">
        {url ? (
          <img src={url} alt={label} className="mb-2 h-20 w-20 rounded-lg object-cover" />
        ) : (
          <Upload size={24} className="text-zinc-400" />
        )}
        <span className="mt-1 text-xs text-zinc-400">Click to upload</span>
        <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }} />
      </label>
    </div>
  );
}
