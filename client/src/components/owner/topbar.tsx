'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Sun, Moon, LogOut, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopbarProps {
  title?: string;
}

export default function OwnerTopbar({ title }: TopbarProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200/60 bg-white/80 px-6 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/80">
      <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h1>
      <div className="flex items-center gap-2">
        <button className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <span className="hidden text-sm text-zinc-500 dark:text-zinc-400 sm:block">
          {user?.fullName}
        </span>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-zinc-500">
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
