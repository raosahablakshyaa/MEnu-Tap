'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { restaurantApi } from '@/lib/api/restaurant';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Save, MapPin, Phone, Building2, Clock, Tag } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CUISINES = ['Indian', 'North Indian', 'South Indian', 'Mughlai', 'Chinese', 'Italian', 'Mexican', 'Continental', 'Thai', 'Japanese', 'Mediterranean', 'Fast Food', 'Cafe', 'Bakery', 'Seafood'];
const REST_TYPES = ['Fine Dining', 'Casual Dining', 'Quick Service', 'Cafe', 'Cloud Kitchen', 'Bar & Lounge', 'Food Truck', 'Dhaba', 'Other'];

const inputCls = 'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors';
const inputStyle = { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' };

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    restaurantApi.getProfile()
      .then(res => { if (res.data) setForm(res.data as Record<string, unknown>); })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
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
    set('operationalInfo.workingDays', cur.includes(day) ? cur.filter(d => d !== day) : [...cur, day]);
  };

  const toggleCuisine = (c: string) => {
    const cur = ((form.businessDetails as Record<string, unknown>)?.cuisineTypes as string[]) || [];
    set('businessDetails.cuisineTypes', cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c]);
  };

  const handleUpload = async (file: File, type: string) => {
    try {
      const res = await restaurantApi.uploadImage(file, type);
      if (type === 'logo') set('logo', res.data?.url);
      else set('coverImage', res.data?.url);
      toast.success('Image uploaded');
    } catch { toast.error('Upload failed — Cloudinary not configured'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await restaurantApi.updateProfile(form);
      toast.success('Profile saved successfully');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-t-transparent" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
      </div>
    );
  }

  const opInfo = (form.operationalInfo as Record<string, unknown>) || {};
  const bizDetails = (form.businessDetails as Record<string, unknown>) || {};
  const workingDays = (opInfo.workingDays as string[]) || [];
  const cuisineTypes = (bizDetails.cuisineTypes as string[]) || [];

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-10">

      {/* ── Branding ── */}
      <Section icon={<span className="text-base">🎨</span>} title="Branding & Images">
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUpload label="Restaurant Logo" url={form.logo as string} onUpload={f => handleUpload(f, 'logo')} />
          <ImageUpload label="Cover Image" url={form.coverImage as string} onUpload={f => handleUpload(f, 'cover')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 mt-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>Theme Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={(get('branding.themeColor') as string) || '#b91c1c'}
                onChange={e => set('branding.themeColor', e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-lg border p-1" style={{ borderColor: 'var(--border)' }} />
              <input value={(get('branding.themeColor') as string) || '#b91c1c'}
                onChange={e => set('branding.themeColor', e.target.value)}
                className={inputCls} style={inputStyle} placeholder="#b91c1c" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>Accent Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={(get('branding.accentColor') as string) || '#d97706'}
                onChange={e => set('branding.accentColor', e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-lg border p-1" style={{ borderColor: 'var(--border)' }} />
              <input value={(get('branding.accentColor') as string) || '#d97706'}
                onChange={e => set('branding.accentColor', e.target.value)}
                className={inputCls} style={inputStyle} placeholder="#d97706" />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Basic Info ── */}
      <Section icon={<Building2 size={15} style={{ color: 'var(--primary)' }} />} title="Basic Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Restaurant Name *" value={get('name') as string} onChange={v => set('name', v)} />
          <Field label="Owner Name" value={get('ownerName') as string} onChange={v => set('ownerName', v)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>Description</label>
          <textarea value={(get('description') as string) || ''} onChange={e => set('description', e.target.value)} rows={3}
            className={inputCls} style={inputStyle}
            placeholder="Tell customers about your restaurant..." />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>Restaurant Type</label>
          <select value={(bizDetails.restaurantType as string) || ''} onChange={e => set('businessDetails.restaurantType', e.target.value)}
            className={inputCls} style={inputStyle}>
            <option value="">Select type</option>
            {REST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </Section>

      {/* ── Contact ── */}
      <Section icon={<Phone size={15} style={{ color: 'var(--primary)' }} />} title="Contact Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone *" value={get('contact.phone') as string} onChange={v => set('contact.phone', v)} placeholder="+91 98765 43210" />
          <Field label="Email *" type="email" value={get('contact.email') as string} onChange={v => set('contact.email', v)} />
          <Field label="Website" value={get('contact.website') as string} onChange={v => set('contact.website', v)} placeholder="https://yourrestaurant.com" />
        </div>
      </Section>

      {/* ── Business Details ── */}
      <Section icon={<Tag size={15} style={{ color: 'var(--primary)' }} />} title="Business Details">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="GST Number" value={bizDetails.gstNumber as string} onChange={v => set('businessDetails.gstNumber', v)} placeholder="27AABCU9603R1ZX" />
          <Field label="FSSAI Number" value={bizDetails.fssaiNumber as string} onChange={v => set('businessDetails.fssaiNumber', v)} />
          <Field label="PAN Number" value={bizDetails.panNumber as string} onChange={v => set('businessDetails.panNumber', v)} placeholder="ABCDE1234F" />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>Cuisine Types</label>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map(c => (
              <button key={c} type="button" onClick={() => toggleCuisine(c)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-all"
                style={cuisineTypes.includes(c)
                  ? { background: 'var(--primary)', color: '#fff' }
                  : { background: 'var(--surface-raised)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }
                }>
                {c}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Address ── */}
      <Section icon={<MapPin size={15} style={{ color: 'var(--primary)' }} />} title="Address">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Street Address" value={get('address.street') as string} onChange={v => set('address.street', v)} placeholder="42, Marine Drive..." />
          </div>
          <Field label="City" value={get('address.city') as string} onChange={v => set('address.city', v)} />
          <Field label="State" value={get('address.state') as string} onChange={v => set('address.state', v)} />
          <Field label="Postal Code" value={get('address.postalCode') as string} onChange={v => set('address.postalCode', v)} />
          <Field label="Country" value={get('address.country') as string} onChange={v => set('address.country', v)} />
          <Field label="Latitude" value={get('address.latitude') as string} onChange={v => set('address.latitude', v)} placeholder="18.9432" />
          <Field label="Longitude" value={get('address.longitude') as string} onChange={v => set('address.longitude', v)} placeholder="72.8236" />
          <div className="sm:col-span-2">
            <Field label="Google Maps URL" value={get('address.googleMapsUrl') as string} onChange={v => set('address.googleMapsUrl', v)} placeholder="https://maps.google.com/..." />
          </div>
        </div>
      </Section>

      {/* ── Operational Info ── */}
      <Section icon={<Clock size={15} style={{ color: 'var(--primary)' }} />} title="Operating Hours & Capacity">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Opening Time" type="time" value={opInfo.openingTime as string} onChange={v => set('operationalInfo.openingTime', v)} />
          <Field label="Closing Time" type="time" value={opInfo.closingTime as string} onChange={v => set('operationalInfo.closingTime', v)} />
          <Field label="Avg Prep Time (min)" type="number" value={String(opInfo.avgPrepTimeMinutes || '')} onChange={v => set('operationalInfo.avgPrepTimeMinutes', Number(v))} />
          <Field label="Seating Capacity" type="number" value={String(opInfo.seatingCapacity || '')} onChange={v => set('operationalInfo.seatingCapacity', Number(v))} />
          <Field label="Number of Tables" type="number" value={String(opInfo.numberOfTables || '')} onChange={v => set('operationalInfo.numberOfTables', Number(v))} />
          <Field label="Number of Floors" type="number" value={String(opInfo.numberOfFloors || '')} onChange={v => set('operationalInfo.numberOfFloors', Number(v))} />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>Working Days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(d => (
              <button key={d} type="button" onClick={() => toggleDay(d)}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={workingDays.includes(d)
                  ? { background: 'var(--primary)', color: '#fff' }
                  : { background: 'var(--surface-raised)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }
                }>
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Save Button ── */}
      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2 px-8">
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
        </Button>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="content-card p-6 space-y-4">
      <div className="flex items-center gap-2 pb-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {icon}
        <h2 className="text-sm font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Playfair Display, Georgia, serif' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
    </div>
  );
}

function ImageUpload({ label, url, onUpload }: { label: string; url?: string; onUpload: (f: File) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>{label}</p>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl p-4 transition-colors"
        style={{ border: '2px dashed var(--border)', background: 'var(--surface-raised)' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
        {url ? (
          <img src={url} alt={label} className="mb-2 h-20 w-20 rounded-xl object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: 'var(--border)' }}>
            <Upload size={20} style={{ color: 'var(--foreground-muted)' }} />
          </div>
        )}
        <span className="mt-2 text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
          {url ? 'Click to change' : 'Click to upload'}
        </span>
        <input type="file" accept="image/*" className="hidden"
          onChange={e => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }} />
      </label>
    </div>
  );
}
