'use client';

import { useEffect, useState, useCallback } from 'react';
import { attendanceApi, staffApi } from '@/lib/api/owner';
import { UserCheck, UserX, Clock } from 'lucide-react';

interface AttendanceRecord {
  _id: string; userId: { firstName: string; lastName: string }; status: string;
  checkIn?: string; checkOut?: string; workingMinutes: number; lateMinutes: number;
}
interface StaffMember { _id: string; firstName: string; lastName: string; email: string }
interface DailyReport { date: string; marked: AttendanceRecord[]; unmarked: StaffMember[]; total: number; present: number }

const STATUS_OPTIONS = ['present', 'absent', 'late', 'half_day', 'leave'];
const STATUS_STYLES: Record<string, string> = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-amber-100 text-amber-700',
  half_day: 'bg-blue-100 text-blue-700',
  leave: 'bg-purple-100 text-purple-700',
};

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({ status: 'present' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.daily(date);
      setReport((res as { data: DailyReport }).data);
    } finally { setLoading(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const openMark = (staff: StaffMember) => {
    setModal(staff);
    setForm({ userId: staff._id, date, status: 'present', checkIn: '', checkOut: '' });
  };

  const save = async () => {
    setSaving(true);
    try {
      await attendanceApi.mark(form);
      setModal(null);
      load();
    } finally { setSaving(false); }
  };

  const mins = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Staff Attendance</h1>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
      </div>

      {/* Summary */}
      {report && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-green-600" /><span className="text-sm text-green-700">Present</span></div>
            <p className="mt-1 text-2xl font-bold text-green-700">{report.present}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center gap-2"><UserX className="h-5 w-5 text-red-600" /><span className="text-sm text-red-700">Absent</span></div>
            <p className="mt-1 text-2xl font-bold text-red-700">{report.marked.filter(r => r.status === 'absent').length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-zinc-500" /><span className="text-sm text-zinc-500">Not Marked</span></div>
            <p className="mt-1 text-2xl font-bold text-zinc-700 dark:text-zinc-300">{report.unmarked.length}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Marked */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Attendance Marked ({report?.marked.length ?? 0})</h3>
            </div>
            <div className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {(report?.marked ?? []).map(rec => (
                <div key={rec._id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {rec.userId?.firstName} {rec.userId?.lastName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      {rec.workingMinutes > 0 ? ` · ${mins(rec.workingMinutes)}` : ''}
                      {rec.lateMinutes > 0 ? ` · Late: ${rec.lateMinutes}m` : ''}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[rec.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                    {rec.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {(report?.marked ?? []).length === 0 && <p className="py-6 text-center text-sm text-zinc-500">No attendance marked yet</p>}
            </div>
          </div>

          {/* Unmarked */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Pending ({report?.unmarked.length ?? 0})</h3>
            </div>
            <div className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {(report?.unmarked ?? []).map(staff => (
                <div key={staff._id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{staff.firstName} {staff.lastName}</p>
                    <p className="text-xs text-zinc-500">{staff.email}</p>
                  </div>
                  <button onClick={() => openMark(staff)} className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600">
                    Mark
                  </button>
                </div>
              ))}
              {(report?.unmarked ?? []).length === 0 && <p className="py-6 text-center text-sm text-zinc-500">All staff marked for today</p>}
            </div>
          </div>
        </div>
      )}

      {/* Mark Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">Mark Attendance — {modal.firstName} {modal.lastName}</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Status</label>
                <select value={form['status'] as string} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              {(form['status'] === 'present' || form['status'] === 'late') && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">Check In</label>
                    <input type="time" value={form['checkIn'] as string} onChange={e => setForm(f => ({ ...f, checkIn: `${date}T${e.target.value}` }))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">Check Out</label>
                    <input type="time" value={form['checkOut'] as string} onChange={e => setForm(f => ({ ...f, checkOut: `${date}T${e.target.value}` }))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                </>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Notes</label>
                <input type="text" value={form['notes'] as string ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
