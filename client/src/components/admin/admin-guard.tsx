'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isSuperAdmin = user?.role?.slug === 'super_admin';

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/admin/login');
      return;
    }

    if (!isSuperAdmin && pathname !== '/admin/login') {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) return null;

  return <>{children}</>;
}
