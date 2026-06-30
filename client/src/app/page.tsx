import Link from 'next/link';
import type { Metadata } from 'next';
import { UtensilsCrossed, Brain, Package, Users, BarChart3, QrCode, Monitor, Zap, Shield, CheckCircle, ArrowRight, ChevronRight, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'TapMenu — Complete Restaurant Operating System',
  description: 'Manage menus, orders, POS, inventory, staff, and AI analytics — all in one platform.',
};

const FEATURES = [
  { emoji: '📱', icon: QrCode,    title: 'QR Menu Ordering',   desc: 'Customers scan, browse and order from their phone. Zero friction, zero wait.' },
  { emoji: '🖥️', icon: Monitor,  title: 'Point of Sale',       desc: 'Full POS with GST, split payments, voids and instant digital receipts.' },
  { emoji: '📦', icon: Package,   title: 'Inventory ERP',       desc: 'Track ingredients, auto-deduct on orders, get smart low-stock alerts.' },
  { emoji: '🤖', icon: Brain,     title: 'AI Business Advisor', desc: 'Daily AI reports with revenue insights, cost analysis and forecasts.' },
  { emoji: '👥', icon: Users,     title: 'CRM & Loyalty',       desc: 'Know your regulars, run campaigns, reward loyal diners automatically.' },
  { emoji: '📊', icon: BarChart3, title: 'Executive Analytics', desc: 'Real-time KPIs, peak hours, top dishes and profit margins.' },
  { emoji: '👨‍🍳', icon: UtensilsCrossed, title: 'Kitchen Display', desc: 'Live order queue for kitchen. No more paper tickets, no more chaos.' },
  { emoji: '🔒', icon: Shield,    title: 'Multi-Branch & Secure', desc: 'Manage unlimited branches with enterprise RBAC and audit logs.' },
];

const PLANS = [
  { name: 'Starter',      price: '₹999',   period: '/month', highlight: false, emoji: '🌱', features: ['QR Menu', 'Order Management', 'Kitchen Display', 'Basic Dashboard', 'Up to 5 staff'] },
  { name: 'Professional', price: '₹2,499', period: '/month', highlight: true,  emoji: '🚀', features: ['Everything in Starter', 'POS + GST', 'Inventory ERP', 'CRM & Loyalty', 'Staff Attendance', 'Up to 10 staff'] },
  { name: 'Enterprise',   price: '₹24,999',period: '/year',  highlight: false, emoji: '👑', features: ['Everything in Pro', 'AI Advisor', 'Multi-Branch', 'Purchase Orders', 'Analytics', 'Unlimited staff'] },
];

const STATS = [
  { emoji: '🏪', num: '1,000+', label: 'Restaurants' },
  { emoji: '🍽️', num: '2M+',   label: 'Orders Processed' },
  { emoji: '💰', num: '₹50Cr+',label: 'Revenue Tracked' },
  { emoji: '⚡', num: '99.9%', label: 'Uptime' },
];

