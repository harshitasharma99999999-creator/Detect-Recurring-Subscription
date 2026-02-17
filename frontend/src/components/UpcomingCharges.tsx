import type { Subscription } from '../types';

interface UpcomingChargesProps {
  subscriptions: Subscription[];
}

export function UpcomingCharges({ subscriptions }: UpcomingChargesProps) {
  if (subscriptions.length === 0) return null;

  return (
    <div className="rounded-xl bg-surface-700 border border-surface-600 p-4">
      <h2 className="text-sm font-semibold text-gray-300 mb-3">Upcoming in the next 7 days</h2>
      <ul className="space-y-2">
        {subscriptions.map((s) => (
          <li key={s.id} className="flex justify-between items-center text-sm">
            <span className="text-white">{s.merchant_name}</span>
            <span className="text-accent-emerald font-mono">${Number(s.amount).toFixed(2)} on {s.next_expected_charge}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
