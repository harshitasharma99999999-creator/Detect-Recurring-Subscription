import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Subscription } from '../types';

interface SpendingChartProps {
  subscriptions: Subscription[];
}

export function SpendingChart({ subscriptions }: SpendingChartProps) {
  const data = useMemo(() => {
    const byMerchant = subscriptions
      .slice()
      .sort((a, b) => Number(b.monthly_equivalent) - Number(a.monthly_equivalent))
      .slice(0, 10)
      .map((s) => ({
        name: s.merchant_name.length > 18 ? s.merchant_name.slice(0, 18) + '…' : s.merchant_name,
        fullName: s.merchant_name,
        value: Number(s.monthly_equivalent),
      }));
    return byMerchant;
  }, [subscriptions]);

  if (data.length === 0) return null;

  const colors = ['#3b82f6', '#2563eb', '#1d4ed8', '#10b981', '#059669', '#f59e0b', '#d97706', '#8b5cf6', '#7c3aed', '#6366f1'];

  return (
    <div className="rounded-xl bg-surface-700 border border-surface-600 p-4 h-64">
      <h2 className="text-sm font-semibold text-gray-300 mb-3">Monthly recurring by merchant</h2>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
          <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
          <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#22262e', border: '1px solid #343b48', borderRadius: 8 }}
            labelStyle={{ color: '#e5e7eb' }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Monthly']}
            labelFormatter={(_, payload) => payload[0]?.payload?.fullName ?? ''}
          />
          <Bar dataKey="value" radius={4}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
