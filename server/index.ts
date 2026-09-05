import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { sessionsRouter } from './routes/sessions.js';
import { tradesRouter } from './routes/trades.js';
import { strategiesRouter } from './routes/strategies.js';
import { datasetsRouter } from './routes/datasets.js';
import { analyticsRouter } from './routes/analytics.js';
import { usersRouter, getOrCreateDefaultUser } from './routes/users.js';
import { drawingsRouter } from './routes/drawings.js';
import { brokerRouter } from './routes/broker.js';
import { tunnelRouter } from './routes/tunnel.js';
import { calendarRouter } from './routes/calendar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Polyfill BigInt JSON serialization for Prisma
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '250mb' })); // Large payloads for candle data and zip imports
app.use(express.urlencoded({ limit: '250mb', extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', usersRouter);
app.use('/api/users', usersRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/strategies', strategiesRouter);
app.use('/api/datasets', datasetsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/drawings', drawingsRouter);
app.use('/api/broker', brokerRouter);
app.use('/api/tunnel', tunnelRouter);
app.use('/api/calendar', calendarRouter);

// Frontend Static File Serving & SPA Fallback
const candidateStaticPaths = [
  process.env.STATIC_PATH,
  path.resolve(process.cwd(), '../dist'),
  path.resolve(process.cwd(), 'dist'),
  path.resolve(__dirname, '../../dist'),
  path.resolve(__dirname, '../dist'),
  '/app/dist'
].filter(Boolean) as string[];

let staticDistPath: string | null = null;
for (const p of candidateStaticPaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
    staticDistPath = p;
    break;
  }
}

if (staticDistPath) {
  app.use(express.static(staticDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(staticDistPath!, 'index.html'));
  });
}

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
  console.log(`\n🚀 Quant Backtest Pro Server`);
  console.log(`   ├─ URL:             http://localhost:${PORT}`);
  console.log(`   ├─ Frontend:        ${staticDistPath ? `Mounted (${staticDistPath})` : 'API Only (Dev mode)'}`);
  console.log(`   ├─ Database:        SQLite (Prisma ORM)`);
  console.log(`   ├─ Default Account: admin@quantbacktest.pro / QuantPro@2026`);
  console.log(`   └─ Status:          Ready\n`);
});

export default app;

