import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware } from './users.js';

export const tradesRouter = Router();
tradesRouter.use(authMiddleware);

// GET /api/trades/history — Cross-session trade history
tradesRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const symbol = req.query.symbol as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const trades = await prisma.trade.findMany({
      where: {
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
    const trades = await prisma.trade.findMany({
      where: { sessionId: req.params.sessionId },
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
    const data: any = { ...req.body };
    if (data.openTime) data.openTime = BigInt(data.openTime);
    if (data.closeTime) data.closeTime = BigInt(data.closeTime);
    if (data.tags && Array.isArray(data.tags)) data.tags = JSON.stringify(data.tags);

    const trade = await prisma.trade.update({
      where: { id: req.params.id },
      data
    });
    res.json(trade);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/trades/:id
tradesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.trade.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
