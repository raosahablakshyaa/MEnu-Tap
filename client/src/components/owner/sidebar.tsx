'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, UtensilsCrossed, FolderOpen, Table2, QrCode,
  Users, BarChart3, CreditCard, Settings, User, ChevronLeft, ChevronRight,
  Brain, Package, ChefHat, Truck, ShoppingCart, DollarSign, Building2,
  Clock, Monitor, TrendingUp, Download,
} from 'lucide-react';
import { useState } from 'react';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard',  href: '/owner',            icon: LayoutDashboard },
      { label: 'Executive',  href: '/owner/executive',  icon: TrendingUp },
      { label: 'AI Advisor', href: '/owner/ai-advisor', icon: Brain },
      { label: 'Analytics',  href: '/owner/analytics',  icon: BarChart3 },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'POS',        href: '/owner/pos',        icon: Monitor },
      { label: 'Menu',       href: '/owner/menu',       icon: UtensilsCrossed },
      { label: 'Categories', href: '/owner/categories', icon: FolderOpen },
      { label: 'Tables',     href: '/owner/tables',     icon: Table2 },
      { label: 'QR Codes',   href: '/owner/qr',         icon: QrCode },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Inventory',       href: '/owner/inventory',       icon: Package },
      { label: 'Recipes',         href: '/owner/recipes',         icon: ChefHat },
      { label: 'Suppliers',       href: '/owner/suppliers',       icon: Truck },
      { label: 'Purchase Orders', href: '/owner/purchase-orders', icon: ShoppingCart },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Expenses',     href: '/owner/expenses',     icon: DollarSign },
      { label: 'Export',       href: '/owner/export',       icon: Download },
      { label: 'Subscription', href: '/owner/subscription', icon: CreditCard },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Staff',      href: '/owner/staff',      icon: Users },
      { label: 'Attendance', href: '/owner/attendance', icon: Clock },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Branches', href: '/owner/branches', icon: Building2 },
      { label: 'Profile',  href: '/owner/profile',  icon: User },
      { label: 'Settings', href: '/owner/settings', icon: Settings },
    ],
  },
];

export default function OwnerSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex h-full flex-col transition-all duration-300 ease-in-out flex-shrink-0',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* Logo */}
      <div
        className="flex h-[56px] items-center justify-between px-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--sidebar-border)' }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg food-gradient">
              <UtensilsCrossed size={13} className="text-white" />
            </div>
            <div>
              <span className="text-[14px] font-bold leading-none" style={{ color: '#fef3c7', fontFamily: 'Playfair Display, Georgia, serif' }}>TapMenu</span>
              <p className="text-[9px] mt-0.5 uppercase tracking-widest" style={{ color: 'var(--sidebar-text)', opacity: 0.6 }}>Restaurant OS</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg food-gradient">
            <UtensilsCrossed size={13} className="text-white" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="ml-2 rounded-md p-1 transition-colors"
            style={{ color: 'var(--sidebar-text)' }}
          >
            <ChevronLeft size={14} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-[72px] z-10 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm"
            style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text)' }}
          >
            <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p
                className="mb-1 px-3 text-[9px] font-bold uppercase tracking-[0.12em]"
                style={{ color: 'var(--sidebar-text)', opacity: 0.45 }}
              >
                {group.label}
              </p>
            )}
            {collapsed && (
              <div className="mx-3 my-1 h-px" style={{ background: 'var(--sidebar-border)' }} />
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || (href !== '/owner' && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      title={collapsed ? label : undefined}
                      className={cn('sidebar-nav-item', active && 'active', collapsed && 'justify-center px-0')}
                    >
                      <Icon
                        size={15}
                        className="shrink-0"
                        style={{ color: active ? 'var(--sidebar-active-accent)' : 'var(--sidebar-text)' }}
                      />
                      {!collapsed && (
                        <span style={{ color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)' }}>
                          {label}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div
          className="px-4 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid var(--sidebar-border)' }}
        >
          <p className="text-[10px]" style={{ color: 'var(--sidebar-text)', opacity: 0.35 }}>
            🍽️ TapMenu v7.0
          </p>
        </div>
      )}
    </aside>
  );
}
