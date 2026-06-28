'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useTheme } from 'next-themes';
import { Moon, Sun, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function AdminHeader({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200/50 bg-white/60 px-6 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/60">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="flex items-center gap-2 rounded-xl bg-zinc-100/80 px-3 py-1.5 dark:bg-zinc-800/50">
          <User size={16} className="text-zinc-400" />
          <span className="text-sm font-medium">{user?.fullName}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  );
}
