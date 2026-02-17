import { useState, useMemo } from 'react';
import type { Subscription, Card } from '../types';
import { api } from '../lib/api';
import { exportSubscriptionsCsv } from '../lib/api';

const NO_CARD_ID = '00000000-0000-0000-0000-000000000000';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  upcoming: Subscription[];
  cards: Card[];
  onUpdate: () => void;
}

const FREQ_LABEL: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export function SubscriptionList({ subscriptions, upcoming: _upcoming, cards, onUpdate }: SubscriptionListProps) {
  const [search, setSearch] = useState('');
  const [filterFreq, setFilterFreq] = useState<string>('all');
  const [filterCardId, setFilterCardId] = useState<string>('all');
  const [sort, setSort] = useState<'name' | 'amount' | 'next' | 'monthly'>('next');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const cardMap = useMemo(() => {
    const m = new Map<string, Card>();
    cards.forEach((c) => m.set(c.id, c));
    return m;
  }, [cards]);

  const filtered = useMemo(() => {
    let list = [...subscriptions];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.merchant_name.toLowerCase().includes(q));
    }
    if (filterFreq !== 'all') {
      list = list.filter((s) => s.frequency === filterFreq);
    }
    if (filterCardId !== 'all') {
      list = list.filter((s) => (s.card_id || NO_CARD_ID) === filterCardId);
    }
    if (sort === 'name') list.sort((a, b) => a.merchant_name.localeCompare(b.merchant_name));
    if (sort === 'amount') list.sort((a, b) => b.amount - a.amount);
    if (sort === 'next') list.sort((a, b) => a.next_expected_charge.localeCompare(b.next_expected_charge));
    if (sort === 'monthly') list.sort((a, b) => b.monthly_equivalent - a.monthly_equivalent);
    return list;
  }, [subscriptions, search, filterFreq, filterCardId, sort]);

  const markFalsePositive = async (id: string) => {
    setMarkingId(id);
    try {
      await api.subscriptions.markFalsePositive(id);
      onUpdate();
    } finally {
      setMarkingId(null);
    }
  };

  const deleteSub = async (id: string) => {
    setDeletingId(id);
    try {
      await api.subscriptions.delete(id);
      onUpdate();
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportSubscriptionsCsv();
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  };

  const totalMonthly = subscriptions.reduce((s, x) => s + Number(x.monthly_equivalent), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search merchants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg bg-surface-600 border border-surface-500 px-3 py-2 text-white placeholder-gray-500 w-56 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none"
        />
        <select
          value={filterCardId}
          onChange={(e) => setFilterCardId(e.target.value)}
          className="rounded-lg bg-surface-600 border border-surface-500 px-3 py-2 text-white focus:border-accent-blue outline-none"
        >
          <option value="all">All cards</option>
          <option value={NO_CARD_ID}>No card</option>
          {cards.map((c) => (
            <option key={c.id} value={c.id}>****{c.last_four} {c.nickname || c.cardholder_name}</option>
          ))}
        </select>
        <select
          value={filterFreq}
          onChange={(e) => setFilterFreq(e.target.value)}
          className="rounded-lg bg-surface-600 border border-surface-500 px-3 py-2 text-white focus:border-accent-blue outline-none"
        >
          <option value="all">All frequencies</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-lg bg-surface-600 border border-surface-500 px-3 py-2 text-white focus:border-accent-blue outline-none"
        >
          <option value="next">Sort by next charge</option>
          <option value="name">Sort by name</option>
          <option value="amount">Sort by amount</option>
          <option value="monthly">Sort by monthly cost</option>
        </select>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || subscriptions.length === 0}
          className="ml-auto rounded-lg bg-surface-600 border border-surface-500 px-4 py-2 text-sm text-gray-200 hover:bg-surface-500 disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="rounded-xl bg-surface-700 border border-surface-600 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-600 bg-surface-600/50">
                <th className="px-4 py-3 text-sm font-medium text-gray-300">Card</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-300">Merchant</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-300">Amount</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-300">Frequency</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-300">Next charge</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-300">Monthly equiv.</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-300 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const card = s.card_id && s.card_id !== NO_CARD_ID ? cardMap.get(s.card_id) : null;
                return (
                <tr key={s.id} className="border-b border-surface-600/80 hover:bg-surface-600/30">
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {card ? `****${card.last_four} ${card.nickname || card.cardholder_name}` : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{s.merchant_name}</td>
                  <td className="px-4 py-3 text-gray-300">${Number(s.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-300">{FREQ_LABEL[s.frequency] ?? s.frequency}</td>
                  <td className="px-4 py-3 text-gray-300">{s.next_expected_charge}</td>
                  <td className="px-4 py-3 text-accent-emerald font-mono">${Number(s.monthly_equivalent).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => markFalsePositive(s.id)}
                        disabled={markingId === s.id}
                        className="text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50"
                      >
                        Not a sub
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSub(s.id)}
                        disabled={deletingId === s.id}
                        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            {subscriptions.length === 0 ? 'No subscriptions to show.' : 'No matches for your filters.'}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-400">
        Total monthly recurring: <span className="font-mono text-accent-emerald">${totalMonthly.toFixed(2)}</span>
      </p>
    </div>
  );
}
