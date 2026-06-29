'use client';

import { useEffect, useState, useCallback } from 'react';
import { aiApi } from '@/lib/api/owner';
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw, BarChart2, Package, Users, ChefHat, DollarSign, Settings2 } from 'lucide-react';

interface AIReport {
  reportDate: string;
  scores: Record<string, number>;
  insights: Array<{ category: string; insight: string; trend: string; changePercent?: number; priority: string }>;
  recommendations: Array<{ action: string; reason: string; expectedImpact: string; category: string; priority: string }>;
  metrics: {
    revenue: number; expenses: number; profit: number; profitMargin: number;
    orders: number; avgOrderValue: number; newCustomers: number; repeatCustomers: number;
    topItems: Array<{ name: string; quantity: number; revenue: number }>;
    leastItems: Array<{ name: string; quantity: number; revenue: number }>;
    peakHour: string; avgPrepTime: number; wasteAmount: number; inventoryValue: number;
  };
}

interface Forecast {
  forecast: Array<{ date: string; projectedRevenue: number; dayOfWeek: string }>;
  avgDailyRevenue: number;
  projectedMonthly: number;
  confidence: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  revenue: <DollarSign className="h-4 w-4" />,
  inventory: <Package className="h-4 w-4" />,
  menu: <ChefHat className="h-4 w-4" />,
  customers: <Users className="h-4 w-4" />,
  operations: <Settings2 className="h-4 w-4" />,
  staff: <Users className="h-4 w-4" />,
};

const PRIORITY_STYLES: Record<string, string> = {
  high: 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10',
  medium: 'border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10',
  low: 'border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/10',
};

