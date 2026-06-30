'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { UtensilsCrossed, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--primary)' }}>
            <UtensilsCrossed size={17} className="text-white" />
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>TapMenu</span>
        </div>

        <div
          className="rounded-xl p-8"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
        >
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--primary-light)' }}>
                  <CheckCircle2 size={28} style={{ color: 'var(--primary)' }} />
                </div>
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Check your email</h2>
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Reset your password</h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Email address</Label>
                  <Input type="email" placeholder="you@restaurant.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send reset link'}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: 'var(--foreground-muted)' }}>
                  <ArrowLeft size={14} /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
