import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware } from './users.js';

export const tradesRouter = Router();
tradesRouter.use(authMiddleware);

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

// GET /api/trades/history — Cross-session trade history
tradesRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const symbol = req.query.symbol as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const trades = await prisma.trade.findMany({
      where: {
        session: { userId },
        ...(symbol ? { symbol } : {}),
        ...(status ? { status } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        session: { select: { id: true, name: true, symbol: true, timeframe: true } }
      }
    });

    const total = await prisma.trade.count({
      where: {
        session: { userId },
        ...(symbol ? { symbol } : {}),
        ...(status ? { status } : {})
      }
    });

    res.json({ trades, total, limit, offset });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:sessionId/trades — Trades within a session
tradesRouter.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params as { sessionId: string };
    const userId = await getUserId(req);
    const session = await prisma.session.findFirst({ where: { id: sessionId, userId } });
    if (!session) {
      res.status(404).json({ error: 'Session not found or access denied' });
      return;
    }

    const trades = await prisma.trade.findMany({
      where: { sessionId },
      orderBy: { openTime: 'asc' }
    });
    res.json(trades);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trades — Create single trade
tradesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const { sessionId } = req.body;
    if (sessionId) {
      const session = await prisma.session.findFirst({ where: { id: sessionId, userId } });
      if (!session) {
        res.status(404).json({ error: 'Session not found or access denied' });
        return;
      }
    }
    const trade = await prisma.trade.create({ data: req.body });
    res.status(201).json(trade);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trades/bulk — Bulk upsert trades (for auto-save)
tradesRouter.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { sessionId, trades } = req.body;
    if (!sessionId || !Array.isArray(trades)) {
      res.status(400).json({ error: 'sessionId and trades array required' });
      return;
    }

    const userId = await getUserId(req);
    const session = await prisma.session.findFirst({ where: { id: sessionId, userId } });
    if (!session) {
      res.status(404).json({ error: 'Session not found or access denied' });
      return;
    }

    // Delete all existing trades for this session and re-create
    await prisma.trade.deleteMany({ where: { sessionId } });

    if (trades.length > 0) {
      await prisma.trade.createMany({
        data: trades.map((t: any) => ({
          id: t.id,
          sessionId,
          orderId: t.orderId,
          symbol: t.symbol,
          side: t.side,
          lotSize: t.lotSize,
          entryPrice: t.entryPrice,
          closePrice: t.closePrice || null,
          stopLoss: t.stopLoss || null,
          takeProfit: t.takeProfit || null,
          trailingStopPips: t.trailingStopPips || null,
          commission: t.commission || 0,
          swap: t.swap || 0,
          floatingPnL: t.floatingPnL || 0,
          realizedPnL: t.realizedPnL || 0,
          status: t.status,
          closeReason: t.closeReason || null,
          comment: t.comment || null,
          tags: t.tags ? JSON.stringify(t.tags) : null,
          note: t.note || null,
          openTime: BigInt(t.openTime),
          closeTime: t.closeTime ? BigInt(t.closeTime) : null
        }))
      });
    }

    res.json({ success: true, count: trades.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/trades/:id — Update a trade
tradesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = await getUserId(req);
    const trade = await prisma.trade.findUnique({
      where: { id },
      include: { session: { select: { userId: true } } }
    });
    if (!trade || trade.session?.userId !== userId) {
      res.status(404).json({ error: 'Trade not found or access denied' });
      return;
    }

    const data: any = { ...req.body };
    if (data.openTime) data.openTime = BigInt(data.openTime);
    if (data.closeTime) data.closeTime = BigInt(data.closeTime);
    if (data.tags && Array.isArray(data.tags)) data.tags = JSON.stringify(data.tags);

    const updated = await prisma.trade.update({
      where: { id },
      data
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/trades/:id
tradesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = await getUserId(req);
    const trade = await prisma.trade.findUnique({
      where: { id },
      include: { session: { select: { userId: true } } }
    });
    if (!trade || trade.session?.userId !== userId) {
      res.status(404).json({ error: 'Trade not found or access denied' });
      return;
    }

    await prisma.trade.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
