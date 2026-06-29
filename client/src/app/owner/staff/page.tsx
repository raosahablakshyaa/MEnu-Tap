'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, UserX, UserCheck, Mail, Shield, Clock } from 'lucide-react';
import { staffApi } from '@/lib/api/owner';
import { StaffMember, StaffInvitation } from '@/types/owner';
import { Button } from '@/components/ui/button';

const STAFF_ROLES = [
  { value: 'restaurant_manager', label: 'Manager' },
  { value: 'kitchen_staff', label: 'Kitchen Staff' },
  { value: 'waiter', label: 'Waiter' },
  { value: 'cashier', label: 'Cashier' },
];

const ROLE_COLORS: Record<string, string> = {
  restaurant_manager: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  kitchen_staff: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  waiter: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  cashier: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', roleSlug: 'waiter' });
  const [inviting, setInviting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [tab, setTab] = useState<'staff' | 'invitations'>('staff');

  const load = () => {
    setLoading(true);
    Promise.all([staffApi.list(), staffApi.getInvitations()])
      .then(([s, i]) => {
        if (s.data) setStaff(s.data as StaffMember[]);
        if (i.data) setInvitations(i.data as StaffInvitation[]);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    if (!inviteForm.email.trim()) { toast.error('Email required'); return; }
    setInviting(true);
    try {
      await staffApi.invite(inviteForm);
      toast.success('Invitation sent to ' + inviteForm.email);
      setShowInvite(false);
      setInviteForm({ email: '', roleSlug: 'waiter' });
      load();
    } catch (e: unknown) { toast.error((e as Error).message || 'Failed to invite'); }
    finally { setInviting(false); }
  };

  const handleSuspend = async (id: string) => {
    setActionId(id);
    try { await staffApi.suspend(id); toast.success('Staff suspended'); load(); }
    catch { toast.error('Failed'); } finally { setActionId(null); }
  };

  const handleActivate = async (id: string) => {
    setActionId(id);
    try { await staffApi.activate(id); toast.success('Staff activated'); load(); }
    catch { toast.error('Failed'); } finally { setActionId(null); }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this staff member? This cannot be undone.')) return;
    setActionId(id);
    try { await staffApi.remove(id); toast.success('Staff removed'); load(); }
    catch { toast.error('Failed'); } finally { setActionId(null); }
  };

  const handleCancelInvitation = async (id: string) => {
    setActionId(id);
    try { await staffApi.cancelInvitation(id); toast.success('Invitation cancelled'); load(); }
    catch { toast.error('Failed'); } finally { setActionId(null); }
  };

  const handleRoleChange = async (id: string, roleSlug: string) => {
    try { await staffApi.updateRole(id, roleSlug); toast.success('Role updated'); load(); }
    catch { toast.error('Failed to update role'); }
  };

  const pendingInvitations = invitations.filter(i => i.status === 'pending');

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
          {(['staff', 'invitations'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
              {t === 'staff' ? `Staff (${staff.length})` : `Invitations (${pendingInvitations.length})`}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Button onClick={() => setShowInvite(true)} className="gap-2 bg-orange-600 hover:bg-orange-700">
          <Plus size={16} /> Invite Staff
        </Button>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="mb-4 text-base font-semibold">Invite Staff Member</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Email Address *</label>
                  <input type="email" value={inviteForm.email}
                    onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
                    className={ic} placeholder="staff@example.com" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Role *</label>
                  <select value={inviteForm.roleSlug}
                    onChange={e => setInviteForm(p => ({ ...p, roleSlug: e.target.value }))}
                    className={ic}>
                    {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <Button onClick={handleInvite} disabled={inviting} className="flex-1 bg-orange-600 hover:bg-orange-700">
                  {inviting && <Loader2 size={14} className="mr-2 animate-spin" />}
                  Send Invite
                </Button>
                <Button variant="outline" onClick={() => setShowInvite(false)} className="flex-1">Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff Tab */}
      {tab === 'staff' && (
        loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />)}
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-700">
            <span className="text-4xl">👥</span>
            <p className="mt-3 text-sm text-zinc-500">No staff members yet. Invite your team.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {staff.map(member => (
              <motion.div key={member._id} layout
                className="flex items-center gap-4 rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/40">
                  <span className="text-sm font-bold text-orange-600">{member.firstName[0]}{member.lastName[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{member.fullName}</p>
                  <p className="text-xs text-zinc-400 truncate">{member.email}</p>
                  {member.lastLoginAt && (
                    <p className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                      <Clock size={11} /> Last login: {new Date(member.lastLoginAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={member.roleId?.slug || ''}
                    onChange={e => handleRoleChange(member._id, e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${member.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
                    {member.isActive ? 'Active' : 'Suspended'}
                  </span>
                  {member.isActive ? (
                    <button onClick={() => handleSuspend(member._id)} disabled={actionId === member._id}
                      title="Suspend" className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                      {actionId === member._id ? <Loader2 size={15} className="animate-spin" /> : <UserX size={15} />}
                    </button>
                  ) : (
                    <button onClick={() => handleActivate(member._id)} disabled={actionId === member._id}
                      title="Activate" className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                      {actionId === member._id ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />}
                    </button>
                  )}
                  <button onClick={() => handleRemove(member._id)} disabled={actionId === member._id}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* Invitations Tab */}
      {tab === 'invitations' && (
        invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-700">
            <Mail size={36} className="text-zinc-300" />
            <p className="mt-3 text-sm text-zinc-500">No invitations sent yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map(inv => (
              <motion.div key={inv._id} layout
                className="flex items-center gap-4 rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <Mail size={18} className="text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{inv.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[inv.roleSlug] || 'bg-zinc-100 text-zinc-500'}`}>
                      {STAFF_ROLES.find(r => r.value === inv.roleSlug)?.label || inv.roleSlug}
                    </span>
                    <span className="text-xs text-zinc-400">
                      Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    inv.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                    inv.status === 'accepted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                    'bg-zinc-100 text-zinc-500'
                  }`}>
                    {inv.status}
                  </span>
                  {inv.status === 'pending' && (
                    <button onClick={() => handleCancelInvitation(inv._id)} disabled={actionId === inv._id}
                      className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                      {actionId === inv._id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

const ic = 'w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';
