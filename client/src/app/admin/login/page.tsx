'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { ApiError } from '@/lib/api/client';
import { toast } from 'sonner';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meData = await meRes.json();
        if (meData.data?.role?.slug !== 'super_admin') { toast.error('Access denied. Super Admin only.'); return; }
      }
      router.push('/admin');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Login failed');
    } finally { setLoading(false); }
  };

  const inputCls = 'flex h-9 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors';

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--sidebar-bg)' }}>
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <span className="text-3xl">🍽️</span>
            <div>
              <p className="text-xl font-bold leading-none" style={{ color: '#fef3c7', fontFamily: 'Playfair Display, Georgia, serif' }}>TapMenu</p>
              <p className="text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: 'var(--sidebar-text)' }}>Super Admin Panel</p>
            </div>
          </div>

          <div className="rounded-xl p-8" style={{ background: 'var(--sidebar-hover)', border: '1px solid var(--sidebar-border)' }}>
            <div className="mb-6 flex items-center gap-2">
              <ShieldCheck size={16} style={{ color: 'var(--sidebar-active-accent)' }} />
              <h2 className="text-base font-semibold" style={{ color: '#fef3c7' }}>Admin Sign In</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--sidebar-text)' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className={inputCls}
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--sidebar-border)', color: '#fef3c7' }} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--sidebar-text)' }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className={inputCls}
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--sidebar-border)', color: '#fef3c7' }} />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading
                  ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Signing in...</span>
                  : <span className="flex items-center gap-2">Sign in <ArrowRight size={14} /></span>
                }
              </Button>
            </form>

            <p className="mt-5 text-center text-xs">
              <Link href="/forgot-password" className="hover:underline" style={{ color: 'var(--sidebar-active-accent)' }}>
                Forgot password?
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs" style={{ color: 'var(--sidebar-text)', opacity: 0.35 }}>
            Restricted access — Super Admins only
          </p>
        </div>
      </div>
    </div>
  );
}
