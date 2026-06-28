'use client';

import { useEffect, useState, useCallback } from 'react';
import { recipesApi } from '@/lib/api/owner';
import { ChefHat, TrendingUp, TrendingDown } from 'lucide-react';

interface ProfitItem { menuItemId: string; menuItemName: string; sellingPrice: number; preparationCost: number; grossProfit: number; marginPercent: number; ingredients: number }

export default function RecipesPage() {
  const [items, setItems] = useState<ProfitItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await recipesApi.profitAnalysis();
      setItems((res as { data: ProfitItem[] }).data ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const avgMargin = items.length > 0 ? items.reduce((s, i) => s + i.marginPercent, 0) / items.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2"><ChefHat className="h-6 w-6 text-orange-500" /><h1 className="text-xl font-bold text-zinc-900 dark:text-white">Recipe & Profit Analysis</h1></div>
          <p className="text-sm text-zinc-500">Manage ingredient mappings and analyze dish profitability</p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500">Recipes Mapped</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{items.length}</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <p className="text-xs text-green-600">Best Margin</p>
            <p className="text-xl font-bold text-green-700">{items[0]?.marginPercent.toFixed(1)}%</p>
            <p className="text-xs text-green-600 truncate">{items[0]?.menuItemName}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500">Avg Margin</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{avgMargin.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {loading ? <div className="flex h-40 items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" /></div> : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                {['Dish', 'Selling Price', 'Cost', 'Gross Profit', 'Margin', 'Ingredients'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {items.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-zinc-500">
                  No recipes configured. Add ingredients to menu items to see profit analysis.
                </td></tr>
              )}
              {items.map(item => (
                <tr key={item.menuItemId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{item.menuItemName}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{fmt(item.sellingPrice)}</td>
                  <td className="px-4 py-3 text-sm text-red-600">{fmt(item.preparationCost)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600">{fmt(item.grossProfit)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {item.marginPercent >= avgMargin ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-400" />}
                      <span className={`text-sm font-semibold ${item.marginPercent >= 50 ? 'text-green-600' : item.marginPercent >= 30 ? 'text-amber-600' : 'text-red-600'}`}>
                        {item.marginPercent.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{item.ingredients}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">How to use Recipe Management</p>
        <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
          Use the API <code className="bg-blue-100 px-1 rounded">PUT /api/v1/owner/recipes/:menuItemId</code> to map ingredients to menu items.
          Once mapped, inventory is auto-deducted when orders complete and profit margins are calculated automatically.
        </p>
      </div>
    </div>
  );
}
