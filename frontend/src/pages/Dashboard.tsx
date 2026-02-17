import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Subscription } from '../types';
import type { AnalyzeResult } from '../types';
import { UploadZone } from '../components/UploadZone';
import { SubscriptionList } from '../components/SubscriptionList';
import { UpcomingCharges } from '../components/UpcomingCharges';
import { SpendingChart } from '../components/SpendingChart';

export function Dashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [upcoming, setUpcoming] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refresh = async () => {
    try {
      const [list, up] = await Promise.all([
        api.subscriptions.list(),
        api.subscriptions.upcoming(),
      ]);
      setSubscriptions(Array.isArray(list) ? list : []);
      setUpcoming(Array.isArray(up) ? up : []);
    } catch {
      setSubscriptions([]);
      setUpcoming([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAnalyzed = (result: AnalyzeResult) => {
    setMessage({
      type: 'success',
      text: `Processed ${result.transactionsProcessed} transactions. Detected ${result.detected} recurring subscription(s).`,
    });
    refresh();
  };

  const totalMonthly = subscriptions.reduce((s, x) => s + Number(x.monthly_equivalent), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-0.5">Upload a CSV to detect recurring subscriptions</p>
      </div>

      <UploadZone
        onAnalyzed={handleAnalyzed}
        onError={(text) => setMessage({ type: 'error', text })}
      />

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading subscriptions...</div>
      ) : subscriptions.length === 0 ? (
        <div className="rounded-xl bg-surface-700 border border-surface-600 p-12 text-center">
          <p className="text-gray-400 text-lg">No subscriptions detected yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Upload a bank or credit card statement (CSV) above. We'll find recurring charges automatically.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-surface-700 border border-surface-600 p-4">
              <p className="text-sm text-gray-400">Active subscriptions</p>
              <p className="text-2xl font-bold text-white mt-0.5">{subscriptions.length}</p>
            </div>
            <div className="rounded-xl bg-surface-700 border border-surface-600 p-4">
              <p className="text-sm text-gray-400">Total monthly recurring</p>
              <p className="text-2xl font-bold text-accent-emerald mt-0.5 font-mono">
                ${totalMonthly.toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-700 border border-surface-600 p-4">
              <p className="text-sm text-gray-400">Upcoming (7 days)</p>
              <p className="text-2xl font-bold text-accent-amber mt-0.5">{upcoming.length}</p>
            </div>
          </div>

          <UpcomingCharges subscriptions={upcoming} />

          <SpendingChart subscriptions={subscriptions} />

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Subscription breakdown</h2>
            <SubscriptionList
              subscriptions={subscriptions}
              upcoming={upcoming}
              onUpdate={refresh}
            />
          </section>
        </>
      )}
    </div>
  );
}
