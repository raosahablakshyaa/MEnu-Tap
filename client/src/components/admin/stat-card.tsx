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
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>{value}</p>
          {subtitle && <p className="mt-0.5 text-xs" style={{ color: 'var(--foreground-subtle)' }}>{subtitle}</p>}
          {trend && (
            <p className={cn('mt-1 text-xs font-semibold', trend.positive ? 'text-emerald-500' : 'text-red-500')}>
              {trend.positive ? '+' : ''}{trend.value}%
            </p>
          )}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'var(--primary-light)' }}>
          <Icon size={18} style={{ color: 'var(--primary)' }} />
        </div>
      </div>
    </div>
  );
}
