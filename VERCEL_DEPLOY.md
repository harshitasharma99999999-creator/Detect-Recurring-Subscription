# Deploy on Vercel (step-by-step)

You’ll create **two Vercel projects** from the same repo: one for the API (backend) and one for the frontend.

---

## Is Supabase Auth free?

**Yes.** Supabase’s free tier includes:

- **Authentication** (email/password, magic links, OAuth)
- **50,000 monthly active users (MAU)**
- Database, storage, and realtime on free limits

No credit card required to start. See [Supabase Pricing](https://supabase.com/pricing).

---

## 1. Deploy the backend (API)

1. Go to [vercel.com/new](https://vercel.com/new) and import your Git repo.
2. **Configure:**
   - **Root Directory:** click “Edit” and set to **`backend`**.
   - **Framework Preset:** leave as “Other” (Vercel will detect Express from `src/index.ts`).
   - **Build Command:** leave empty or set to `npm run build` (optional; Express can run without a build).
   - **Output Directory:** leave empty.
   - **Install Command:** `npm install`.

3. **Environment variables** (Settings → Environment Variables):

   | Name                       | Value                          |
   |----------------------------|--------------------------------|
   | `SUPABASE_URL`             | Your Supabase project URL      |
   | `SUPABASE_ANON_KEY`        | Supabase anon (public) key     |
   | `SUPABASE_SERVICE_ROLE_KEY`| Supabase service_role key      |
   | `FRONTEND_URL`             | Your frontend URL (step 2 below) |

4. Deploy. Note the URL, e.g. **`https://your-api-name.vercel.app`**.  
   Test: open `https://your-api-name.vercel.app/api/health` — you should see `{"ok":true}`.

---

## 2. Deploy the frontend

1. Create a **second** project: [vercel.com/new](https://vercel.com/new) and import the **same** repo again.
2. **Configure:**
   - **Root Directory:** set to **`frontend`**.
   - **Framework Preset:** Vite (should be auto-detected).
   - **Build Command:** `npm run build`.
   - **Output Directory:** `dist`.

3. **Environment variables:**

   | Name                    | Value                                      |
   |-------------------------|--------------------------------------------|
   | `VITE_SUPABASE_URL`     | Your Supabase project URL                  |
   | `VITE_SUPABASE_ANON_KEY`| Supabase anon (public) key                |
   | `VITE_API_URL`          | Backend URL from step 1 (e.g. `https://your-api-name.vercel.app`) |

4. Deploy. Note the frontend URL, e.g. **`https://your-app.vercel.app`**.

---

## 3. Point backend to frontend

1. In the **backend** project on Vercel, go to **Settings → Environment Variables**.
2. Set **`FRONTEND_URL`** to your frontend URL (e.g. `https://your-app.vercel.app`).
3. Redeploy the backend so the new variable is used.

---

## 4. Supabase Auth URLs

1. In [Supabase Dashboard](https://app.supabase.com) → your project → **Authentication → URL Configuration**.
2. Set **Site URL** to your frontend URL: `https://your-app.vercel.app`.
3. Add **Redirect URLs**: `https://your-app.vercel.app/**` (and `http://localhost:5173/**` for local dev).

---

## 5. Done

- **Frontend:** `https://your-app.vercel.app`  
- **API:** `https://your-api-name.vercel.app` (e.g. `/api/health`, `/api/auth/session`, etc.)

Sign up on the frontend and upload a CSV to confirm everything works.

---

## Optional: single repo, one Vercel project

If you prefer one project that serves both frontend and API:

- Use **monorepo** or **rewrites** so that:
  - `/` and other pages are served by the Vite app.
  - `/api/*` is handled by the Express app.

That requires a small amount of extra config (e.g. root `vercel.json` with rewrites and two build outputs). The **two-project** setup above is the simplest and recommended.
