import Link from 'next/link';
import type { Metadata } from 'next';
import {
  UtensilsCrossed, Brain, Package, Users, BarChart3, QrCode,
  Monitor, Zap, Shield, CheckCircle, ArrowRight, Star,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'TapMenu — Complete Restaurant Operating System',
  description: 'Manage menus, orders, POS, inventory, staff, and AI analytics — all in one platform. Free to start.',
};

const FEATURES = [
  { icon: QrCode, title: 'QR Menu Ordering', desc: 'Customers scan, browse and order from their phone. No app download needed.' },
  { icon: Monitor, title: 'Point of Sale', desc: 'Full POS with GST (CGST/SGST/IGST), split payments, and instant receipts.' },
  { icon: Package, title: 'Inventory ERP', desc: 'Track ingredients, auto-deduct stock on orders, get low-stock alerts.' },
  { icon: Brain, title: 'AI Business Advisor', desc: 'Daily AI reports with revenue insights, recommendations, and forecasts.' },
  { icon: Users, title: 'CRM & Loyalty', desc: 'Know your customers, run campaigns, reward loyal diners automatically.' },
  { icon: BarChart3, title: 'Executive Analytics', desc: 'Real-time KPIs, peak hours, top dishes, profit margins — all on one screen.' },
  { icon: UtensilsCrossed, title: 'Kitchen Display', desc: 'Live order queue for kitchen staff. No more paper tickets.' },
  { icon: Shield, title: 'Multi-Tenant & Secure', desc: 'Each restaurant is fully isolated. RBAC, JWT auth, audit logs built in.' },
];

const PLANS = [
  {
    name: 'Starter',
    price: '₹0',
    period: 'Forever free',
    highlight: false,
    features: ['QR Menu', 'Order Management', 'Basic Dashboard', 'Kitchen Display', 'Up to 2 staff'],
  },
  {
    name: 'Growth',
    price: '₹999',
    period: '/month',
    highlight: true,
    features: ['Everything in Starter', 'POS System', 'Inventory ERP', 'CRM & Loyalty', 'Staff Attendance', 'GST Invoicing', 'Up to 10 staff'],
  },
  {
    name: 'Enterprise',
    price: '₹2,499',
    period: '/month',
    highlight: false,
    features: ['Everything in Growth', 'AI Business Advisor', 'Multi-Branch', 'Purchase Orders', 'Advanced Analytics', 'Priority Support', 'Unlimited staff'],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white">TapMenu</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400 md:flex">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-zinc-900 dark:hover:text-white">Pricing</a>
            <a href="#demo" className="hover:text-zinc-900 dark:hover:text-white">Demo</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white sm:block">
              Sign in
            </Link>
            <Link href="/onboarding" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-semibold text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
            <Zap className="h-3 w-3" /> Phase 8 — Production Ready
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-6xl lg:text-7xl">
            Run your restaurant<br />
            <span className="text-orange-500">smarter, not harder</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            TapMenu is a complete Restaurant OS — QR ordering, POS, inventory ERP, AI analytics, CRM, loyalty and multi-branch management. All in one platform, free to start.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/onboarding" className="flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600">
              Start free — no credit card <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/menu/demo" className="rounded-xl border border-zinc-300 px-8 py-3.5 text-base font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900">
              View live demo
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            Trusted by 1,000+ restaurants · ₹0 to start · No hidden fees
          </p>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-zinc-100 bg-zinc-50 py-10 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            {[['1,000+', 'Restaurants'], ['2M+', 'Orders Processed'], ['₹50Cr+', 'Revenue Tracked'], ['99.9%', 'Uptime']].map(([num, label]) => (
              <div key={label}>
                <p className="text-3xl font-extrabold text-orange-500">{num}</p>
                <p className="mt-1 text-sm text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">Everything your restaurant needs</h2>
          <p className="mt-3 text-zinc-500">From QR ordering to AI-powered business intelligence — all under one roof.</p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/20">
                <Icon className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm text-zinc-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-zinc-50 py-24 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-3 text-zinc-500">No setup fees. No hidden charges. Cancel anytime.</p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {PLANS.map(plan => (
              <div key={plan.name} className={`relative rounded-2xl p-8 ${plan.highlight ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/30' : 'border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800'}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <h3 className={`font-bold ${plan.highlight ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? 'text-orange-100' : 'text-zinc-500'}`}>{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`h-4 w-4 flex-shrink-0 ${plan.highlight ? 'text-orange-100' : 'text-green-500'}`} />
                      <span className={plan.highlight ? 'text-orange-50' : 'text-zinc-600 dark:text-zinc-400'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/onboarding"
                  className={`mt-8 block rounded-xl py-3 text-center text-sm font-bold transition-colors ${plan.highlight ? 'bg-white text-orange-600 hover:bg-orange-50' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white sm:text-4xl">
          Ready to transform your restaurant?
        </h2>
        <p className="mt-4 text-zinc-500">Join 1,000+ restaurants already using TapMenu. Start free today — upgrade when you're ready.</p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/onboarding" className="flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600">
            Start for free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="rounded-xl border border-zinc-300 px-8 py-3.5 text-base font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900">
            Sign in
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500">
                <UtensilsCrossed className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-zinc-900 dark:text-white">TapMenu</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-zinc-500">
              <a href="#features" className="hover:text-zinc-700">Features</a>
              <a href="#pricing" className="hover:text-zinc-700">Pricing</a>
              <Link href="/login" className="hover:text-zinc-700">Sign in</Link>
            </div>
            <p className="text-xs text-zinc-400">© {new Date().getFullYear()} TapMenu. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
