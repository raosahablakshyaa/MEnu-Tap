'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth/auth-context';
import { ApiError } from '@/lib/api/client';
import { restaurantApi } from '@/lib/api/restaurant';
import { ArrowRight, Star, Zap } from 'lucide-react';

const TESTIMONIALS = [
  { text: 'TapMenu cut our order errors by 80% in the first week.', author: 'Raj Kumar', role: 'Owner, Spice Garden' },
  { text: 'The AI advisor literally feels like having a business consultant.', author: 'Priya Mehta', role: 'Manager, The Curry House' },
  { text: 'Our table turnover improved 35% with the QR ordering system.', author: 'Arjun Patel', role: 'Owner, Biryani Palace' },
];

const DEMO_ACCOUNTS = [
  {
    role: 'Super Admin',
    email: 'admin@tapmenu.com',
    password: 'Admin@123456',
    emoji: '🛡️',
    desc: 'Full platform control',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
  {
    role: 'Restaurant Owner',
    email: 'owner@tapmenu.com',
    password: 'Owner@123456',
    emoji: '🍽️',
    desc: 'Dashboard & POS access',
    color: '#b91c1c',
    bg: '#fff1f2',
    border: '#fecdd3',
  },
  {
    role: 'Customer',
    email: 'customer@tapmenu.com',
    password: 'Customer@123456',
    emoji: '👤',
    desc: 'Browse & order view',
    color: '#0369a1',
    bg: '#f0f9ff',
    border: '#bae6fd',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [fillingDemo, setFillingDemo] = useState<string | null>(null);
  const [testimonialIdx] = useState(Math.floor(Math.random() * TESTIMONIALS.length));

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setFillingDemo(acc.role);
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    setFieldErrors({});
    setTimeout(() => setFillingDemo(null), 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setFieldErrors({}); setIsLoading(true);
    try {
      await login({ email, password });
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        const meRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const meData = await meRes.json();
        const roleSlug = meData.data?.role?.slug;
        if (roleSlug === 'super_admin') { router.push('/admin'); return; }
        if (roleSlug === 'restaurant_owner' && meData.data?.restaurantId) {
          try {
            const statusRes = await restaurantApi.getOnboardingStatus();
            const status = statusRes.data as { onboardingCompleted?: boolean; status?: string };
            if (!status?.onboardingCompleted && status?.status === 'pending') { router.push('/onboarding'); return; }
          } catch { /* continue */ }
        }
      }
      router.push('/owner');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fieldErrors) {
          const mapped: Record<string, string> = {};
          Object.entries(err.fieldErrors).forEach(([k, v]) => { mapped[k] = v[0]; });
          setFieldErrors(mapped);
        }
      } else { setError('An unexpected error occurred'); }
    } finally { setIsLoading(false); }
  };

  const t = TESTIMONIALS[testimonialIdx];

  return (
    <div className="flex min-h-screen">

      {/* ── Left: Brand Panel ── */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-10 food-gradient" />
        <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full opacity-10 food-gradient" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl food-gradient text-xl">🍽️</div>
          <div>
            <p className="text-xl font-bold leading-none display-font" style={{ color: '#fef3c7' }}>TapMenu</p>
            <p className="text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: 'var(--sidebar-text)' }}>Restaurant OS</p>
          </div>
        </div>

        <div className="relative z-10 space-y-7">
          <div>
            <h1 className="text-4xl font-bold leading-tight display-font" style={{ color: '#fef3c7' }}>
              From kitchen to<br />
              <span style={{ color: 'var(--sidebar-active-accent)' }}>table, automated.</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--sidebar-text)' }}>
              Manage orders, inventory, staff, POS, and AI analytics — all from one beautiful dashboard.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[['🏪', '1,000+', 'Restaurants'], ['📦', '2M+', 'Orders'], ['💰', '₹50Cr+', 'Revenue']].map(([emoji, num, label]) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xl">{emoji}</p>
                <p className="text-sm font-bold mt-1" style={{ color: 'var(--sidebar-active-accent)' }}>{num}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--sidebar-text)' }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex mb-2">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} fill="var(--sidebar-active-accent)" style={{ color: 'var(--sidebar-active-accent)' }} />)}
            </div>
            <p className="text-sm italic leading-relaxed" style={{ color: 'var(--sidebar-text)' }}>&ldquo;{t.text}&rdquo;</p>
            <p className="mt-2 text-xs font-semibold" style={{ color: '#fef3c7' }}>{t.author}</p>
            <p className="text-[10px]" style={{ color: 'var(--sidebar-text)' }}>{t.role}</p>
          </div>
        </div>

        <p className="text-[10px] relative z-10" style={{ color: 'var(--sidebar-text)', opacity: 0.3 }}>
          © {new Date().getFullYear()} TapMenu · Restaurant Operating System
        </p>
      </div>

      {/* ── Right: Login Form ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-10 overflow-y-auto" style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-7 lg:hidden">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-bold display-font" style={{ color: 'var(--foreground)' }}>TapMenu</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold display-font" style={{ color: 'var(--foreground)' }}>Welcome back 👋</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>Sign in to your restaurant dashboard</p>
          </div>

          {/* ── Demo Accounts ── */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} style={{ color: 'var(--accent)' }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                Quick Demo — click to auto-fill
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="relative flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                  style={{
                    background: fillingDemo === acc.role ? acc.bg : 'var(--surface)',
                    border: `1.5px solid ${fillingDemo === acc.role ? acc.color : 'var(--border)'}`,
                    boxShadow: fillingDemo === acc.role ? `0 0 0 3px ${acc.border}` : 'var(--card-shadow)',
                  }}
                >
                  {fillingDemo === acc.role && (
                    <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full" style={{ background: acc.color }}>
                      <span className="text-[8px] text-white font-bold">✓</span>
                    </span>
                  )}
                  <span className="text-xl">{acc.emoji}</span>
                  <span className="text-[11px] font-semibold leading-tight" style={{ color: acc.color }}>{acc.role}</span>
                  <span className="text-[9px] leading-tight" style={{ color: 'var(--foreground-muted)' }}>{acc.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--foreground-subtle)' }}>or sign in manually</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fee2e2', color: '#7f1d1d', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Email address</Label>
              <Input
                type="email"
                placeholder="chef@restaurant.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                error={fieldErrors.email}
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Password</Label>
                <Link href="/forgot-password" className="text-xs font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                error={fieldErrors.password}
                required
              />
            </div>

            <Button type="submit" className="w-full mt-1" size="lg" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">Sign in <ArrowRight size={15} /></span>
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: 'var(--foreground-muted)' }}>
            New restaurant?{' '}
            <Link href="/onboarding" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
              Start free trial
            </Link>
          </p>

          {/* Credentials table */}
          <div className="mt-6 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'var(--surface-warm)', borderBottom: '1px solid var(--border)' }}>
              <span className="text-sm">🔑</span>
              <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>All Demo Credentials</p>
            </div>
            <div className="divide-y" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:opacity-80"
                  style={{
                    background: fillingDemo === acc.role ? acc.bg : 'transparent',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{acc.emoji}</span>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: acc.color }}>{acc.role}</p>
                      <p className="text-[10px] font-mono" style={{ color: 'var(--foreground-muted)' }}>{acc.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono" style={{ color: 'var(--foreground-subtle)' }}>{acc.password}</p>
                    <p className="text-[9px] mt-0.5 font-medium" style={{ color: 'var(--primary)' }}>click to fill →</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
