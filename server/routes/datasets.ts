import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware } from './users.js';
import { KaggleDatasetService } from '../services/kaggleService.js';

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

// POST /api/datasets/kaggle/download — Download from Kaggle via cURL and save to DB
datasetsRouter.post('/kaggle/download', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const username = req.body?.username || process.env.KAGGLE_USERNAME;
    const key = req.body?.key || process.env.KAGGLE_KEY;
    const maxCandles = Number(req.body?.maxCandles) || 20000;
    const selectedTimeframes = req.body?.selectedTimeframes || ['M5', 'M15', 'H1', 'D1'];

    if (!username || !key) {
      res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp Kaggle Username và API Key (hoặc cấu hình trong .env)!'
      });
      return;
    }

    const zipPath = await KaggleDatasetService.downloadViaCurl(username, key);
    const summary = await KaggleDatasetService.importFromZipFile(zipPath, userId, {
      maxCandlesPerTimeframe: maxCandles,
      selectedTimeframes
    });

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/datasets/kaggle/scan-local — Scan local data/ directory for zip/csv
datasetsRouter.post('/kaggle/scan-local', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const maxCandles = Number(req.body?.maxCandles) || 20000;
    const selectedTimeframes = req.body?.selectedTimeframes || ['M5', 'M15', 'H1', 'D1'];

    const summary = await KaggleDatasetService.scanAndImportLocal(userId, {
      maxCandlesPerTimeframe: maxCandles,
      selectedTimeframes
    });

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/datasets/kaggle/import-zip — Import Base64 / uploaded ZIP buffer
datasetsRouter.post('/kaggle/import-zip', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const { base64Zip, maxCandles, selectedTimeframes } = req.body;

    if (!base64Zip) {
      res.status(400).json({ success: false, error: 'Dữ liệu file zip không hợp lệ' });
      return;
    }

    const buffer = Buffer.from(base64Zip, 'base64');
    const summary = await KaggleDatasetService.importFromZipFile(buffer, userId, {
      maxCandlesPerTimeframe: Number(maxCandles) || 20000,
      selectedTimeframes: selectedTimeframes || ['M5', 'M15', 'H1', 'D1']
    });

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/datasets/kaggle/seed-curated — Seed authentic real historical gold data
datasetsRouter.post('/kaggle/seed-curated', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const result = await KaggleDatasetService.seedCuratedRealGold(userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

