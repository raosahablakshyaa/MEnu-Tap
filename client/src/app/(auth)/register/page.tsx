'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth/auth-context';
import { ApiError } from '@/lib/api/client';
import { UtensilsCrossed, Store, User } from 'lucide-react';

type RegisterType = 'customer' | 'restaurant_owner';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [registerType, setRegisterType] = useState<RegisterType>('restaurant_owner');
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', restaurantName: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsLoading(true);
    try {
      if (registerType === 'restaurant_owner') { router.push('/onboarding'); return; }
      await register({ ...formData, roleSlug: 'customer' });
      router.push('/dashboard');
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

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-lg">
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
          <div className="mb-6">
            <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Create your account</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>Join thousands of restaurants using TapMenu</p>
          </div>

          {/* Toggle */}
          <div className="mb-5 flex gap-2 rounded-lg p-1" style={{ background: 'var(--surface-raised)' }}>
            {([['restaurant_owner', 'Restaurant Owner', Store], ['customer', 'Customer', User]] as [RegisterType, string, React.ElementType][]).map(([type, label, Icon]) => (
              <button
                key={type}
                type="button"
                onClick={() => setRegisterType(type)}
                className="flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all"
                style={registerType === type
                  ? { background: 'var(--surface)', color: 'var(--primary)', boxShadow: 'var(--card-shadow)' }
                  : { color: 'var(--foreground-muted)' }
                }
              >
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input name="firstName" value={formData.firstName} onChange={handleChange} error={fieldErrors.firstName} required />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input name="lastName" value={formData.lastName} onChange={handleChange} error={fieldErrors.lastName} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input name="email" type="email" value={formData.email} onChange={handleChange} error={fieldErrors.email} required />
            </div>

            <div className="space-y-1.5">
              <Label>Phone (optional)</Label>
              <Input name="phone" type="tel" value={formData.phone} onChange={handleChange} error={fieldErrors.phone} />
            </div>

            {registerType === 'restaurant_owner' && (
              <div className="space-y-1.5">
                <Label>Restaurant Name</Label>
                <Input name="restaurantName" value={formData.restaurantName} onChange={handleChange} error={fieldErrors.restaurantName} required />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input name="password" type="password" value={formData.password} onChange={handleChange} error={fieldErrors.password} required />
              <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>Min 8 chars, uppercase, lowercase, number & special character</p>
            </div>

            <Button type="submit" className="w-full mt-2" size="lg" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: 'var(--foreground-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--primary)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
