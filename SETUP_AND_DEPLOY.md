# Full setup and deploy: Supabase Auth + Vercel

Do these steps in order. The app is already wired for Supabase Auth and Vercel; you only need to create the projects and paste keys.

---

## Part 1: Supabase (auth + database)

### 1.1 Create project

1. Go to **[supabase.com](https://supabase.com)** → **Start your project** (sign in with GitHub or email).
2. Click **New project**.
3. Pick an **organization** (or create one).
4. Set **Name** (e.g. `subscription-tracker`), **Database password** (save it), **Region**.
5. Click **Create new project** and wait for it to be ready.

### 1.2 Run database migration

1. In the Supabase dashboard, open **SQL Editor**.
2. Click **New query**.
3. Open the file **`supabase/migrations/001_initial.sql`** in this repo and copy its **entire** contents.
4. Paste into the SQL Editor and click **Run**.
5. You should see “Success. No rows returned.” (the migration creates the `subscriptions` table and RLS).

### 1.3 Enable Email auth

1. Go to **Authentication** → **Providers**.
2. Click **Email**.
3. Ensure **Enable Email provider** is ON.
4. (Optional) Turn **Confirm email** OFF if you want to skip email verification for now.
5. Click **Save**.

### 1.4 Get API keys

1. Go to **Project Settings** (gear) → **API**.
2. Copy and save:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`) → you’ll use as `SUPABASE_URL` and `VITE_SUPABASE_URL`.
   - **anon public** key → `SUPABASE_ANON_KEY` and `VITE_SUPABASE_ANON_KEY`.
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` only (backend; keep secret).

You’ll paste these into Vercel in Part 2 and Part 3. Leave Supabase open; you’ll set URLs after deploying the frontend.

---

## Part 2: Vercel – backend (API)

### 2.1 Create backend project

1. Go to **[vercel.com/new](https://vercel.com/new)** and import your **Git repository** (this repo).
2. **Root Directory:** click **Edit** → set to **`backend`**.
3. **Framework Preset:** leave as **Other**.
4. **Build Command:** leave **empty**.
5. **Output Directory:** leave **empty** (backend is an API; if you had set it to `public` and the build failed, clear it — an empty `backend/public` folder is also in the repo so the build can pass if your project still expects it).
6. **Install Command:** `npm install`.
7. Do **not** deploy yet.

### 2.2 Backend environment variables

1. Open **Settings** → **Environment Variables**.
2. Add these (use the Supabase values from 1.4):

   | Name                         | Value                     | Environments |
   |-----------------------------|---------------------------|--------------|
   | `SUPABASE_URL`              | Your Supabase Project URL | Production, Preview |
   | `SUPABASE_ANON_KEY`         | Supabase anon key         | Production, Preview |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | Production, Preview |
   | `` FRONTEND_URL             | `https://YOUR-FRONTEND-URL.vercel.app` (replace after Part 3) | Production, Preview |

3. For **FRONTEND_URL**: you can set a placeholder now (e.g. `https://placeholder.vercel.app`) and update it in **Part 4** after the frontend is deployed.

### 2.3 Deploy backend

1. Go to **Deployments** and click **Redeploy** (or deploy from the initial import).
2. After deploy, copy your backend URL, e.g. **`https://subscription-tracker-api-xxx.vercel.app`**.
3. Test: open **`https://YOUR-BACKEND-URL/api/health`** in a browser. You should see `{"ok":true}`.

---

## Part 3: Vercel – frontend

### 3.1 Create frontend project

1. Go to **[vercel.com/new](https://vercel.com/new)** again and import the **same** repository.
2. **Root Directory:** set to **`frontend`**.
3. **Framework Preset:** Vite (auto-detected).
4. **Build Command:** `npm run build`.
5. **Output Directory:** `dist`.

### 3.2 Frontend environment variables

1. **Settings** → **Environment Variables**.
2. Add:

   | Name                     | Value |
   |--------------------------|--------|
   | `VITE_SUPABASE_URL`      | Your Supabase Project URL (from 1.4) |
   | `VITE_SUPABASE_ANON_KEY` | Supabase anon key (from 1.4) |
   | `VITE_API_URL`           | Your **backend** URL from Part 2 (e.g. `https://subscription-tracker-api-xxx.vercel.app`) |

3. Apply to **Production** and **Preview**.

### 3.3 Deploy frontend

1. Deploy the project.
2. Copy the frontend URL, e.g. **`https://subscription-tracker-xxx.vercel.app`**.

---

## Part 4: Wire Supabase Auth and backend CORS

### 4.1 Supabase Auth URLs

1. In **Supabase** → **Authentication** → **URL Configuration**.
2. **Site URL:** set to your **frontend** URL, e.g. `https://subscription-tracker-xxx.vercel.app`.
3. **Redirect URLs:** add (one per line):
   - `https://subscription-tracker-xxx.vercel.app/**`
   - `http://localhost:5173/**` (for local dev)
4. **Save**.

### 4.2 Backend FRONTEND_URL (CORS)

1. In **Vercel**, open your **backend** project.
2. **Settings** → **Environment Variables**.
3. Set **`FRONTEND_URL`** to your **frontend** URL (e.g. `https://subscription-tracker-xxx.vercel.app`). If you used a placeholder before, replace it now.
4. **Redeploy** the backend so the new value is used.

---

## Part 5: Done

- **Frontend:** `https://your-frontend.vercel.app` — sign up, sign in, upload CSV. **This is the app users open.**
- **API:** `https://your-backend.vercel.app` — shows a short message at `/`; use `/api/health`, `/api/auth`, etc. for the API.
- **Supabase:** Auth (email/password) and database are connected; sessions and subscriptions are stored per user.

### Which URL do I open to use the app?

- **Open the FRONTEND project URL** (the one whose Root Directory is **`frontend`**). That’s where the login and dashboard live.
- The **backend** project URL (Root = **`backend`**) is only for API calls. Visiting it in the browser shows a short “API” message, not the app. If you only have one Vercel project and it’s the backend, create a **second** project with Root = **`frontend`** and use that second project’s URL as your app.

### Quick test

1. Open your frontend URL.
2. Click **Sign up** and create an account (use a real email if you left “Confirm email” ON).
3. After sign-in you should see the dashboard. Upload **`sample-statement.csv`** from this repo to test detection.

### App shows a black screen or "Configuration required"

The frontend needs three env vars in Vercel (Settings → Environment Variables): **VITE_SUPABASE_URL**, **VITE_SUPABASE_ANON_KEY**, **VITE_API_URL**. If any are missing, add them and **Redeploy** the frontend.

### Login / auth not working

1. **Backend must respond:** Open `https://YOUR-BACKEND-URL/api/health` — you should see `{"ok":true}`. If you see 404, the backend project needs **Root Directory** = `backend` and **Build Command** / **Output Directory** left empty (the repo’s `backend/vercel.json` routes traffic to the Express app).
2. **Frontend env:** In the **frontend** Vercel project, **VITE_API_URL** must be exactly your backend URL (e.g. `https://detect-backend-xxx.vercel.app`), with no trailing slash.
3. **Backend env:** In the **backend** Vercel project, **FRONTEND_URL** must be your frontend URL (e.g. `https://detect-recurring-subscription-rmhj.vercel.app`) so CORS allows the browser to call the API.
4. **Supabase:** In Supabase → **Authentication** → **URL Configuration**, set **Site URL** and **Redirect URLs** to your frontend URL.

---

## Local development

**Backend**

```bash
cd backend
cp ../.env.example .env
# Edit .env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, FRONTEND_URL=http://localhost:5173
npm install
npm run dev
```

**Frontend**

```bash
cd frontend
cp .env.example .env
# Edit .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL=http://localhost:4000
npm install
npm run dev
```

Then open **http://localhost:5173**. The frontend proxies `/api` to the backend when `VITE_API_URL` is not set or points to localhost (see `vite.config.ts`); for a direct backend URL, set `VITE_API_URL=http://localhost:4000`.

---

## Env reference

| Variable | Where | Purpose |
|----------|--------|---------|
| `SUPABASE_URL` | Backend env | Supabase project URL |
| `SUPABASE_ANON_KEY` | Backend env | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend env | Server-side Supabase access (auth + DB) |
| `FRONTEND_URL` | Backend env | Allowed CORS origin for API |
| `VITE_SUPABASE_URL` | Frontend env | Supabase URL for Auth client |
| `VITE_SUPABASE_ANON_KEY` | Frontend env | Supabase anon key for Auth client |
| `VITE_API_URL` | Frontend env | Backend API base URL |
