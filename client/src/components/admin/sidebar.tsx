'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Store, CreditCard, IndianRupee, Users, Ticket,
  Bell, HeadphonesIcon, FileText, ScrollText, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/restaurants', label: 'Restaurants', icon: Store },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/revenue', label: 'Revenue', icon: IndianRupee },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/support', label: 'Support', icon: HeadphonesIcon },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-zinc-200/50 bg-white/70 backdrop-blur-xl transition-all duration-300 dark:border-zinc-800/50 dark:bg-zinc-950/70',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-zinc-200/50 px-4 dark:border-zinc-800/50">
        {!collapsed && (
          <Link href="/admin" className="text-xl font-bold tracking-tight text-orange-500">
            TapMenu
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
              )}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-zinc-200/50 p-4 dark:border-zinc-800/50">
          <p className="text-xs text-zinc-400">TapMenu Admin v2.0</p>
        </div>
      )}
    </aside>
  );
}
