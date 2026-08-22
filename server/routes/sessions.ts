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
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        trades: { orderBy: { openTime: 'asc' } },
        drawings: true,
        equityPoints: { orderBy: { timestamp: 'asc' } },
        analyticsSnapshot: true
      }
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
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
    const { finalBalance, finalEquity, currentIndex, status, name, symbol, timeframe, strategyId } = req.body;

    const session = await prisma.session.update({
      where: { id: req.params.id },
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
    const { analyticsSnapshot, finalBalance, finalEquity } = req.body;

    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        finalBalance: finalBalance || undefined,
        finalEquity: finalEquity || undefined
      }
    });

    if (analyticsSnapshot) {
      await prisma.analyticsSnapshot.upsert({
        where: { sessionId: req.params.id },
        create: { sessionId: req.params.id, ...analyticsSnapshot },
        update: analyticsSnapshot
      });
    }

    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sessions/:id
sessionsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.session.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
