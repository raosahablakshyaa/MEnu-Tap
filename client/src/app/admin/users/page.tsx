'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminHeader } from '@/components/admin/header';
import { DataTable, StatusBadge, Pagination } from '@/components/admin/data-table';
import { adminApi } from '@/lib/api/admin';
import { AdminUser } from '@/types/admin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.roleSlug = roleFilter;
      const res = await adminApi.users.list(params);
      if (res.data) { setUsers(res.data.items); setTotalPages(res.data.totalPages); }
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div>
      <AdminHeader title="Users" />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg border border-zinc-200/50 bg-white/60 px-3 py-2 text-sm dark:border-zinc-700/50 dark:bg-zinc-900/40">
            <option value="">All Roles</option>
            <option value="restaurant_owner">Owner</option>
            <option value="restaurant_manager">Manager</option>
            <option value="kitchen_staff">Kitchen Staff</option>
            <option value="waiter">Waiter</option>
            <option value="customer">Customer</option>
          </select>
          <Button onClick={() => { setPage(1); fetchUsers(); }}>Search</Button>
        </div>

        <DataTable<AdminUser & Record<string, unknown>>
          loading={loading}
          data={users as (AdminUser & Record<string, unknown>)[]}
          columns={[
            { key: 'name', header: 'Name', render: (u) => `${u.firstName as string} ${u.lastName as string}` },
            { key: 'email', header: 'Email' },
            { key: 'role', header: 'Role', render: (u) => (u.roleId as { name: string })?.name || '-' },
            { key: 'restaurant', header: 'Restaurant', render: (u) => (u.restaurantId as { name: string })?.name || 'Platform' },
            { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.isActive ? 'active' : 'suspended'} /> },
            { key: 'actions', header: 'Actions', render: (u) => (
              <div className="flex gap-2">
                {u.isActive ? (
                  <Button size="sm" variant="outline" onClick={async () => { await adminApi.users.suspend(u._id as string); toast.success('Suspended'); fetchUsers(); }}>Suspend</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={async () => { await adminApi.users.activate(u._id as string); toast.success('Activated'); fetchUsers(); }}>Activate</Button>
                )}
              </div>
            )},
          ]}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
