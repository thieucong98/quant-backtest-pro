import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware } from './users.js';

export const analyticsRouter = Router();
analyticsRouter.use(authMiddleware);

// Helper: get userId
async function getUserId(req: Request): Promise<string> {
  if ((req as any).userId) return (req as any).userId;
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { email: 'dev@quantbacktest.com', name: 'Dev User', tier: 'PRO' }
    });
  }
  return user.id;
}

// GET /api/analytics/dashboard — Aggregated dashboard across all sessions
analyticsRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);

    // Get all completed sessions with snapshots
    const sessions = await prisma.session.findMany({
      where: { userId, status: 'COMPLETED' },
      include: { analyticsSnapshot: true },
      orderBy: { updatedAt: 'desc' }
    });

    // Aggregate stats
    let totalSessions = sessions.length;
    let totalTrades = 0;
    let totalNetProfit = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let bestSession: any = null;
    let worstSession: any = null;

    for (const s of sessions) {
      if (s.analyticsSnapshot) {
        const snap = s.analyticsSnapshot;
        totalTrades += snap.totalTrades;
        totalNetProfit += snap.netProfit;
        totalWins += snap.winTrades;
        totalLosses += snap.lossTrades;

        if (!bestSession || snap.netProfit > bestSession.netProfit) {
          bestSession = { sessionId: s.id, name: s.name, netProfit: snap.netProfit };
        }
        if (!worstSession || snap.netProfit < worstSession.netProfit) {
          worstSession = { sessionId: s.id, name: s.name, netProfit: snap.netProfit };
        }
      }
    }

    const overallWinRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100) : 0;

    res.json({
      totalSessions,
      totalTrades,
      totalNetProfit: Number(totalNetProfit.toFixed(2)),
      overallWinRate: Number(overallWinRate.toFixed(1)),
      totalWins,
      totalLosses,
      bestSession,
      worstSession,
      sessions: sessions.map(s => ({
        id: s.id,
        name: s.name,
        symbol: s.symbol,
        timeframe: s.timeframe,
        initialBalance: s.initialBalance,
        finalBalance: s.finalBalance,
        status: s.status,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        analytics: s.analyticsSnapshot
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/sessions/:id — Analytics for a single session
analyticsRouter.get('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const snapshot = await prisma.analyticsSnapshot.findUnique({
      where: { sessionId: req.params.id }
    });

    if (!snapshot) {
      res.status(404).json({ error: 'Analytics snapshot not found for this session' });
      return;
    }

    res.json({
      ...snapshot,
      heatmapData: snapshot.heatmapData ? JSON.parse(snapshot.heatmapData) : null,
      monteCarloData: snapshot.monteCarloData ? JSON.parse(snapshot.monteCarloData) : null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analytics/sessions/:id — Save/update analytics snapshot
analyticsRouter.post('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const data: any = { ...req.body };

    // Serialize JSON fields
    if (data.heatmapData && typeof data.heatmapData !== 'string') {
      data.heatmapData = JSON.stringify(data.heatmapData);
    }
    if (data.monteCarloData && typeof data.monteCarloData !== 'string') {
      data.monteCarloData = JSON.stringify(data.monteCarloData);
    }

    const snapshot = await prisma.analyticsSnapshot.upsert({
      where: { sessionId: req.params.id },
      create: { sessionId: req.params.id, ...data },
      update: data
    });

    res.json(snapshot);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
