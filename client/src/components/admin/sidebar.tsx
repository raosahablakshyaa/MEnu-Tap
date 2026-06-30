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
  { href: '/admin',               label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/admin/restaurants',   label: 'Restaurants',   icon: Store },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/revenue',       label: 'Revenue',       icon: IndianRupee },
  { href: '/admin/users',         label: 'Users',         icon: Users },
  { href: '/admin/coupons',       label: 'Coupons',       icon: Ticket },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/support',       label: 'Support',       icon: HeadphonesIcon },
  { href: '/admin/audit-logs',    label: 'Audit Logs',    icon: ScrollText },
  { href: '/admin/reports',       label: 'Reports',       icon: FileText },
  { href: '/admin/settings',      label: 'Settings',      icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn('fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-300 ease-in-out', collapsed ? 'w-[60px]' : 'w-[220px]')}
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* Logo */}
      <div className="flex h-[56px] items-center justify-between px-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🍽️</span>
            <div>
              <p className="text-[13px] font-bold leading-none" style={{ color: '#fef3c7', fontFamily: 'Playfair Display, Georgia, serif' }}>TapMenu</p>
              <p className="text-[9px] mt-0.5 uppercase tracking-widest" style={{ color: 'var(--sidebar-text)', opacity: 0.55 }}>Super Admin</p>
            </div>
          </div>
        )}
        {collapsed && <span className="mx-auto text-xl">🍽️</span>}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="ml-2 rounded-md p-1" style={{ color: 'var(--sidebar-text)' }}>
            <ChevronLeft size={14} />
          </button>
        )}
        {collapsed && (
          <button onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-[72px] z-10 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm"
            style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text)' }}>
            <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} title={collapsed ? label : undefined}
              className={cn('sidebar-nav-item', active && 'active', collapsed && 'justify-center px-0')}>
              <Icon size={15} className="shrink-0" style={{ color: active ? 'var(--sidebar-active-accent)' : 'var(--sidebar-text)' }} />
              {!collapsed && <span style={{ color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)' }}>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          <p className="text-[10px]" style={{ color: 'var(--sidebar-text)', opacity: 0.35 }}>🍽️ TapMenu v7.0</p>
        </div>
      )}
    </aside>
  );
}
