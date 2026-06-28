'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/auth-context';
import { ApiError } from '@/lib/api/client';
import { toast } from 'sonner';

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
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meData = await meRes.json();
        if (meData.data?.role?.slug !== 'super_admin') {
          toast.error('Access denied. Super Admin only.');
          return;
        }
      }
      router.push('/admin');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-orange-500">TapMenu Admin</h1>
          <p className="mt-2 text-zinc-400">Super Admin Panel</p>
        </div>
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Sign in</CardTitle>
            <CardDescription>Access the platform administration panel</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="border-zinc-700 bg-zinc-800/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="border-zinc-700 bg-zinc-800/50" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
              <Link href="/forgot-password" className="text-sm text-orange-400 hover:underline">
                Forgot password?
              </Link>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
