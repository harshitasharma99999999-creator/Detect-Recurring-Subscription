import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Layout() {
  const navigate = useNavigate();

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-800 flex flex-col">
      <header className="border-b border-surface-600 sticky top-0 z-10 bg-surface-800/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <h1 className="text-lg font-semibold text-white font-sans">Subscription Tracker</h1>
          <button
            type="button"
            onClick={signOut}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