export default function AIAdvisorPage() {
  const [report, setReport] = useState<AIReport | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<'insights' | 'recommendations' | 'forecast' | 'metrics'>('insights');

  const load = useCallback(async () => {
    try {
      const [reportRes, forecastRes] = await Promise.all([aiApi.latestReport('daily'), aiApi.forecast()]);
      setReport((reportRes as { data: AIReport }).data);
      setForecast((forecastRes as { data: Forecast }).data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try { await aiApi.generateReport(); await load(); } finally { setGenerating(false); }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
    </div>
  );

  const maxForecast = Math.max(...(forecast?.forecast.map(f => f.projectedRevenue) ?? [1]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">AI Business Advisor</h1>
          </div>
          <p className="text-sm text-zinc-500">
            {report ? `Report for ${new Date(report.reportDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : 'No report generated yet'}
          </p>
        </div>
        <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {!report && (
        <div className="rounded-xl border-2 border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <Brain className="mx-auto mb-3 h-12 w-12 text-zinc-400" />
          <p className="font-medium text-zinc-600 dark:text-zinc-400">No AI report yet. Generate your first report!</p>
          <p className="mt-1 text-sm text-zinc-500">The AI analyzes your orders, inventory, and customers to generate actionable insights.</p>
        </div>
      )}

      {report && (
        <>
          {/* Score Summary */}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {Object.entries(report.scores).map(([key, val]) => (
              <div key={key} className="rounded-xl border border-zinc-200 bg-white p-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <div className={`mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${val >= 75 ? 'bg-green-500' : val >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                  {val}
                </div>
                <p className="text-xs capitalize text-zinc-500">{key}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
            {(['insights', 'recommendations', 'forecast', 'metrics'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-colors ${tab === t ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Insights Tab */}
          {tab === 'insights' && (
            <div className="space-y-3">
              {report.insights.length === 0 && <p className="text-center text-sm text-zinc-500 py-8">No insights available yet.</p>}
              {report.insights.map((ins, i) => (
                <div key={i} className={`rounded-xl border p-4 ${PRIORITY_STYLES[ins.priority]}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0 text-zinc-600 dark:text-zinc-400">
                      {CATEGORY_ICONS[ins.category] ?? <BarChart2 className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 capitalize">{ins.category}</span>
                        {ins.changePercent != null && (
                          <span className={`flex items-center gap-0.5 text-xs font-semibold ${ins.trend === 'up' ? 'text-green-600' : ins.trend === 'down' ? 'text-red-500' : 'text-zinc-500'}`}>
                            {ins.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : ins.trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                            {Math.abs(ins.changePercent).toFixed(1)}%
                          </span>
                        )}
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${ins.priority === 'high' ? 'bg-red-100 text-red-700' : ins.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {ins.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">{ins.insight}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations Tab */}
          {tab === 'recommendations' && (
            <div className="space-y-3">
              {report.recommendations.length === 0 && <p className="text-center text-sm text-zinc-500 py-8">No recommendations. Keep up the great work!</p>}
              {report.recommendations.map((rec, i) => (
                <div key={i} className={`rounded-xl border p-4 ${PRIORITY_STYLES[rec.priority]}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">{rec.action}</p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{rec.reason}</p>
                      {rec.expectedImpact && (
                        <p className="mt-1 text-xs text-green-600 dark:text-green-400">→ {rec.expectedImpact}</p>
                      )}
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {rec.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Forecast Tab */}
          {tab === 'forecast' && forecast && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">{fmt(forecast.avgDailyRevenue)}</p>
                  <p className="text-xs text-zinc-500">Avg Daily Revenue</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">{fmt(forecast.projectedMonthly)}</p>
                  <p className="text-xs text-zinc-500">Projected Monthly</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-2xl font-bold capitalize text-zinc-900 dark:text-white">{forecast.confidence}</p>
                  <p className="text-xs text-zinc-500">Forecast Confidence</p>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 font-semibold text-zinc-900 dark:text-white">7-Day Revenue Forecast</h3>
                <div className="space-y-2">
                  {forecast.forecast.map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-16 text-right text-xs text-zinc-500">{f.dayOfWeek}</div>
                      <div className="flex-1">
                        <div className="h-6 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                          <div className="h-full rounded bg-orange-400" style={{ width: `${(f.projectedRevenue / maxForecast) * 100}%` }} />
                        </div>
                      </div>
                      <div className="w-24 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300">{fmt(f.projectedRevenue)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Metrics Tab */}
          {tab === 'metrics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs text-zinc-500">Revenue</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{fmt(report.metrics.revenue)}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs text-zinc-500">Profit</p>
                  <p className={`text-xl font-bold ${report.metrics.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(report.metrics.profit)}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs text-zinc-500">Profit Margin</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{report.metrics.profitMargin}%</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs text-zinc-500">Inventory Value</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{fmt(report.metrics.inventoryValue)}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <h3 className="mb-3 font-medium text-zinc-900 dark:text-white">Top Selling Items</h3>
                  <div className="space-y-2">
                    {(report.metrics.topItems ?? []).slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2"><span className="text-xs text-zinc-400">#{i + 1}</span>{item.name}</span>
                        <span className="font-medium text-green-600">{fmt(item.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <h3 className="mb-3 font-medium text-zinc-900 dark:text-white">Least Selling Items</h3>
                  <div className="space-y-2">
                    {(report.metrics.leastItems ?? []).slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="font-medium text-zinc-500">{fmt(item.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs text-zinc-500">Peak Hour</p>
                  <p className="mt-1 font-semibold text-zinc-900 dark:text-white">{report.metrics.peakHour || 'N/A'}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs text-zinc-500">Avg Prep Time</p>
                  <p className="mt-1 font-semibold text-zinc-900 dark:text-white">{report.metrics.avgPrepTime} min</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs text-zinc-500">New Customers</p>
                  <p className="mt-1 font-semibold text-zinc-900 dark:text-white">{report.metrics.newCustomers}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs text-zinc-500">Repeat Customers</p>
                  <p className="mt-1 font-semibold text-zinc-900 dark:text-white">{report.metrics.repeatCustomers}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
