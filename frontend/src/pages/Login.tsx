import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Check your email to confirm your account.' });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-800">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Subscription Tracker</h1>
          <p className="text-gray-400 mt-1">Detect recurring charges from your statements</p>
        </div>

        <form className="space-y-4 rounded-xl bg-surface-700 p-6 shadow-xl border border-surface-600">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-surface-600 border border-surface-500 px-3 py-2 text-white placeholder-gray-500 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-surface-600 border border-surface-500 px-3 py-2 text-white placeholder-gray-500 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {message && (
            <p className={`text-sm ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
              {message.text}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={signIn}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-accent-blue text-white font-medium hover:bg-blue-600 disabled:opacity-50 transition"
            >
              {loading ? 'Please wait...' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={signUp}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-surface-600 text-gray-200 font-medium hover:bg-surface-500 disabled:opacity-50 transition border border-surface-500"
            >
              Sign up
            </button>
          </div>
        </form>

        <p className="text-center text-gray-500 text-sm">
          No bank connection. Upload CSV statements to analyze.
        </p>
      </div>
    </div>
  );
}
