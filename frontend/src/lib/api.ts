import { supabase } from './supabase';

const API = import.meta.env.VITE_API_URL ?? '';

async function getToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = await getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(opts.headers as object),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return undefined;
  return res.json();
}

export const api = {
  cards: {
    list: () => apiFetch('/api/cards'),
    create: (last_four: string, cardholder_name: string, nickname?: string) =>
      apiFetch('/api/cards', {
        method: 'POST',
        body: JSON.stringify({ last_four, cardholder_name, nickname }),
      }),
    delete: (id: string) => apiFetch(`/api/cards/${id}`, { method: 'DELETE' }),
  },
  auth: {
    session: (accessToken: string) =>
      fetch(`${API}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Invalid session')))),
  },
  upload: {
    analyze: (csvContent: string, cardId?: string) =>
      apiFetch('/api/upload/analyze', {
        method: 'POST',
        body: JSON.stringify({ csv_content: csvContent, card_id: cardId || undefined }),
      }),
  },
  subscriptions: {
    list: () => apiFetch('/api/subscriptions'),
    upcoming: () => apiFetch('/api/subscriptions/upcoming'),
    markFalsePositive: (id: string) => apiFetch(`/api/subscriptions/${id}/false-positive`, { method: 'PATCH' }),
    delete: (id: string) => apiFetch(`/api/subscriptions/${id}`, { method: 'DELETE' }),
    exportCsv: () => `${API}/api/subscriptions/export?token=${encodeURIComponent('')}`,
  },
};

export async function exportSubscriptionsCsv() {
  const token = await getToken();
  if (!token) throw new Error('Not logged in');
  const url = `${API}/api/subscriptions/export`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'subscriptions.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
