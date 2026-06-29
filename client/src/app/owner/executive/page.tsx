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
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
      {sub && (
        <p className={`mt-1 flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-zinc-500'}`}>
          {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
          {sub}
        </p>
      )}
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{score}/100</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
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
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await aiApi.generateReport();
      await load();
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Executive Dashboard</h1>
          <p className="text-sm text-zinc-500">Real-time business overview</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
          Generate AI Report
        </button>
      </div>

      {/* Today KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Today Revenue" value={fmt(data?.today.revenue ?? 0)} />
        <StatCard label="Today Orders" value={String(data?.today.orders ?? 0)} />
        <StatCard label="Avg Order Value" value={fmt(data?.today.avgOrderValue ?? 0)} />
        <StatCard label="Monthly Revenue" value={fmt(data?.monthly.revenue ?? 0)} sub={`${data?.monthly.growth ?? 0}% vs last month`} trend={(data?.monthly.growth ?? 0) >= 0 ? 'up' : 'down'} />
        <StatCard label="Monthly Profit" value={fmt(data?.monthly.profit ?? 0)} sub={`${data?.monthly.profitMargin ?? 0}% margin`} />
        <StatCard label="Low Stock" value={String(data?.alerts.lowStockIngredients ?? 0)} sub="ingredients" trend={(data?.alerts.lowStockIngredients ?? 0) > 0 ? 'down' : 'neutral'} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* AI Health Scores */}
        {data?.aiReport && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <h2 className="font-semibold text-zinc-900 dark:text-white">Business Health Scores</h2>
              <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                Overall: {data.aiReport.scores.overall}/100
              </span>
            </div>
            <div className="space-y-3">
              <ScoreBar label="Revenue" score={data.aiReport.scores.revenue} />
              <ScoreBar label="Operations" score={data.aiReport.scores.operations} />
              <ScoreBar label="Customers" score={data.aiReport.scores.customers} />
              <ScoreBar label="Inventory" score={data.aiReport.scores.inventory} />
              <ScoreBar label="Kitchen" score={data.aiReport.scores.kitchen} />
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {data?.aiReport && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-zinc-900 dark:text-white">AI Recommendations</h2>
            </div>
            <div className="space-y-3">
              {data.aiReport.topRecommendations.length === 0 && (
                <p className="text-sm text-zinc-500">No high-priority recommendations. Business is running well!</p>
              )}
              {data.aiReport.topRecommendations.map((r, i) => (
                <div key={i} className="rounded-lg border border-amber-100 bg-amber-50 p-3 dark:border-amber-900/30 dark:bg-amber-900/10">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{r.action}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{r.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Insights */}
      {data?.aiReport && data.aiReport.topInsights.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-500" />
            <h2 className="font-semibold text-zinc-900 dark:text-white">Key Insights</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.aiReport.topInsights.map((ins, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                {ins.trend === 'up' ? <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" /> :
                  ins.trend === 'down' ? <TrendingDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" /> :
                  <ShoppingBag className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />}
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{ins.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Summary */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">This Month Summary</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{fmt(data?.monthly.revenue ?? 0)}</p>
            <p className="text-xs text-zinc-500">Revenue</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{fmt(data?.monthly.expenses ?? 0)}</p>
            <p className="text-xs text-zinc-500">Expenses</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${(data?.monthly.profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(data?.monthly.profit ?? 0)}</p>
            <p className="text-xs text-zinc-500">Profit</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{data?.monthly.orders ?? 0}</p>
            <p className="text-xs text-zinc-500">Orders</p>
          </div>
        </div>
      </div>
    </div>
  );
}
