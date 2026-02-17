import { useState } from 'react';
import type { Card } from '../types';
import { api } from '../lib/api';

const NO_CARD_ID = '00000000-0000-0000-0000-000000000000';

interface CardsSectionProps {
  cards: Card[];
  onUpdate: () => void;
  selectedCardId: string;
  onSelectCard: (id: string) => void;
}

export function CardsSection({ cards, onUpdate, selectedCardId, onSelectCard }: CardsSectionProps) {
  const [lastFour, setLastFour] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const four = lastFour.replace(/\D/g, '').slice(-4);
    if (four.length !== 4) {
      setError('Enter last 4 digits of your card');
      return;
    }
    if (!cardholderName.trim()) {
      setError('Enter cardholder name');
      return;
    }
    setLoading(true);
    try {
      await api.cards.create(four, cardholderName.trim(), nickname.trim() || undefined);
      setLastFour('');
      setCardholderName('');
      setNickname('');
      onUpdate();
    } catch (err) {
      const message = (err as Error).message;
      setError(
        message.includes('Cannot reach the API')
          ? 'Cannot reach the API. In Vercel → Frontend project → Settings → Environment Variables, set VITE_API_URL to your backend URL (e.g. https://detect-backend-xxx.vercel.app), then redeploy.'
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.cards.delete(id);
      if (selectedCardId === id) onSelectCard(NO_CARD_ID);
      onUpdate();
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-xl bg-surface-700 border border-surface-600 p-4 space-y-4">
      <h2 className="text-lg font-semibold text-white">My cards</h2>
      <p className="text-gray-400 text-sm">
        Add a card by last 4 digits and name. We never store your full card number. Then upload a statement and choose this card to see where it’s used for auto-pay.
      </p>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Last 4 digits</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={lastFour}
            onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="1234"
            className="w-24 rounded-lg bg-surface-600 border border-surface-500 px-3 py-2 text-white placeholder-gray-500 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Cardholder name</label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="John Doe"
            className="w-40 rounded-lg bg-surface-600 border border-surface-500 px-3 py-2 text-white placeholder-gray-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Nickname (optional)</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Personal Visa"
            className="w-36 rounded-lg bg-surface-600 border border-surface-500 px-3 py-2 text-white placeholder-gray-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="py-2 px-4 rounded-lg bg-accent-blue text-white text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Adding…' : 'Add card'}
        </button>
      </form>
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelectCard(NO_CARD_ID)}
          className={`px-3 py-1.5 rounded-lg text-sm ${selectedCardId === NO_CARD_ID ? 'bg-surface-500 text-white' : 'bg-surface-600 text-gray-400 hover:text-white'}`}
        >
          No card
        </button>
        {cards.map((c) => (
          <div key={c.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelectCard(c.id)}
              className={`px-3 py-1.5 rounded-lg text-sm ${selectedCardId === c.id ? 'bg-surface-500 text-white' : 'bg-surface-600 text-gray-400 hover:text-white'}`}
            >
              ****{c.last_four} {c.nickname || c.cardholder_name}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(c.id)}
              className="p-1 text-gray-500 hover:text-red-400 text-xs"
              title="Remove card"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export { NO_CARD_ID };
