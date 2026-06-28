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
      { label: 'Dashboard', href: '/owner', icon: LayoutDashboard },
      { label: 'Executive', href: '/owner/executive', icon: TrendingUp },
      { label: 'AI Advisor', href: '/owner/ai-advisor', icon: Brain },
      { label: 'Analytics', href: '/owner/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'POS', href: '/owner/pos', icon: Monitor },
      { label: 'Menu', href: '/owner/menu', icon: UtensilsCrossed },
      { label: 'Categories', href: '/owner/categories', icon: FolderOpen },
      { label: 'Tables', href: '/owner/tables', icon: Table2 },
      { label: 'QR Codes', href: '/owner/qr', icon: QrCode },
    ],
  },
  {
    label: 'Inventory & Purchasing',
    items: [
      { label: 'Inventory', href: '/owner/inventory', icon: Package },
      { label: 'Recipes', href: '/owner/recipes', icon: ChefHat },
      { label: 'Suppliers', href: '/owner/suppliers', icon: Truck },
      { label: 'Purchase Orders', href: '/owner/purchase-orders', icon: ShoppingCart },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Expenses', href: '/owner/expenses', icon: DollarSign },
      { label: 'Export Data', href: '/owner/export', icon: Download },
      { label: 'Subscription', href: '/owner/subscription', icon: CreditCard },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Staff', href: '/owner/staff', icon: Users },
      { label: 'Attendance', href: '/owner/attendance', icon: Clock },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'Branches', href: '/owner/branches', icon: Building2 },
      { label: 'Profile', href: '/owner/profile', icon: User },
      { label: 'Settings', href: '/owner/settings', icon: Settings },
    ],
  },
];

export default function OwnerSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      'flex h-full flex-col border-r border-zinc-200/60 bg-white/80 backdrop-blur-xl transition-all duration-300 dark:border-zinc-800/60 dark:bg-zinc-900/80',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
        {!collapsed && <span className="text-lg font-bold text-orange-600">TapMenu</span>}
        <button onClick={() => setCollapsed(p => !p)}
          className="ml-auto rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || (href !== '/owner' && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link href={href} title={collapsed ? label : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                      )}>
                      <Icon size={18} className="shrink-0" />
                      {!collapsed && label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
