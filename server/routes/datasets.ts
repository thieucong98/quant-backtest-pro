import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { authMiddleware } from './users.js';
import { KaggleDatasetService, KAGGLE_PRESETS } from '../services/kaggleService.js';


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

// GET /api/datasets/kaggle/presets — Catalogue of financial datasets from Novandra Anugrah
datasetsRouter.get('/kaggle/presets', (_req: Request, res: Response) => {
  res.json({
    success: true,
    presets: KAGGLE_PRESETS
  });
});

// POST /api/datasets/kaggle/download-single — Download a single CSV file directly from Kaggle (297KB - 8MB instant)
datasetsRouter.post('/kaggle/download-single', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const { datasetSlug, fileName, username, key, maxCandles } = req.body;

    if (!datasetSlug || !fileName) {
      res.status(400).json({ success: false, error: 'Vui lòng cung cấp datasetSlug và fileName!' });
      return;
    }

    const summary = await KaggleDatasetService.importSingleFile(
      datasetSlug,
      fileName,
      userId,
      { maxCandlesPerTimeframe: Number(maxCandles) || 50000 },
      username || process.env.KAGGLE_USERNAME,
      key || process.env.KAGGLE_KEY
    );

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/datasets/kaggle/download — Download full dataset ZIP from Kaggle via Native HTTP Stream and save to DB
datasetsRouter.post('/kaggle/download', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const username = req.body?.username || process.env.KAGGLE_USERNAME;
    const key = req.body?.key || process.env.KAGGLE_KEY;
    const datasetSlug = req.body?.datasetSlug || 'novandraanugrah/xauusd-gold-price-historical-data-2004-2024';
    const maxCandles = Number(req.body?.maxCandles) || 50000;
    const selectedTimeframes = req.body?.selectedTimeframes || [];

    const zipPath = await KaggleDatasetService.downloadDataset(username, key, datasetSlug);
    const summary = await KaggleDatasetService.importFromZipFile(zipPath, userId, {
      maxCandlesPerTimeframe: maxCandles,
      selectedTimeframes
    }, datasetSlug);

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

