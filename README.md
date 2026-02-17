# Subscription Tracker

A fintech web app that **detects recurring subscriptions** from bank or credit card statement CSVs. No paid APIs, no bank integrations, no scraping—just CSV upload and optional Gmail (free tier).

## Tech stack

- **Frontend:** React (Vite), TypeScript, TailwindCSS, Recharts, dark mode by default
- **Backend:** Node.js + Express, Supabase (free tier) for auth + database
- **Deploy:** Vercel (frontend + API, both free tier) and Supabase Cloud (free).  
  **→ Do everything in one place: [SETUP_AND_DEPLOY.md](./SETUP_AND_DEPLOY.md)** (Supabase project + Auth + DB migration, then Vercel backend + frontend + env vars).

## Project structure

```
detect-recurring-subscription/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express app
│   │   ├── subscriptionDetector.ts  # Recurring detection algorithm
│   │   ├── lib/
│   │   │   └── supabase.ts       # Supabase client (service role)
│   │   ├── routes/
│   │   │   ├── auth.ts           # Session validation
│   │   │   ├── upload.ts         # CSV analyze + store
│   │   │   └── subscriptions.ts # CRUD, upcoming, export
│   │   └── utils/
│   │       └── csvParser.ts     # Smart CSV parser
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Layout, UploadZone, SubscriptionList, etc.
│   │   ├── pages/               # Login, Dashboard
│   │   ├── hooks/               # useAuth
│   │   └── lib/                 # supabase, api
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── supabase/
│   └── migrations/
│       └── 001_initial.sql      # subscriptions table + RLS
├── .env.example
└── README.md
```

## Supabase setup (free tier)

**Supabase Auth is free** on the free tier: email/password, magic links, and 50,000 monthly active users. No credit card required. See [Supabase Pricing](https://supabase.com/pricing).

1. **Create a project** at [supabase.com](https://supabase.com) (free tier).

2. **Get keys:** Project Settings → API:
   - `Project URL` → `SUPABASE_URL`
   - `anon` public key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (backend only; keep secret)

3. **Run the migration:**
   - In Supabase Dashboard: SQL Editor → New query.
   - Paste the contents of `supabase/migrations/001_initial.sql`.
   - Run it.

4. **Auth:** Enable Email in Authentication → Providers. No extra config needed for email/password.

5. **Optional:** Add your frontend URL in Authentication → URL Configuration (e.g. `http://localhost:5173` for dev).

## Local development

### Backend

```bash
cd backend
cp ../.env.example .env
# Edit .env with your Supabase URL and keys
npm install
npm run dev
```

Runs at `http://localhost:4000`.

### Frontend

```bash
cd frontend
# Create frontend/.env with:
# VITE_SUPABASE_URL=<your Supabase URL>
# VITE_SUPABASE_ANON_KEY=<your anon key>
# VITE_API_URL=http://localhost:4000
npm install
npm run dev
```

Runs at `http://localhost:5173`. Vite proxy forwards `/api` to the backend.

### End-to-end

1. Open `http://localhost:5173`.
2. Sign up with email/password (Supabase sends confirmation if enabled).
3. Upload a CSV (columns: Date, Description/Merchant, Amount; debit/credit optional).
4. View detected subscriptions, upcoming charges, and monthly recurring total.

## CSV format

The parser supports common formats:

- **Date:** `YYYY-MM-DD`, `MM/DD/YYYY`, `DD-MM-YYYY`, or 8-digit `YYYYMMDD`
- **Description/Merchant:** any column named Description, Merchant, Memo, Payee, etc.
- **Amount:** numeric; optional Debit/Credit column to set sign

We only use **outgoing (debit)** amounts for recurrence detection. No raw card numbers are stored—only transaction metadata (date, merchant, amount).

## Deployment (Vercel free tier)

### Backend as Vercel serverless

1. In `backend/`, add `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    { "src": "src/index.ts", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "src/index.ts" }
  ]
}
```

2. Deploy backend to Vercel (e.g. project name `subscription-api`). Set env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL` (your frontend URL).

3. Expose Express app as default export for Vercel:

   - Create `backend/src/vercel.ts` that exports the Express app, and point `builds.src` to it, or use a single entry that works with `@vercel/node` (e.g. export `app` from `index.ts` and use `vercel.json` to route `/api/*` to that handler).

A simpler approach: keep the backend as a **single Express app** and deploy it to a free Node host (e.g. Render, Railway) that supports long-running processes, and deploy the frontend to Vercel with `VITE_API_URL` pointing to that backend URL.

### Frontend on Vercel

1. Connect the `frontend` folder (or repo) to Vercel.
2. Build command: `npm run build`. Output: `dist`.
3. Set env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (your backend API URL).
4. Deploy.

## Security

- **No card numbers:** Only date, merchant name, and amount are stored.
- **Per-user data:** Supabase RLS ensures users only see their own rows.
- **Backend:** Uses `SUPABASE_SERVICE_ROLE_KEY` only on the server to validate JWT and perform DB writes; never expose service role to the client.

## How the recurring detection algorithm works

1. **Parse CSV**  
   Rows become transactions: date, merchant (description), amount. Only positive (debit) amounts are considered.

2. **Group by merchant (fuzzy)**  
   Transactions are grouped by **merchant name similarity** using a string similarity score (Levenshtein-based). Names are normalized (lowercase, strip symbols, single spaces). Groups with similarity above a threshold (e.g. 0.75) are treated as the same merchant.

3. **Same or near-same amount**  
   Within each group, we look for a **recurring amount**: the same (or within a small tolerance, e.g. 2%) charge appearing multiple times.

4. **Interval pattern**  
   For transactions with that amount, we compute **days between consecutive dates**. Intervals are classified:
   - **Weekly:** 6–8 days  
   - **Monthly:** 28–33 days  
   - **Yearly:** 355–375 days  

5. **Consistency**  
   All intervals in that group must fall in the same band (e.g. all monthly). We use the average interval to assign frequency and to compute the **next expected charge**.

6. **Minimum occurrences**  
   A subscription is reported only if there are **at least 3** such recurring occurrences (same merchant, same amount, consistent interval). One-off or twice-only charges are ignored.

7. **Output**  
   For each detected subscription we store: merchant name, amount, frequency (weekly/monthly/yearly), last charge date, next expected charge, and a **monthly equivalent** (weekly × 52/12, yearly ÷ 12) for the dashboard total.

Result: recurring subscriptions are detected from CSV only, with no paid APIs or bank integrations.
