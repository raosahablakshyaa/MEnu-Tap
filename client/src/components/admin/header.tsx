'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useTheme } from 'next-themes';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AdminHeader({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  return (
    <header
      className="sticky top-0 z-30 flex h-[56px] items-center justify-between px-6"
      style={{ background: 'var(--topbar-bg)', borderBottom: '1px solid var(--topbar-border)' }}
    >
      <h1 className="text-[15px] font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h1>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--foreground-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="mx-2 h-5 w-px" style={{ background: 'var(--border)' }} />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title="Logout"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: 'var(--primary)' }}>
            {initials}
          </div>
          <span className="hidden sm:block text-xs font-medium" style={{ color: 'var(--foreground)' }}>{user?.fullName?.split(' ')[0]}</span>
          <LogOut size={13} style={{ color: 'var(--foreground-muted)' }} />
        </button>
      </div>
    </header>
  );
}
