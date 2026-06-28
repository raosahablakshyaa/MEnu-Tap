'use client';

import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminGuard } from '@/components/admin/admin-guard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <AdminSidebar />
        <main className="pl-64 transition-all duration-300">{children}</main>
      </div>
    </AdminGuard>
  );
}
