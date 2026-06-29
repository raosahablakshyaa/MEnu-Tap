'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Plan {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  duration: string;
  durationDays: number;
  isPopular?: boolean;
  featureList?: string[];
  features?: {
    maxTables: number;
    maxStaff: number;
    maxMenuItems: number;
    storageLimitMb: number;
    qrLimit: number;
    analyticsAccess: boolean;
    aiFeatures: boolean;
    loyaltyAccess: boolean;
    whatsappMarketing: boolean;
  };
}

interface PlanSelectorProps {
  plans: Plan[];
  selectedId?: string;
  onSelect: (planId: string) => void;
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
}

export function PlanSelector({ plans, selectedId, onSelect }: PlanSelectorProps) {
  const featureRows = [
    { key: 'maxTables', label: 'Tables', get: (p: Plan) => p.features?.maxTables },
    { key: 'maxStaff', label: 'Staff', get: (p: Plan) => p.features?.maxStaff },
    { key: 'qrLimit', label: 'QR Codes', get: (p: Plan) => p.features?.qrLimit },
    { key: 'storageLimitMb', label: 'Storage (MB)', get: (p: Plan) => p.features?.storageLimitMb },
    { key: 'analyticsAccess', label: 'Analytics', get: (p: Plan) => p.features?.analyticsAccess ? '✓' : '—' },
    { key: 'aiFeatures', label: 'AI Features', get: (p: Plan) => p.features?.aiFeatures ? '✓' : '—' },
    { key: 'loyaltyAccess', label: 'Loyalty', get: (p: Plan) => p.features?.loyaltyAccess ? '✓' : '—' },
    { key: 'whatsappMarketing', label: 'WhatsApp', get: (p: Plan) => p.features?.whatsappMarketing ? '✓' : '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const id = plan.id || plan._id || '';
          const selected = selectedId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={cn(
                'relative rounded-2xl border-2 p-6 text-left transition-all hover:shadow-lg',
                selected ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20' : 'border-zinc-200 dark:border-zinc-700',
                plan.isPopular && 'ring-2 ring-orange-500/30'
              )}
            >
              {plan.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-0.5 text-xs font-semibold text-white">
                  Popular
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="mt-1 text-3xl font-extrabold text-orange-600">
                {formatPrice(plan.price, plan.currency)}
                <span className="text-sm font-normal text-zinc-500">/{plan.duration.replace('_', ' ')}</span>
              </p>
              {plan.description && <p className="mt-2 text-sm text-zinc-500">{plan.description}</p>}
              <ul className="mt-4 space-y-2">
                {(plan.featureList || []).slice(0, 5).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Check size={14} className="shrink-0 text-orange-500" />
                    {f}
                  </li>
                ))}
              </ul>
              {selected && (
                <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white">
                  <Check size={14} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {plans.length > 1 && (
        <div className="overflow-x-auto rounded-xl border dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 dark:bg-zinc-800/50">
                <th className="p-3 text-left font-medium">Feature</th>
                {plans.map((p) => (
                  <th key={p.id || p._id} className="p-3 text-center font-medium">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureRows.map((row) => (
                <tr key={row.key} className="border-b last:border-0">
                  <td className="p-3 font-medium text-zinc-600 dark:text-zinc-400">{row.label}</td>
                  {plans.map((p) => (
                    <td key={p.id || p._id} className="p-3 text-center">{String(row.get(p) ?? '—')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
