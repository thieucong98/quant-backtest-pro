import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware } from './users.js';

export const strategiesRouter = Router();
strategiesRouter.use(authMiddleware);

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

// GET /api/strategies — List all strategies
strategiesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const strategies = await prisma.strategy.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(strategies.map(s => ({
      ...s,
      parameters: JSON.parse(s.parameters || '{}')
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/strategies/:id
strategiesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const strategy = await prisma.strategy.findUnique({
      where: { id }
    });

    if (!strategy) {
      res.status(404).json({ error: 'Strategy not found' });
      return;
    }

    res.json({ ...strategy, parameters: JSON.parse(strategy.parameters || '{}') });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/strategies — Create new strategy
strategiesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const { name, description, code, parameters, enabled } = req.body;

    const strategy = await prisma.strategy.create({
      data: {
        userId,
        name,
        description: description || '',
        code,
        parameters: JSON.stringify(parameters || {}),
        enabled: enabled !== false
      }
    });

    res.status(201).json({ ...strategy, parameters: JSON.parse(strategy.parameters) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/strategies/:id
strategiesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const data: any = { ...req.body };
    if (data.parameters && typeof data.parameters === 'object') {
      data.parameters = JSON.stringify(data.parameters);
    }

    const strategy = await prisma.strategy.update({
      where: { id },
      data
    });

    res.json({ ...strategy, parameters: JSON.parse(strategy.parameters) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/strategies/:id
strategiesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.strategy.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
