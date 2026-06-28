import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-200/50 bg-white/60 p-5 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/40',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>}
          {trend && (
            <p className={cn('mt-1 text-xs font-medium', trend.positive ? 'text-emerald-500' : 'text-red-500')}>
              {trend.positive ? '+' : ''}{trend.value}%
            </p>
          )}
        </div>
        <div className="rounded-xl bg-orange-500/10 p-2.5">
          <Icon size={20} className="text-orange-500" />
        </div>
      </div>
    </div>
  );
}
