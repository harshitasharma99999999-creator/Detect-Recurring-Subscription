# Deployment Guide

## Option A: Vercel (frontend) + Render/Railway (backend)

Recommended for free tier: host the Express backend on a free Node service and the frontend on Vercel.

### Backend (e.g. Render)

1. Create a **Web Service** on [render.com](https://render.com).
2. Connect your repo; set root to `backend` or build from monorepo.
3. Build: `npm install && npm run build`
4. Start: `npm start` (or `node dist/index.js`)
5. Add environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL` (your Vercel app URL), `PORT` (Render sets this).

### Frontend (Vercel)

1. Connect repo to [vercel.com](https://vercel.com); set root to `frontend`.
2. Build command: `npm run build`; output directory: `dist`.
3. Environment variables:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - `VITE_API_URL` = your backend URL (e.g. `https://your-app.onrender.com`)
4. Deploy. In Supabase Auth URL settings, add your Vercel URL as redirect/site URL.

---

## Option B: Vercel serverless for both

To run the Express API on Vercel serverless, you need to export the app as a serverless function.

1. In `backend/`, add `api/index.ts` that imports and exports the Express app.
2. In project root, add `vercel.json` that routes `/api/*` to `backend/api/index.ts`.
3. Set all env vars in Vercel (both frontend and backend vars).

Example `backend/api/index.ts`:

```ts
import app from '../src/index.js';
export default app;
```

And in `index.ts` you would export the app: `export default app;` and not call `app.listen()` when running on Vercel (check `process.env.VERCEL`).

This requires a small refactor so the Express app is exported. For a quick deploy, Option A is simpler.
