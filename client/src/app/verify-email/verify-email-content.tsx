'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { restaurantApi } from '@/lib/api/restaurant';

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }
    restaurantApi.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified successfully.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.message || 'Verification failed. The link may have expired.');
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-white px-4 dark:from-zinc-950 dark:to-zinc-900">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            {status === 'loading' && <Loader2 className="mx-auto h-12 w-12 animate-spin text-orange-500" />}
            {status === 'success' && <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />}
            {status === 'error' && <XCircle className="mx-auto h-12 w-12 text-red-500" />}
            <CardTitle className="mt-4">
              {status === 'loading' && 'Verifying Email...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
            <CardDescription>{message || 'Please wait while we verify your email address.'}</CardDescription>
          </CardHeader>
          {status !== 'loading' && (
            <CardContent className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="/onboarding">Continue Onboarding</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">Sign In</Link>
              </Button>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
