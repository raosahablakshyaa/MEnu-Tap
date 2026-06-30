'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Sun, Moon, LogOut, Bell, Search } from 'lucide-react';

interface TopbarProps { title?: string; }

export default function OwnerTopbar({ title }: TopbarProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header
      className="flex h-[56px] items-center justify-between px-6 flex-shrink-0"
      style={{ background: 'var(--topbar-bg)', borderBottom: '1px solid var(--topbar-border)' }}
    >
      <h1 className="text-[15px] font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'Playfair Display, Georgia, serif' }}>
        {title}
      </h1>

      <div className="flex items-center gap-1">
        {/* Search */}
        <button
          className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-1.5 mr-2 transition-colors"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--foreground-muted)' }}
        >
          <Search size={13} />
          <span className="text-xs">Search...</span>
          <kbd className="ml-2 hidden xl:inline-flex h-5 items-center rounded px-1.5 text-[10px] font-medium"
            style={{ background: 'var(--border)', color: 'var(--foreground-muted)' }}>⌘K</kbd>
        </button>

        {/* Theme */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--foreground-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Bell */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--foreground-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--primary)' }} />
        </button>

        <div className="mx-2 h-5 w-px" style={{ background: 'var(--border)' }} />

        {/* User */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title="Click to logout"
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white food-gradient"
          >
            {initials}
          </div>
          <span className="hidden sm:block text-xs font-medium" style={{ color: 'var(--foreground)' }}>
            {user?.fullName?.split(' ')[0] ?? 'Account'}
          </span>
          <LogOut size={12} style={{ color: 'var(--foreground-muted)' }} />
        </button>
      </div>
    </header>
  );
}
