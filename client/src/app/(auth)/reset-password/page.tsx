'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsLoading(true);
    try {
      await authApi.resetPassword({ token, password, confirmPassword });
      router.push('/login?reset=success');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fieldErrors) {
          const mapped: Record<string, string> = {};
          Object.entries(err.fieldErrors).forEach(([key, messages]) => { mapped[key] = messages[0]; });
          setFieldErrors(mapped);
        }
      } else { setError('An unexpected error occurred'); }
    } finally { setIsLoading(false); }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
          Invalid or expired reset link. Please request a new one.
        </div>
        <Link href="/forgot-password" className="text-sm font-medium hover:underline" style={{ color: 'var(--primary)' }}>
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label>New Password</Label>
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} error={fieldErrors.password} required />
      </div>
      <div className="space-y-1.5">
        <Label>Confirm Password</Label>
        <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} error={fieldErrors.confirmPassword} required />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? 'Resetting...' : 'Set new password'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--primary)' }}>
            <UtensilsCrossed size={17} className="text-white" />
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>TapMenu</span>
        </div>

        <div className="rounded-xl p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
          <div className="mb-6">
            <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Set new password</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>Enter your new password below</p>
          </div>
          <Suspense fallback={<div className="h-32 skeleton" />}>
            <ResetPasswordForm />
          </Suspense>
          <div className="mt-5 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: 'var(--foreground-muted)' }}>
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
