import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware } from './users.js';

export const analyticsRouter = Router();
analyticsRouter.use(authMiddleware);

// Helper: get userId from authenticated request
function getUserId(req: Request): string {
  const userId = (req as any).userId;
  if (!userId) {
    throw new Error('Unauthorized: Thiếu định danh người dùng hợp lệ');
  }
  return userId;
}

// GET /api/analytics/dashboard — Aggregated dashboard across all sessions
analyticsRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    // Get all sessions with their trades & snapshots
    const sessions = await prisma.session.findMany({
      where: { userId },
      include: {
        analyticsSnapshot: true,
        trades: { where: { status: 'CLOSED' } }
      },
      orderBy: { updatedAt: 'desc' }
    });

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
      } else if (s.trades && s.trades.length > 0) {
        // Compute dynamically if snapshot not yet generated
        let sessionNet = 0;
        let sessionWins = 0;
        let sessionLosses = 0;
        for (const t of s.trades) {
          totalTrades++;
          totalNetProfit += t.realizedPnL;
          sessionNet += t.realizedPnL;
          if (t.realizedPnL > 0) {
            totalWins++;
            sessionWins++;
          } else if (t.realizedPnL < 0) {
            totalLosses++;
            sessionLosses++;
          }
        }

        if (!bestSession || sessionNet > bestSession.netProfit) {
          bestSession = { sessionId: s.id, name: s.name, netProfit: sessionNet };
        }
        if (!worstSession || sessionNet < worstSession.netProfit) {
          worstSession = { sessionId: s.id, name: s.name, netProfit: sessionNet };
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
        finalEquity: s.finalEquity,
        status: s.status,
        tradeCount: s.trades?.length || s.analyticsSnapshot?.totalTrades || 0,
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
    const { id } = req.params as { id: string };
    const userId = getUserId(req);

    const session = await prisma.session.findFirst({ where: { id, userId } });
    if (!session) {
      res.status(404).json({ error: 'Session not found or access denied' });
      return;
    }

    const snapshot = await prisma.analyticsSnapshot.findUnique({
      where: { sessionId: id }
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
    const { id } = req.params as { id: string };
    const userId = getUserId(req);

    const session = await prisma.session.findFirst({ where: { id, userId } });
    if (!session) {
      res.status(404).json({ error: 'Session not found or access denied' });
      return;
    }

    const data: any = { ...req.body };

    // Serialize JSON fields
    if (data.heatmapData && typeof data.heatmapData !== 'string') {
      data.heatmapData = JSON.stringify(data.heatmapData);
    }
    if (data.monteCarloData && typeof data.monteCarloData !== 'string') {
      data.monteCarloData = JSON.stringify(data.monteCarloData);
    }

    const snapshot = await prisma.analyticsSnapshot.upsert({
      where: { sessionId: id },
      create: { sessionId: id, ...data },
      update: data
    });

    res.json(snapshot);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
