'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, Trash2, Loader2, UserX, UserCheck, Mail, Clock,
  Search, X, Send, Users, ChevronDown, Shield, ChefHat,
  Coffee, CreditCard, CheckCircle2,
} from 'lucide-react';
import { staffApi } from '@/lib/api/owner';
import { StaffMember, StaffInvitation } from '@/types/owner';
import { Button } from '@/components/ui/button';

const STAFF_ROLES = [
  { value: 'restaurant_manager', label: 'Manager',       icon: Shield,   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { value: 'kitchen_staff',      label: 'Kitchen Staff', icon: ChefHat,  color: '#b91c1c', bg: '#fff1f2', border: '#fecdd3' },
  { value: 'waiter',             label: 'Waiter',        icon: Coffee,   color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  { value: 'cashier',            label: 'Cashier',       icon: CreditCard,color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
];

const getRoleInfo = (slug: string) =>
  STAFF_ROLES.find(r => r.value === slug) ?? { label: slug, color: 'var(--foreground-muted)', bg: 'var(--surface-raised)', border: 'var(--border)', icon: Shield };

function RoleBadge({ slug }: { slug: string }) {
  const r = getRoleInfo(slug);
  const Icon = r.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}` }}>
      <Icon size={9} /> {r.label}
    </span>
  );
}

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ background: color }}>
      {initials}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors';
const inputStyle = { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' };

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', roleSlug: 'waiter' });
  const [inviting, setInviting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [tab, setTab] = useState<'staff' | 'invitations'>('staff');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([staffApi.list(), staffApi.getInvitations()])
      .then(([s, i]) => {
        if (s.data) setStaff(s.data as StaffMember[]);
        if (i.data) setInvitations(i.data as StaffInvitation[]);
      })
      .catch(() => toast.error('Failed to load staff'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    if (!inviteForm.email.trim()) { toast.error('Email is required'); return; }
    setInviting(true);
    try {
      await staffApi.invite(inviteForm);
      toast.success(`Invite sent to ${inviteForm.email}`);
      setShowInvite(false);
      setInviteForm({ email: '', roleSlug: 'waiter' });
      load();
    } catch (e: unknown) { toast.error((e as Error).message || 'Failed to send invite'); }
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
    if (!confirm('Remove this staff member?')) return;
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
  const filteredStaff = staff.filter(m =>
    !search || m.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-[1200px]">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="flex rounded-xl p-1 gap-1" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
          {([
            { key: 'staff',       label: 'Team Members', count: staff.length },
            { key: 'invitations', label: 'Invitations',  count: pendingInvitations.length },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
              style={tab === t.key
                ? { background: 'var(--surface)', color: 'var(--foreground)', boxShadow: 'var(--card-shadow)' }
                : { color: 'var(--foreground-muted)' }
              }>
              {t.label}
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={tab === t.key
                  ? { background: 'var(--primary-light)', color: 'var(--primary)' }
                  : { background: 'var(--border)', color: 'var(--foreground-muted)' }
                }>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        {tab === 'staff' && (
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--foreground-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search staff..."
              className={inputCls}
              style={{ ...inputStyle, paddingLeft: '2.25rem' }} />
          </div>
        )}

        <div className="flex-1" />

        <Button onClick={() => setShowInvite(true)} className="gap-2 shrink-0">
          <Plus size={15} /> Invite Staff
        </Button>
      </div>

      {/* ── Invite Modal ── */}
      <AnimatePresence>
        {showInvite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowInvite(false); }}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-[480px] rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-warm)' }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl food-gradient">
                    <Users size={16} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Invite Staff Member</h2>
                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Send an email invitation to join your team</p>
                  </div>
                </div>
                <button onClick={() => setShowInvite(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                  style={{ color: 'var(--foreground-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <X size={15} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--foreground-muted)' }} />
                    <input type="email" value={inviteForm.email}
                      onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleInvite()}
                      placeholder="staff@yourrestaurant.com"
                      className={inputCls}
                      style={{ ...inputStyle, paddingLeft: '2.25rem' }} />
                  </div>
                </div>

                {/* Role Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>
                    Role *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {STAFF_ROLES.map(role => {
                      const Icon = role.icon;
                      const selected = inviteForm.roleSlug === role.value;
                      return (
                        <button key={role.value} type="button"
                          onClick={() => setInviteForm(p => ({ ...p, roleSlug: role.value }))}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-left transition-all"
                          style={{
                            background: selected ? role.bg : 'var(--surface-raised)',
                            border: `1.5px solid ${selected ? role.color : 'var(--border)'}`,
                            boxShadow: selected ? `0 0 0 3px ${role.border}` : 'none',
                          }}>
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                            style={{ background: selected ? role.color : 'var(--border)', transition: 'all 0.15s' }}>
                            <Icon size={13} style={{ color: selected ? '#fff' : 'var(--foreground-muted)' }} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold" style={{ color: selected ? role.color : 'var(--foreground)' }}>{role.label}</p>
                          </div>
                          {selected && (
                            <CheckCircle2 size={14} className="ml-auto shrink-0" style={{ color: role.color }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role description */}
                <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                  {inviteForm.roleSlug === 'restaurant_manager' && <p style={{ color: 'var(--foreground-muted)' }}>🛡️ <strong>Manager</strong> — Full access to dashboard, staff, menu, orders and reports. Cannot change subscription.</p>}
                  {inviteForm.roleSlug === 'kitchen_staff' && <p style={{ color: 'var(--foreground-muted)' }}>👨‍🍳 <strong>Kitchen Staff</strong> — Access to kitchen display, order queue and inventory view.</p>}
                  {inviteForm.roleSlug === 'waiter' && <p style={{ color: 'var(--foreground-muted)' }}>☕ <strong>Waiter</strong> — Access to table orders, QR orders and order status updates.</p>}
                  {inviteForm.roleSlug === 'cashier' && <p style={{ color: 'var(--foreground-muted)' }}>💳 <strong>Cashier</strong> — Access to POS billing, payments and daily summary.</p>}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                <Button onClick={handleInvite} disabled={inviting} className="flex-1 gap-2">
                  {inviting
                    ? <><Loader2 size={14} className="animate-spin" /> Sending...</>
                    : <><Send size={14} /> Send Invitation</>}
                </Button>
                <Button variant="outline" onClick={() => setShowInvite(false)} className="px-5">
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Staff Tab ── */}
      {tab === 'staff' && (
        loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 skeleton" />)}
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl py-20"
            style={{ border: '2px dashed var(--border)' }}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
              style={{ background: 'var(--surface-raised)' }}>👥</div>
            <p className="mt-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              {search ? 'No staff match your search' : 'No staff members yet'}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--foreground-muted)' }}>
              {search ? 'Try a different name or email' : 'Invite your team to get started'}
            </p>
            {!search && (
              <Button onClick={() => setShowInvite(true)} className="mt-5 gap-2">
                <Plus size={14} /> Invite First Staff Member
              </Button>
            )}
          </div>
        ) : (
          <div className="content-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Change Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(member => {
                  const roleInfo = getRoleInfo(member.roleId?.slug || '');
                  return (
                    <tr key={member._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={member.fullName || `${member.firstName} ${member.lastName}`} color={roleInfo.color} />
                          <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{member.fullName}</p>
                            <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><RoleBadge slug={member.roleId?.slug || ''} /></td>
                      <td>
                        <span className="badge" style={member.isActive
                          ? { background: '#dcfce7', color: '#14532d' }
                          : { background: 'var(--surface-raised)', color: 'var(--foreground-muted)' }}>
                          {member.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td>
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                          <Clock size={11} />
                          {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString('en-IN') : 'Never'}
                        </span>
                      </td>
                      <td>
                        <div className="relative">
                          <select value={member.roleId?.slug || ''}
                            onChange={e => handleRoleChange(member._id, e.target.value)}
                            className="appearance-none rounded-lg border pl-3 pr-7 py-1.5 text-xs cursor-pointer"
                            style={{ background: 'var(--surface-raised)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                            {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                          <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--foreground-muted)' }} />
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {member.isActive ? (
                            <button onClick={() => handleSuspend(member._id)} disabled={actionId === member._id}
                              title="Suspend"
                              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                              style={{ color: '#d97706' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#fef3c7')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              {actionId === member._id ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} />}
                            </button>
                          ) : (
                            <button onClick={() => handleActivate(member._id)} disabled={actionId === member._id}
                              title="Activate"
                              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                              style={{ color: '#16a34a' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#dcfce7')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              {actionId === member._id ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                            </button>
                          )}
                          <button onClick={() => handleRemove(member._id)} disabled={actionId === member._id}
                            title="Remove"
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                            style={{ color: 'var(--danger)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Invitations Tab ── */}
      {tab === 'invitations' && (
        invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl py-20"
            style={{ border: '2px dashed var(--border)' }}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
              style={{ background: 'var(--surface-raised)' }}>📬</div>
            <p className="mt-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>No invitations sent yet</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--foreground-muted)' }}>Invite team members to join your restaurant</p>
            <Button onClick={() => setShowInvite(true)} className="mt-5 gap-2">
              <Plus size={14} /> Send First Invite
            </Button>
          </div>
        ) : (
          <div className="content-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map(inv => (
                  <tr key={inv._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full"
                          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                          <Mail size={13} style={{ color: 'var(--foreground-muted)' }} />
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{inv.email}</span>
                      </div>
                    </td>
                    <td><RoleBadge slug={inv.roleSlug} /></td>
                    <td>
                      <span className="badge" style={
                        inv.status === 'pending'  ? { background: '#fef3c7', color: '#78350f' } :
                        inv.status === 'accepted' ? { background: '#dcfce7', color: '#14532d' } :
                        { background: 'var(--surface-raised)', color: 'var(--foreground-muted)' }
                      }>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                        {new Date(inv.expiresAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td>
                      {inv.status === 'pending' && (
                        <button onClick={() => handleCancelInvitation(inv._id)} disabled={actionId === inv._id}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
                          style={{ color: 'var(--danger)', border: '1px solid var(--border)', background: 'var(--surface-raised)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-raised)')}>
                          {actionId === inv._id ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
