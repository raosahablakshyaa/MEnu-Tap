'use client';

import { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/admin/header';
import { adminApi } from '@/lib/api/admin';
import { PlatformSettings } from '@/types/admin';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.settings.get().then((res) => {
      if (res.data) setSettings(res.data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await adminApi.settings.update(settings as unknown as Record<string, unknown>);
      if (res.data) { setSettings(res.data); toast.success('Settings saved'); }
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const toggleMaintenance = async () => {
    if (!settings) return;
    try {
      const res = await adminApi.settings.toggleMaintenance(!settings.maintenanceMode);
      if (res.data) { setSettings(res.data as PlatformSettings); toast.success(`Maintenance ${!settings.maintenanceMode ? 'enabled' : 'disabled'}`); }
    } catch { toast.error('Failed'); }
  };

  if (loading || !settings) {
    return (
      <div>
        <AdminHeader title="Settings" />
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Settings" />
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-6 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/40">
          <h2 className="mb-4 text-lg font-semibold">General</h2>
          <div className="space-y-4">
            <div>
              <Label>Platform Name</Label>
              <Input value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Currency</Label>
                <Input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} />
              </div>
              <div>
                <Label>Tax Rate (%)</Label>
                <Input type="number" value={settings.taxRate} onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-6 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Maintenance Mode</h2>
              <p className="text-sm text-zinc-500">Disable access for all non-admin users</p>
            </div>
            <Button variant={settings.maintenanceMode ? 'destructive' : 'outline'} onClick={toggleMaintenance}>
              {settings.maintenanceMode ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-6 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/40">
          <h2 className="mb-4 text-lg font-semibold">Razorpay</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Key ID</Label>
              <Input value={(settings.razorpay?.keyId as string) || ''} onChange={(e) => setSettings({ ...settings, razorpay: { ...settings.razorpay, keyId: e.target.value } })} />
            </div>
            <div>
              <Label>Key Secret</Label>
              <Input type="password" value={(settings.razorpay?.keySecret as string) || ''} onChange={(e) => setSettings({ ...settings, razorpay: { ...settings.razorpay, keySecret: e.target.value } })} />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
