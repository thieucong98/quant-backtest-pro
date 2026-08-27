import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware } from './users.js';

export const sessionsRouter = Router();
sessionsRouter.use(authMiddleware);

// Helper: get userId (fallback to default dev user)
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

// GET /api/sessions — List all sessions
sessionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const status = req.query.status as string | undefined;

    const sessions = await prisma.session.findMany({
      where: { userId, ...(status ? { status } : {}) },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { trades: true, drawings: true } },
        analyticsSnapshot: {
          select: { totalTrades: true, winRate: true, netProfit: true, profitFactor: true, maxDrawdownPercent: true }
        }
      }
    });

    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id — Full session detail
sessionsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = await getUserId(req);
    const session = await prisma.session.findFirst({
      where: { id, userId },
      include: {
        trades: { orderBy: { openTime: 'asc' } },
        drawings: true,
        equityPoints: { orderBy: { timestamp: 'asc' } },
        analyticsSnapshot: true
      }
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found or access denied' });
      return;
    }

    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions — Create new session
sessionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const { name, symbol, timeframe, initialBalance } = req.body;

    const session = await prisma.session.create({
      data: {
        userId,
        name: name || `${symbol} ${timeframe} - ${new Date().toLocaleDateString('vi-VN')}`,
        symbol,
        timeframe,
        initialBalance: initialBalance || 10000,
        finalBalance: initialBalance || 10000,
        finalEquity: initialBalance || 10000,
        currentIndex: 0,
        status: 'ACTIVE'
      }
    });

    res.status(201).json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sessions/:id — Update session (auto-save)
sessionsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = await getUserId(req);
    const existing = await prisma.session.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Session not found or access denied' });
      return;
    }

    const { finalBalance, finalEquity, currentIndex, status, name, symbol, timeframe, strategyId } = req.body;

    const session = await prisma.session.update({
      where: { id },
      data: {
        ...(finalBalance !== undefined && { finalBalance }),
        ...(finalEquity !== undefined && { finalEquity }),
        ...(currentIndex !== undefined && { currentIndex }),
        ...(status && { status }),
        ...(name && { name }),
        ...(symbol && { symbol }),
        ...(timeframe && { timeframe }),
        ...(strategyId !== undefined && { strategyId })
      }
    });

    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sessions/:id/complete — Mark completed + create analytics snapshot
sessionsRouter.put('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = await getUserId(req);
    const existing = await prisma.session.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Session not found or access denied' });
      return;
    }

    const { analyticsSnapshot, finalBalance, finalEquity } = req.body;

    const session = await prisma.session.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        finalBalance: finalBalance || undefined,
        finalEquity: finalEquity || undefined
      }
    });

    if (analyticsSnapshot) {
      await prisma.analyticsSnapshot.upsert({
        where: { sessionId: id },
        create: { sessionId: id, ...analyticsSnapshot },
        update: analyticsSnapshot
      });
    }

    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/bulk-delete — Delete multiple sessions
sessionsRouter.post('/bulk-delete', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const { ids } = req.body as { ids: string[] };
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'ids array required' });
      return;
    }

    const result = await prisma.session.deleteMany({
      where: { id: { in: ids }, userId }
    });

    res.json({ success: true, count: result.count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sessions/clear-all — Delete all sessions for current user
sessionsRouter.delete('/clear-all', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const result = await prisma.session.deleteMany({
      where: { userId }
    });
    res.json({ success: true, count: result.count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/:id/reset — Reset trades & balance of a session
sessionsRouter.post('/:id/reset', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = await getUserId(req);
    const session = await prisma.session.findFirst({ where: { id, userId } });
    if (!session) {
      res.status(404).json({ error: 'Session not found or access denied' });
      return;
    }

    // Delete trades, drawings, equity points, analytics
    await prisma.trade.deleteMany({ where: { sessionId: id } });
    await prisma.drawing.deleteMany({ where: { sessionId: id } });
    await prisma.equityPoint.deleteMany({ where: { sessionId: id } });
    await prisma.analyticsSnapshot.deleteMany({ where: { sessionId: id } });

    // Reset balance
    const updated = await prisma.session.update({
      where: { id },
      data: {
        finalBalance: session.initialBalance,
        finalEquity: session.initialBalance,
        currentIndex: 0,
        status: 'ACTIVE'
      }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sessions/:id
sessionsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = await getUserId(req);
    const existing = await prisma.session.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Session not found or access denied' });
      return;
    }

    await prisma.session.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