const TESTIMONIALS = [
  { quote: 'Our order errors dropped to near zero. The kitchen display is a game changer.', name: 'Raj Kumar', role: 'Owner, Spice Garden, Mumbai', stars: 5 },
  { quote: 'The AI advisor feels like having a full-time business consultant for ₹2500/month.', name: 'Priya Mehta', role: 'Manager, The Curry House, Delhi', stars: 5 },
  { quote: 'We manage 3 branches from one dashboard. Setup was done in under 30 minutes.', name: 'Arjun Patel', role: 'Owner, Biryani Palace Chain', stars: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(255,251,245,0.95)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🍽️</span>
            <span className="text-lg font-bold display-font" style={{ color: 'var(--foreground)' }}>TapMenu</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex" style={{ color: 'var(--foreground-muted)' }}>
            <a href="#features" className="hover:text-red-700 transition-colors">Features</a>
            <a href="#pricing"  className="hover:text-red-700 transition-colors">Pricing</a>
            <a href="#reviews"  className="hover:text-red-700 transition-colors">Reviews</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium sm:block transition-colors hover:text-red-700" style={{ color: 'var(--foreground-muted)' }}>
              Sign in
            </Link>
            <Link href="/onboarding" className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 food-gradient">
              Get started <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold" style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid #fde68a' }}>
            <Zap className="h-3 w-3" /> Phase 7 Live — AI + POS + ERP for Restaurants
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl display-font" style={{ color: 'var(--foreground)' }}>
            Run your restaurant<br />
            <span style={{ color: 'var(--primary)' }}>like a pro. 🍴</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
            TapMenu is the all-in-one restaurant OS — QR ordering, POS billing, inventory ERP, AI insights, CRM, staff attendance and multi-branch management.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/onboarding" className="flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90 food-gradient" style={{ boxShadow: '0 8px 24px rgba(185,28,28,0.25)' }}>
              Start free trial — no credit card <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--foreground-muted)', background: 'var(--surface)' }}>
              Sign in to dashboard
            </Link>
          </div>
          <p className="mt-4 text-xs" style={{ color: 'var(--foreground-subtle)' }}>
            🏪 Trusted by 1,000+ restaurants · ₹0 to start · Setup in 5 minutes
          </p>
        </div>
      </section>

      {/* ── Food category decorative strip ── */}
      <div className="overflow-hidden py-4" style={{ background: 'var(--surface-warm)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex gap-8 px-8 text-2xl justify-center flex-wrap">
          {['🍕','🍜','🍣','🍔','🥘','🍱','🍝','🥗','🍛','🧆','🌮','🍲','🥩','🍤','🧁'].map(e => (
            <span key={e} className="opacity-60 hover:opacity-100 transition-opacity cursor-default select-none">{e}</span>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
            {STATS.map(({ emoji, num, label }) => (
              <div key={label}>
                <p className="text-3xl mb-1">{emoji}</p>
                <p className="text-3xl font-extrabold display-font" style={{ color: 'var(--primary)' }}>{num}</p>
                <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold display-font sm:text-4xl" style={{ color: 'var(--foreground)' }}>
            Everything your restaurant needs 🍽️
          </h2>
          <p className="mt-3 text-base" style={{ color: 'var(--foreground-muted)' }}>
            From the first order to the last bill — we&apos;ve got your kitchen covered.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl p-5 transition-all hover:-translate-y-1"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', transition: 'all 0.2s ease' }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-2xl" style={{ background: 'var(--surface-warm)', border: '1px solid var(--border)' }}>
                {emoji}
              </div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{title}</h3>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="reviews" style={{ background: 'var(--surface-warm)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold display-font" style={{ color: 'var(--foreground)' }}>
              Loved by restaurant owners ❤️
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map(({ quote, name, role, stars }) => (
              <div key={name} className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                <div className="flex mb-3">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={14} fill="var(--accent)" style={{ color: 'var(--accent)' }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed italic" style={{ color: 'var(--foreground-muted)' }}>&ldquo;{quote}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white food-gradient">
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--foreground-muted)' }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold display-font sm:text-4xl" style={{ color: 'var(--foreground)' }}>
            Simple, honest pricing 💳
          </h2>
          <p className="mt-3 text-base" style={{ color: 'var(--foreground-muted)' }}>No setup fees. No hidden charges. Cancel anytime.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className="relative rounded-2xl p-7"
              style={plan.highlight
                ? { background: 'var(--primary)', color: '#fff', boxShadow: '0 12px 40px rgba(185,28,28,0.3)' }
                : { background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }
              }
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold text-white food-gradient">
                  🔥 Most Popular
                </div>
              )}
              <div className="text-3xl mb-3">{plan.emoji}</div>
              <h3 className="font-bold uppercase text-xs tracking-widest" style={{ color: plan.highlight ? 'rgba(255,255,255,0.7)' : 'var(--foreground-muted)' }}>{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold display-font" style={{ color: plan.highlight ? '#fff' : 'var(--foreground)' }}>{plan.price}</span>
                <span className="text-sm" style={{ color: plan.highlight ? 'rgba(255,255,255,0.6)' : 'var(--foreground-muted)' }}>{plan.period}</span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0" style={{ color: plan.highlight ? 'rgba(255,255,255,0.7)' : 'var(--success)' }} />
                    <span style={{ color: plan.highlight ? 'rgba(255,255,255,0.9)' : 'var(--foreground-muted)' }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/onboarding"
                className="mt-7 block rounded-xl py-3 text-center text-sm font-bold transition-opacity hover:opacity-90"
                style={plan.highlight
                  ? { background: '#fff', color: 'var(--primary)' }
                  : { background: 'var(--primary)', color: '#fff' }
                }
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'var(--surface-warm)', borderTop: '1px solid var(--border)' }}>
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-3xl font-extrabold display-font sm:text-4xl" style={{ color: 'var(--foreground)' }}>
            Ready to transform your restaurant?
          </h2>
          <p className="mt-4 text-base" style={{ color: 'var(--foreground-muted)' }}>
            Join 1,000+ restaurants. Start free — upgrade when you&apos;re ready.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/onboarding" className="flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold text-white food-gradient" style={{ boxShadow: '0 8px 24px rgba(185,28,28,0.25)' }}>
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="rounded-xl px-8 py-3.5 text-base font-semibold" style={{ border: '1px solid var(--border)', color: 'var(--foreground-muted)', background: 'var(--surface)' }}>
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍽️</span>
              <span className="font-bold display-font" style={{ color: 'var(--foreground)' }}>TapMenu</span>
            </div>
            <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--foreground-muted)' }}>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <Link href="/login">Sign in</Link>
              <Link href="/onboarding">Register</Link>
            </div>
            <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
              © {new Date().getFullYear()} TapMenu Restaurant OS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
