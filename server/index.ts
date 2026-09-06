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
import { tunnelRouter, verifyTunnelPin } from './routes/tunnel.js';
import { calendarRouter } from './routes/calendar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { prisma } from './prisma.js';
export { prisma };


const app = express();
const PORT = process.env.PORT || 3001;

// Allowed CORS origins: Local development, Docker, and Tunnel domains
const allowedOriginPatterns = [
  /^http:\/\/localhost:(5173|5174|4173|3000|3001|3002)$/,
  /^http:\/\/127\.0\.0\.1:(5173|5174|4173|3000|3001|3002)$/,
  /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com$/,
  /https:\/\/[a-zA-Z0-9-]+\.loca\.lt$/
];

// Security Hardened Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOriginPatterns.some(pattern => pattern.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for unauthorized origin: ${origin}`));
    }
  },
  credentials: true
}));

// Enterprise HTTP Security Headers (OWASP Recommended)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// In-memory rate-limiter for Brute-force & DDoS Mitigation
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimiter(options: { windowMs: number; max: number; message: string }) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = (req.ip || req.socket.remoteAddress || 'unknown').replace(/^.*:/, '');
    const key = `${req.baseUrl || ''}${req.path}_${ip}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (entry.count >= options.max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ error: options.message });
    }

    entry.count++;
    next();
  };
}

const authLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Quá nhiều yêu cầu xác thực. Vui lòng thử lại sau 1 phút.'
});

const pinLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Quá nhiều lần thử mã PIN. Vui lòng đợi 1 phút trước khi thử lại.'
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enforce Remote Tunnel PIN if configured
app.use('/api', verifyTunnelPin);
app.use('/api/tunnel/verify-pin', pinLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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

