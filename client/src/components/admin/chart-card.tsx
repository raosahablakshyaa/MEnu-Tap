'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

interface ChartCardProps {
  title: string;
  data: { label: string; value: number }[];
  type?: 'area' | 'bar';
  color?: string;
}

export function ChartCard({ title, data, type = 'area', color = '#f97316' }: ChartCardProps) {
  const chartData = data.map((d) => ({ name: d.label, value: d.value }));

  return (
    <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-5 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/40">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" />
              <YAxis tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(8px)',
                }}
              />
              <Area type="monotone" dataKey="value" stroke={color} fill={`url(#grad-${title})`} strokeWidth={2} />
            </AreaChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" />
              <YAxis tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" />
              <Tooltip />
              <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
