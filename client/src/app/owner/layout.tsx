'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import OwnerSidebar from '@/components/owner/sidebar';
import OwnerTopbar from '@/components/owner/topbar';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/owner': 'Dashboard',
  '/owner/executive': 'Executive Dashboard',
  '/owner/menu': 'Menu Management',
  '/owner/categories': 'Categories',
  '/owner/tables': 'Table Management',
  '/owner/qr': 'QR Codes',
  '/owner/staff': 'Staff Management',
  '/owner/analytics': 'Analytics',
  '/owner/subscription': 'Subscription',
  '/owner/profile': 'Restaurant Profile',
  '/owner/settings': 'Settings',
  '/owner/inventory': 'Inventory Management',
  '/owner/recipes': 'Recipe & Cost Management',
  '/owner/suppliers': 'Suppliers',
  '/owner/purchase-orders': 'Purchase Orders',
  '/owner/expenses': 'Expenses',
  '/owner/branches': 'Branch Management',
  '/owner/attendance': 'Staff Attendance',
  '/owner/pos': 'Point of Sale',
  '/owner/ai-advisor': 'AI Business Advisor',
  '/owner/export': 'Export Data',
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const title = PAGE_TITLES[pathname] || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <OwnerSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <OwnerTopbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
