import type { ReactNode } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
const API_URL = import.meta.env.VITE_API_URL ?? '';

export const isConfigValid = Boolean(SUPABASE_URL && SUPABASE_ANON && API_URL);

export function ConfigGuard({ children }: { children: ReactNode }) {
  if (isConfigValid) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#1a1d24] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl bg-[#22262e] border border-[#343b48] p-6 text-left">
        <h1 className="text-xl font-semibold text-white mb-2">Configuration required</h1>
        <p className="text-gray-400 text-sm mb-4">
          Set these environment variables in your Vercel project (Settings → Environment Variables), then redeploy:
        </p>
        <ul className="text-gray-300 text-sm space-y-1 font-mono">
          <li>VITE_SUPABASE_URL</li>
          <li>VITE_SUPABASE_ANON_KEY</li>
          <li>VITE_API_URL</li>
        </ul>
        <p className="text-gray-500 text-xs mt-4">
          Get Supabase values from Supabase Dashboard → Project Settings → API. Use your backend Vercel URL for VITE_API_URL.
        </p>
      </div>
    </div>
  );
}
