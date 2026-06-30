'use client';

import { useEffect, useState, useCallback } from 'react';
import { aiApi } from '@/lib/api/owner';
import { TrendingUp, TrendingDown, ShoppingBag, Users, AlertTriangle, Brain, RefreshCw } from 'lucide-react';

interface ExecutiveData {
  today: { revenue: number; orders: number; avgOrderValue: number };
  weekly: { revenue: number; orders: number };
  monthly: { revenue: number; orders: number; expenses: number; profit: number; profitMargin: number; growth: number };
  alerts: { lowStockIngredients: number };
  aiReport: {
    scores: { overall: number; revenue: number; operations: number; customers: number; inventory: number; kitchen: number };
    topInsights: Array<{ insight: string; trend: string; priority: string }>;
    topRecommendations: Array<{ action: string; reason: string; priority: string }>;
  } | null;
}

function StatCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="stat-card">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{value}</p>
      {sub && (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium"
          style={{ color: trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--danger)' : 'var(--foreground-muted)' }}>
          {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
          {sub}
        </p>
      )}
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const barColor = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span style={{ color: 'var(--foreground-muted)' }}>{label}</span>
        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{score}/100</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-raised)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: barColor }} />
      </div>
    </div>
  );
}

export default function ExecutiveDashboardPage() {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await aiApi.executiveDashboard();
      setData((res as { data: ExecutiveData }).data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try { await aiApi.generateReport(); await load(); } finally { setGenerating(false); }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 skeleton" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-56 skeleton" /><div className="h-56 skeleton" />
        </div>
      </div>
    );
  }

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>Executive Dashboard</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>Real-time business overview</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--primary)' }}
        >
          <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
          Generate AI Report
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Today Revenue"    value={fmt(data?.today.revenue ?? 0)} />
        <StatCard label="Today Orders"     value={String(data?.today.orders ?? 0)} />
        <StatCard label="Avg Order Value"  value={fmt(data?.today.avgOrderValue ?? 0)} />
        <StatCard label="Monthly Revenue"  value={fmt(data?.monthly.revenue ?? 0)} sub={`${data?.monthly.growth ?? 0}% vs last month`} trend={(data?.monthly.growth ?? 0) >= 0 ? 'up' : 'down'} />
        <StatCard label="Monthly Profit"   value={fmt(data?.monthly.profit ?? 0)} sub={`${data?.monthly.profitMargin ?? 0}% margin`} />
        <StatCard label="Low Stock"        value={String(data?.alerts.lowStockIngredients ?? 0)} sub="ingredients" trend={(data?.alerts.lowStockIngredients ?? 0) > 0 ? 'down' : 'neutral'} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* AI Health Scores */}
        {data?.aiReport && (
          <div className="content-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5" style={{ color: '#8b5cf6' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Business Health Scores</h2>
              <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                Overall: {data.aiReport.scores.overall}/100
              </span>
            </div>
            <div className="space-y-3">
              <ScoreBar label="Revenue"    score={data.aiReport.scores.revenue} />
              <ScoreBar label="Operations" score={data.aiReport.scores.operations} />
              <ScoreBar label="Customers"  score={data.aiReport.scores.customers} />
              <ScoreBar label="Inventory"  score={data.aiReport.scores.inventory} />
              <ScoreBar label="Kitchen"    score={data.aiReport.scores.kitchen} />
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {data?.aiReport && (
          <div className="content-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" style={{ color: 'var(--warning)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>AI Recommendations</h2>
            </div>
            <div className="space-y-3">
              {data.aiReport.topRecommendations.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>No high-priority recommendations. Business is running well!</p>
              )}
              {data.aiReport.topRecommendations.map((r, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{r.action}</p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--foreground-muted)' }}>{r.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Insights */}
      {data?.aiReport && data.aiReport.topInsights.length > 0 && (
        <div className="content-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5" style={{ color: '#6366f1' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Key Insights</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.aiReport.topInsights.map((ins, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                {ins.trend === 'up'
                  ? <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} />
                  : ins.trend === 'down'
                  ? <TrendingDown className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--danger)' }} />
                  : <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--info)' }} />}
                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{ins.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Summary */}
      <div className="content-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" style={{ color: 'var(--info)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>This Month Summary</h2>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { label: 'Revenue',  value: fmt(data?.monthly.revenue ?? 0) },
            { label: 'Expenses', value: fmt(data?.monthly.expenses ?? 0) },
            { label: 'Profit',   value: fmt(data?.monthly.profit ?? 0), colored: true },
            { label: 'Orders',   value: String(data?.monthly.orders ?? 0) },
          ].map(({ label, value, colored }) => (
            <div key={label} className="text-center">
              <p className="text-xl font-bold" style={{ color: colored ? ((data?.monthly.profit ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)') : 'var(--foreground)' }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
