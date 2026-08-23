import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { sessionsRouter } from './routes/sessions.js';
import { tradesRouter } from './routes/trades.js';
import { strategiesRouter } from './routes/strategies.js';
import { datasetsRouter } from './routes/datasets.js';
import { analyticsRouter } from './routes/analytics.js';
import { usersRouter, getOrCreateDefaultUser } from './routes/users.js';
import { drawingsRouter } from './routes/drawings.js';

// Polyfill BigInt JSON serialization for Prisma
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Large payloads for candle data

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', usersRouter);
app.use('/api/users', usersRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/strategies', strategiesRouter);
app.use('/api/datasets', datasetsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/drawings', drawingsRouter);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[SERVER ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, async () => {
  try {
    await getOrCreateDefaultUser();
  } catch (e: any) {
    console.error('[AUTH SEED ERROR]', e.message);
  }
  console.log(`\n🚀 Quant Backtest Pro API Server`);
  console.log(`   ├─ URL:             http://localhost:${PORT}`);
  console.log(`   ├─ Database:        SQLite (Prisma ORM)`);
  console.log(`   ├─ Default Account: admin@quantbacktest.pro / QuantPro@2026`);
  console.log(`   └─ Status:          Ready\n`);
});

export default app;
