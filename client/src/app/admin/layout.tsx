'use client';

import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminGuard } from '@/components/admin/admin-guard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) return <>{children}</>;

  return (
    <AdminGuard>
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <AdminSidebar />
        <main className="pl-[220px] transition-all duration-300" style={{ minHeight: '100vh' }}>
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
