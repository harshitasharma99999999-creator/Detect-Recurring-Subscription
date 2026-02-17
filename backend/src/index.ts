import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { subscriptionsRouter } from './routes/subscriptions.js';
import { uploadRouter } from './routes/upload.js';

const app = express();
const PORT = process.env.PORT ?? 4000;

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const origins = frontendUrl.split(',').map((u) => u.trim()).filter(Boolean);
app.use(cors({
  origin: origins.length > 0 ? origins : ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', authRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/upload', uploadRouter);

app.get('/', (_req, res) => {
  res.json({ message: 'Subscription Tracker API', docs: 'Use /api/health, /api/auth, /api/upload, /api/subscriptions' });
});
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? 'Internal server error' });
});

// Only listen when running locally (not on Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
