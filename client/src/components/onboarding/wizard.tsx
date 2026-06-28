'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Moon, Sun, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingProgress } from '@/components/onboarding/progress';
import { ImageUpload } from '@/components/onboarding/image-upload';
import { PlanSelector, Plan } from '@/components/onboarding/plan-selector';
import { useAuth } from '@/lib/auth/auth-context';
import { restaurantApi } from '@/lib/api/restaurant';
import { apiClient, ApiError } from '@/lib/api/client';
import { useRazorpay } from '@/hooks/use-razorpay';

const RESTAURANT_TYPES = ['Fine Dining', 'Casual Dining', 'Quick Service', 'Cafe', 'Cloud Kitchen', 'Bar & Lounge', 'Food Truck', 'Other'];
const CUISINES = ['Indian', 'Chinese', 'Italian', 'Mexican', 'Japanese', 'Thai', 'Continental', 'Mughlai', 'South Indian', 'North Indian', 'Fast Food', 'Bakery', 'Desserts'];
const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const INDIAN_STATES = ['Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'];

interface OnboardingStatus {
  onboardingStep: number;
  onboardingCompleted: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  status: string;
  restaurant: Record<string, unknown>;
}

export function OnboardingWizard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const razorpayLoaded = useRazorpay();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  const [registerForm, setRegisterForm] = useState({
    restaurantName: '', ownerName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [businessForm, setBusinessForm] = useState({
    restaurantType: '', cuisineTypes: [] as string[], gstNumber: '', fssaiNumber: '', panNumber: '',
  });
  const [addressForm, setAddressForm] = useState({
    street: '', city: '', state: '', country: 'India', postalCode: '', googleMapsUrl: '', latitude: '', longitude: '',
  });
  const [opsForm, setOpsForm] = useState({
    openingTime: '09:00', closingTime: '22:00', workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as string[],
    avgPrepTimeMinutes: '20', seatingCapacity: '50', numberOfTables: '10', numberOfFloors: '1', numberOfBranches: '1',
  });
  const [brandingForm, setBrandingForm] = useState({ logo: '', coverImage: '', themeColor: '#FF6B00', accentColor: '#1A1A2E' });
  const [otpForm, setOtpForm] = useState({ phone: '', otp: '' });

  const loadStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setStatusLoading(false);
      return;
    }
    try {
      const res = await restaurantApi.getOnboardingStatus();
      const data = res.data as unknown as OnboardingStatus;
      if (!data) return;
      if (data.onboardingCompleted) {
        router.replace('/dashboard');
        return;
      }
      const nextStep = Math.max(data.onboardingStep, 2);
      setStep(nextStep <= 5 ? nextStep : data.emailVerified && data.phoneVerified ? 6 : 5);
      setOtpForm((p) => ({ ...p, phone: (data.restaurant?.contact as { phone?: string })?.phone || p.phone }));

      const r = data.restaurant;
      if (r.businessDetails) {
        const bd = r.businessDetails as Record<string, unknown>;
        setBusinessForm({
          restaurantType: (bd.restaurantType as string) || '',
          cuisineTypes: (bd.cuisineTypes as string[]) || [],
          gstNumber: (bd.gstNumber as string) || '',
          fssaiNumber: (bd.fssaiNumber as string) || '',
          panNumber: (bd.panNumber as string) || '',
        });
      }
      if (r.address) {
        const a = r.address as Record<string, unknown>;
        setAddressForm({
          street: (a.street as string) || '',
          city: (a.city as string) || '',
          state: (a.state as string) || '',
          country: (a.country as string) || 'India',
          postalCode: (a.postalCode as string) || '',
          googleMapsUrl: (a.googleMapsUrl as string) || '',
          latitude: a.latitude != null ? String(a.latitude) : '',
          longitude: a.longitude != null ? String(a.longitude) : '',
        });
      }
      if (r.operationalInfo) {
        const o = r.operationalInfo as Record<string, unknown>;
        setOpsForm({
          openingTime: (o.openingTime as string) || '09:00',
          closingTime: (o.closingTime as string) || '22:00',
          workingDays: (o.workingDays as string[]) || WORKING_DAYS,
          avgPrepTimeMinutes: String(o.avgPrepTimeMinutes || 20),
          seatingCapacity: String(o.seatingCapacity || 50),
          numberOfTables: String(o.numberOfTables || 10),
          numberOfFloors: String(o.numberOfFloors || 1),
          numberOfBranches: String(o.numberOfBranches || 1),
        });
      }
      if (r.branding || r.logo) {
        const b = (r.branding || {}) as Record<string, unknown>;
        setBrandingForm({
          logo: (r.logo as string) || '',
          coverImage: (r.coverImage as string) || '',
          themeColor: (b.themeColor as string) || '#FF6B00',
          accentColor: (b.accentColor as string) || '#1A1A2E',
        });
      }
    } catch {
      /* fresh user */
    } finally {
      setStatusLoading(false);
    }
  }, [isAuthenticated, router]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  useEffect(() => {
    if (step === 6) {
      restaurantApi.getPlans().then((res) => {
        const items = (res.data || []) as unknown as Plan[];
        setPlans(items.map((p) => ({ ...p, id: p.id || p._id || '' })).filter((p) => p.id));
      }).catch(() => toast.error('Failed to load plans'));
    }
  }, [step]);

  const handleApiError = (err: unknown) => {
    if (err instanceof ApiError) {
      toast.error(err.message);
      if (err.fieldErrors) {
        const mapped: Record<string, string> = {};
        Object.entries(err.fieldErrors).forEach(([k, v]) => { mapped[k] = v[0]; });
        setFieldErrors(mapped);
      }
    } else {
      toast.error('Something went wrong');
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setFieldErrors({});
    try {
      const res = await restaurantApi.register(registerForm);
      if (res.data) {
        apiClient.setAccessToken(res.data.accessToken);
        await refreshUser();
        toast.success('Account created! Check your email to verify.');
        setStep(2);
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBusiness = async () => {
    setLoading(true);
    try {
      await restaurantApi.updateBusinessDetails(businessForm);
      toast.success('Business details saved');
      setStep(3);
    } catch (err) { handleApiError(err); } finally { setLoading(false); }
  };

  const handleAddress = async () => {
    setLoading(true);
    try {
      await restaurantApi.updateAddress({
        ...addressForm,
        latitude: addressForm.latitude ? Number(addressForm.latitude) : undefined,
        longitude: addressForm.longitude ? Number(addressForm.longitude) : undefined,
      });
      toast.success('Address saved');
      setStep(4);
    } catch (err) { handleApiError(err); } finally { setLoading(false); }
  };

  const handleOps = async () => {
    setLoading(true);
    try {
      await restaurantApi.updateOperationalInfo({
        ...opsForm,
        avgPrepTimeMinutes: Number(opsForm.avgPrepTimeMinutes),
        seatingCapacity: Number(opsForm.seatingCapacity),
        numberOfTables: Number(opsForm.numberOfTables),
        numberOfFloors: Number(opsForm.numberOfFloors),
        numberOfBranches: Number(opsForm.numberOfBranches),
      });
      toast.success('Restaurant details saved');
      setStep(5);
    } catch (err) { handleApiError(err); } finally { setLoading(false); }
  };

  const handleBranding = async () => {
    setLoading(true);
    try {
      await restaurantApi.updateBranding(brandingForm);
      toast.success('Branding saved');
    } catch (err) { handleApiError(err); } finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    const phone = otpForm.phone || registerForm.phone;
    if (!phone) { toast.error('Enter phone number'); return; }
    setLoading(true);
    try {
      const res = await restaurantApi.sendOtp(phone);
      setOtpSent(true);
      if (res.data?.devOtp) setDevOtp(res.data.devOtp);
      toast.success('OTP sent to your phone');
    } catch (err) { handleApiError(err); } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await restaurantApi.verifyOtp(otpForm.phone || registerForm.phone, otpForm.otp);
      toast.success('Phone verified!');
      setStep(6);
    } catch (err) { handleApiError(err); } finally { setLoading(false); }
  };

  const handlePayment = async () => {
    if (!selectedPlanId) { toast.error('Select a plan'); return; }
    if (!razorpayLoaded) { toast.error('Payment gateway loading...'); return; }
    setLoading(true);
    try {
      const orderRes = await restaurantApi.createPaymentOrder(selectedPlanId);
      const order = orderRes.data;
      if (!order) throw new Error('Failed to create order');

      const rzp = new window.Razorpay({
        key: order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'TapMenu',
        description: 'Restaurant Subscription',
        order_id: order.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await restaurantApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment successful! Welcome to TapMenu.');
            router.push('/dashboard');
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: { email: user?.email, contact: otpForm.phone },
        theme: { color: '#FF6B00' },
        modal: { ondismiss: () => toast.info('Payment cancelled') },
      });
      rzp.open();
    } catch (err) { handleApiError(err); } finally { setLoading(false); }
  };

  const toggleCuisine = (c: string) => {
    setBusinessForm((p) => ({
      ...p,
      cuisineTypes: p.cuisineTypes.includes(c) ? p.cuisineTypes.filter((x) => x !== c) : [...p.cuisineTypes, c],
    }));
  };

  const toggleDay = (d: string) => {
    setOpsForm((p) => ({
      ...p,
      workingDays: p.workingDays.includes(d) ? p.workingDays.filter((x) => x !== d) : [...p.workingDays, d],
    }));
  };

  if (authLoading || statusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const displayStep = !isAuthenticated ? 1 : step;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <header className="border-b border-zinc-200/50 bg-white/60 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-orange-600">TapMenu</Link>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <OnboardingProgress currentStep={displayStep} />

        <AnimatePresence mode="wait">
          <motion.div key={displayStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            <Card className="border-zinc-200/50 bg-white/80 backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-900/80">
              {/* Step 1: Register */}
              {displayStep === 1 && (
                <>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Tell us about you and your restaurant</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Restaurant Name</Label>
                      <Input value={registerForm.restaurantName} onChange={(e) => setRegisterForm({ ...registerForm, restaurantName: e.target.value })} error={fieldErrors.restaurantName} />
                    </div>
                    <div className="space-y-2">
                      <Label>Owner Name</Label>
                      <Input value={registerForm.ownerName} onChange={(e) => setRegisterForm({ ...registerForm, ownerName: e.target.value })} error={fieldErrors.ownerName} />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Email</Label>
                      <Input type="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} error={fieldErrors.email} />
                    </div>
                    <div className="space-y-2">
                      <Label>Mobile Number</Label>
                      <Input type="tel" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} error={fieldErrors.phone} placeholder="+91 9876543210" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} error={fieldErrors.password} />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm Password</Label>
                        <Input type="password" value={registerForm.confirmPassword} onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })} error={fieldErrors.confirmPassword} />
                      </div>
                    </div>
                    <Button className="w-full" onClick={handleRegister} disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : 'Continue'}
                    </Button>
                    <p className="text-center text-sm text-zinc-500">
                      Already registered? <Link href="/login" className="text-orange-600 hover:underline">Sign in</Link>
                    </p>
                  </CardContent>
                </>
              )}

              {/* Step 2: Business */}
              {displayStep === 2 && (
                <>
                  <CardHeader>
                    <CardTitle>Business Details</CardTitle>
                    <CardDescription>Help us understand your restaurant type</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Restaurant Type</Label>
                      <select value={businessForm.restaurantType} onChange={(e) => setBusinessForm({ ...businessForm, restaurantType: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800">
                        <option value="">Select type</option>
                        {RESTAURANT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cuisine Types</Label>
                      <div className="flex flex-wrap gap-2">
                        {CUISINES.map((c) => (
                          <button key={c} type="button" onClick={() => toggleCuisine(c)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${businessForm.cuisineTypes.includes(c) ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800'}`}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2"><Label>GST (Optional)</Label><Input value={businessForm.gstNumber} onChange={(e) => setBusinessForm({ ...businessForm, gstNumber: e.target.value })} placeholder="22AAAAA0000A1Z5" /></div>
                      <div className="space-y-2"><Label>FSSAI (Optional)</Label><Input value={businessForm.fssaiNumber} onChange={(e) => setBusinessForm({ ...businessForm, fssaiNumber: e.target.value })} /></div>
                      <div className="space-y-2"><Label>PAN (Optional)</Label><Input value={businessForm.panNumber} onChange={(e) => setBusinessForm({ ...businessForm, panNumber: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" /></div>
                    </div>
                    <Button className="w-full" onClick={handleBusiness} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Continue'}</Button>
                  </CardContent>
                </>
              )}

              {/* Step 3: Address */}
              {displayStep === 3 && (
                <>
                  <CardHeader>
                    <CardTitle>Restaurant Address</CardTitle>
                    <CardDescription>Where is your restaurant located?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label>Country</Label><Input value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })} /></div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <select value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800">
                          <option value="">Select state</option>
                          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label>City</Label><Input value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Pincode</Label><Input value={addressForm.postalCode} onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2"><Label>Complete Address</Label><Input value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Google Maps URL (Optional)</Label><Input value={addressForm.googleMapsUrl} onChange={(e) => setAddressForm({ ...addressForm, googleMapsUrl: e.target.value })} placeholder="https://maps.google.com/..." /></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label>Latitude</Label><Input value={addressForm.latitude} onChange={(e) => setAddressForm({ ...addressForm, latitude: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Longitude</Label><Input value={addressForm.longitude} onChange={(e) => setAddressForm({ ...addressForm, longitude: e.target.value })} /></div>
                    </div>
                    <Button className="w-full" onClick={handleAddress} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Continue'}</Button>
                  </CardContent>
                </>
              )}

              {/* Step 4: Operational */}
              {displayStep === 4 && (
                <>
                  <CardHeader>
                    <CardTitle>Restaurant Information</CardTitle>
                    <CardDescription>Operating hours and capacity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label>Opening Time</Label><Input type="time" value={opsForm.openingTime} onChange={(e) => setOpsForm({ ...opsForm, openingTime: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Closing Time</Label><Input type="time" value={opsForm.closingTime} onChange={(e) => setOpsForm({ ...opsForm, closingTime: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2">
                      <Label>Working Days</Label>
                      <div className="flex flex-wrap gap-2">
                        {WORKING_DAYS.map((d) => (
                          <button key={d} type="button" onClick={() => toggleDay(d)} className={`rounded-full px-3 py-1 text-xs font-medium ${opsForm.workingDays.includes(d) ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>{d.slice(0, 3)}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2"><Label>Avg Prep Time (min)</Label><Input type="number" value={opsForm.avgPrepTimeMinutes} onChange={(e) => setOpsForm({ ...opsForm, avgPrepTimeMinutes: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Seating Capacity</Label><Input type="number" value={opsForm.seatingCapacity} onChange={(e) => setOpsForm({ ...opsForm, seatingCapacity: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Number of Tables</Label><Input type="number" value={opsForm.numberOfTables} onChange={(e) => setOpsForm({ ...opsForm, numberOfTables: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Floors (Optional)</Label><Input type="number" value={opsForm.numberOfFloors} onChange={(e) => setOpsForm({ ...opsForm, numberOfFloors: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Branches</Label><Input type="number" value={opsForm.numberOfBranches} onChange={(e) => setOpsForm({ ...opsForm, numberOfBranches: e.target.value })} /></div>
                    </div>
                    <Button className="w-full" onClick={handleOps} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Continue'}</Button>
                  </CardContent>
                </>
              )}

              {/* Step 5: Branding + Verification */}
              {displayStep === 5 && (
                <>
                  <CardHeader>
                    <CardTitle>Branding & Verification</CardTitle>
                    <CardDescription>Upload your brand assets and verify your contact</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <ImageUpload label="Logo" value={brandingForm.logo} onChange={(url) => setBrandingForm({ ...brandingForm, logo: url })} onUpload={async (file) => {
                        const res = await restaurantApi.uploadImage(file, 'logo');
                        return res.data?.url as string;
                      }} />
                      <ImageUpload label="Cover Image" value={brandingForm.coverImage} onChange={(url) => setBrandingForm({ ...brandingForm, coverImage: url })} onUpload={async (file) => {
                        const res = await restaurantApi.uploadImage(file, 'cover');
                        return res.data?.url as string;
                      }} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label>Theme Color</Label><div className="flex gap-2"><Input type="color" value={brandingForm.themeColor} onChange={(e) => setBrandingForm({ ...brandingForm, themeColor: e.target.value })} className="h-10 w-16 p-1" /><Input value={brandingForm.themeColor} onChange={(e) => setBrandingForm({ ...brandingForm, themeColor: e.target.value })} /></div></div>
                      <div className="space-y-2"><Label>Accent Color</Label><div className="flex gap-2"><Input type="color" value={brandingForm.accentColor} onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })} className="h-10 w-16 p-1" /><Input value={brandingForm.accentColor} onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })} /></div></div>
                    </div>
                    <Button variant="outline" onClick={handleBranding} disabled={loading}>Save Branding</Button>

                    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
                      <h4 className="font-semibold">Phone Verification (OTP)</h4>
                      <p className="mt-1 text-sm text-zinc-500">Verify your mobile number to proceed</p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Input className="max-w-xs" value={otpForm.phone} onChange={(e) => setOtpForm({ ...otpForm, phone: e.target.value })} placeholder="Phone number" />
                        <Button variant="outline" onClick={handleSendOtp} disabled={loading}>{otpSent ? 'Resend OTP' : 'Send OTP'}</Button>
                      </div>
                      {devOtp && <p className="mt-2 text-xs text-amber-600">Dev OTP: {devOtp}</p>}
                      {otpSent && (
                        <div className="mt-3 flex flex-wrap gap-3">
                          <Input className="max-w-xs" value={otpForm.otp} onChange={(e) => setOtpForm({ ...otpForm, otp: e.target.value })} placeholder="6-digit OTP" maxLength={6} />
                          <Button onClick={handleVerifyOtp} disabled={loading}>Verify OTP</Button>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Check your email for a verification link. Once both email and phone are verified, you can select a plan.
                      </p>
                    </div>

                    <Button className="w-full" onClick={() => setStep(6)}>Continue to Plans</Button>
                  </CardContent>
                </>
              )}

              {/* Step 6: Plan Selection */}
              {displayStep === 6 && (
                <>
                  <CardHeader>
                    <CardTitle>Choose Your Plan</CardTitle>
                    <CardDescription>Select the subscription that fits your restaurant</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <PlanSelector plans={plans} selectedId={selectedPlanId} onSelect={setSelectedPlanId} />
                    <Button className="w-full" onClick={() => setStep(7)} disabled={!selectedPlanId}>Continue to Payment</Button>
                  </CardContent>
                </>
              )}

              {/* Step 7: Payment */}
              {displayStep === 7 && (
                <>
                  <CardHeader>
                    <CardTitle>Complete Payment</CardTitle>
                    <CardDescription>Secure payment via Razorpay — UPI, Cards, Net Banking, Wallets</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {selectedPlanId && plans.find((p) => (p.id || p._id) === selectedPlanId) && (
                      <div className="rounded-xl border p-6 dark:border-zinc-700">
                        <h3 className="text-lg font-bold">{plans.find((p) => (p.id || p._id) === selectedPlanId)?.name}</h3>
                        <p className="mt-2 text-3xl font-extrabold text-orange-600">
                          ₹{plans.find((p) => (p.id || p._id) === selectedPlanId)?.price}
                        </p>
                      </div>
                    )}
                    <Button className="w-full" size="lg" onClick={handlePayment} disabled={loading || !razorpayLoaded}>
                      {loading ? <Loader2 className="animate-spin" /> : 'Pay Now'}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => setStep(6)}>Change Plan</Button>
                  </CardContent>
                </>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
