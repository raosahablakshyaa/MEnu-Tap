'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Moon, Sun, AlertTriangle, Clock, Ban } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { restaurantApi } from '@/lib/api/restaurant';

interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
}

const CHECKLIST_LABELS: Record<string, string> = {
  completeProfile: 'Complete Restaurant Profile',
  addMenuCategories: 'Add Menu Categories',
  addMenuItems: 'Add Menu Items',
  generateQrCodes: 'Generate Table QR Codes',
  inviteStaff: 'Invite Staff',
  configurePayments: 'Configure Payment Methods',
  publishMenu: 'Publish Menu',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [onboarding, setOnboarding] = useState<{
    status: string;
    completionPercentage: number;
    checklist: Record<string, boolean>;
    onboardingCompleted: boolean;
    restaurant: Record<string, unknown>;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !user?.restaurantId) return;
    restaurantApi.getOnboardingStatus()
      .then((res) => {
        if (res.data) {
          const d = res.data as typeof onboarding;
          setOnboarding(d);
          if (!d?.onboardingCompleted && d?.status === 'pending') {
            router.replace('/onboarding');
          }
        }
      })
      .catch(() => {});
  }, [isAuthenticated, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
      </div>
    );
  }

  const checklistItems: ChecklistItem[] = onboarding?.checklist
    ? Object.entries(onboarding.checklist).map(([key, done]) => ({
        key,
        label: CHECKLIST_LABELS[key] || key,
        done: !!done,
      }))
    : [];

  const completion = onboarding?.completionPercentage ?? 0;
  const restaurantStatus = onboarding?.status || 'pending';
  const restaurantName = (onboarding?.restaurant?.name as string) || 'Your Restaurant';

  const statusBanner = () => {
    switch (restaurantStatus) {
      case 'pending_approval':
        return (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            <Clock className="mt-0.5 shrink-0 text-amber-600" size={20} />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">Pending Admin Approval</p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">Your restaurant is under review. You&apos;ll be notified once approved.</p>
            </div>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <Ban className="mt-0.5 shrink-0 text-red-600" size={20} />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">Registration Rejected</p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">Contact support for more information.</p>
            </div>
          </div>
        );
      case 'suspended':
        return (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={20} />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">Account Suspended</p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">Your restaurant account has been suspended.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200/50 bg-white/80 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <span className="text-xl font-bold text-orange-600">TapMenu</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className="hidden text-sm text-zinc-600 dark:text-zinc-400 sm:inline">
              {user.fullName}{' '}
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                {user.role?.name}
              </span>
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{restaurantName}</h1>
          <p className="mt-1 text-zinc-500">Welcome to TapMenu Restaurant OS</p>

          {statusBanner() && <div className="mt-6">{statusBanner()}</div>}

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Onboarding Checklist */}
            <div className="lg:col-span-2 rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-700/50 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Setup Checklist</h3>
                <span className="text-sm font-bold text-orange-600">{completion}% complete</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${completion}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <ul className="mt-6 space-y-3">
                {checklistItems.map((item) => (
                  <li key={item.key} className="flex items-center gap-3">
                    {item.done ? (
                      <CheckCircle2 className="shrink-0 text-emerald-500" size={20} />
                    ) : (
                      <Circle className="shrink-0 text-zinc-300 dark:text-zinc-600" size={20} />
                    )}
                    <span className={item.done ? 'text-zinc-500 line-through' : 'text-zinc-700 dark:text-zinc-300'}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account Info */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-700/50 dark:bg-zinc-900">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Account</h3>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Email</dt>
                    <dd className="font-medium">{user.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Role</dt>
                    <dd className="font-medium">{user.role?.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Status</dt>
                    <dd className="font-medium capitalize">{restaurantStatus.replace('_', ' ')}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-700/50 dark:bg-zinc-900">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Quick Actions</h3>
                <div className="mt-4 space-y-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/onboarding">Edit Profile</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" disabled>Manage Menu</Button>
                  <Button variant="outline" size="sm" className="w-full" disabled>View Orders</Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
