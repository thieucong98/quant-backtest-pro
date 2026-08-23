import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware } from './users.js';

export const datasetsRouter = Router();
datasetsRouter.use(authMiddleware);

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

// GET /api/datasets — List datasets (without candle data for speed)
datasetsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const datasets = await prisma.dataset.findMany({
      where: { userId },
      select: {
        id: true,
        symbol: true,
        timeframe: true,
        candleCount: true,
        startDate: true,
        endDate: true,
        source: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(datasets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/datasets/:id — Full dataset with candles
datasetsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const dataset = await prisma.dataset.findUnique({
      where: { id }
    });

    if (!dataset) {
      res.status(404).json({ error: 'Dataset not found' });
      return;
    }

    res.json({
      ...dataset,
      candles: JSON.parse(dataset.candles || '[]')
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/datasets/find/:symbol/:timeframe — Find by symbol+timeframe
datasetsRouter.get('/find/:symbol/:timeframe', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const { symbol, timeframe } = req.params as { symbol: string; timeframe: string };
    const dataset = await prisma.dataset.findUnique({
      where: {
        userId_symbol_timeframe: {
          userId,
          symbol,
          timeframe
        }
      }
    });

    if (!dataset) {
      res.status(404).json({ error: 'Dataset not found' });
      return;
    }

    res.json({
      ...dataset,
      candles: JSON.parse(dataset.candles || '[]')
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/datasets — Save dataset
datasetsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const { symbol, timeframe, candles, source } = req.body;

    if (!symbol || !timeframe || !candles || !Array.isArray(candles)) {
      res.status(400).json({ error: 'symbol, timeframe, and candles[] required' });
      return;
    }

    const dataset = await prisma.dataset.upsert({
      where: {
        userId_symbol_timeframe: { userId, symbol, timeframe }
      },
      create: {
        userId,
        symbol,
        timeframe,
        candleCount: candles.length,
        startDate: BigInt(candles[0]?.timestamp || 0),
        endDate: BigInt(candles[candles.length - 1]?.timestamp || 0),
        candles: JSON.stringify(candles),
        source: source || 'import'
      },
      update: {
        candleCount: candles.length,
        startDate: BigInt(candles[0]?.timestamp || 0),
        endDate: BigInt(candles[candles.length - 1]?.timestamp || 0),
        candles: JSON.stringify(candles),
        source: source || 'import'
      }
    });

    res.status(201).json({
      id: dataset.id,
      symbol: dataset.symbol,
      timeframe: dataset.timeframe,
      candleCount: dataset.candleCount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/datasets/:id
datasetsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.dataset.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
