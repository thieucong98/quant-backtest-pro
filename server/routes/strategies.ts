import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, getOrCreateDefaultUser } from './users.js';

export const strategiesRouter = Router();
strategiesRouter.use(authMiddleware);

function safeParseJson(str: string | null | undefined, fallback: any = {}): any {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// Helper: get userId from authenticated request
async function getUserId(req: Request): Promise<string> {
  let userId = (req as any).userId;
  if (!userId && process.env.NODE_ENV !== 'production') {
    try {
      const defaultUser = await getOrCreateDefaultUser();
      if (defaultUser) {
        userId = defaultUser.id;
        (req as any).userId = userId;
      }
    } catch {}
  }
  if (!userId) {
    const err: any = new Error('Unauthorized: Thiếu định danh người dùng hợp lệ');
    err.status = 401;
    throw err;
  }
  return userId;
}

// GET /api/strategies — List all strategies
strategiesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    const strategies = await prisma.strategy.findMany({
      where: {
        OR: [
          { userId },
          { isBuiltIn: true }
        ]
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(strategies.map(s => ({
      ...s,
      parameters: safeParseJson(s.parameters, {})
    })));
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Lỗi tải danh sách chiến lược' });
  }
});

// GET /api/strategies/:id
strategiesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = await getUserId(req);
    const strategy = await prisma.strategy.findFirst({
      where: { id, userId }
    });

    if (!strategy) {
      res.status(404).json({ error: 'Strategy not found or access denied' });
      return;
    }

    res.json({ ...strategy, parameters: safeParseJson(strategy.parameters, {}) });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Lỗi xử lý chiến lược' });
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
        parameters: typeof parameters === 'string' ? parameters : JSON.stringify(parameters || {}),
        enabled: enabled !== false
      }
    });

    res.status(201).json({ ...strategy, parameters: safeParseJson(strategy.parameters, {}) });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Lỗi tạo chiến lược mới' });
  }
});

// PUT /api/strategies/:id
strategiesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = await getUserId(req);
    const existing = await prisma.strategy.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Strategy not found or access denied' });
      return;
    }

    const data: any = { ...req.body };
    if (data.parameters && typeof data.parameters === 'object') {
      data.parameters = JSON.stringify(data.parameters);
    }

    const strategy = await prisma.strategy.update({
      where: { id },
      data
    });

    res.json({ ...strategy, parameters: safeParseJson(strategy.parameters, {}) });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Lỗi cập nhật chiến lược' });
  }
});

// DELETE /api/strategies/:id
strategiesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = await getUserId(req);
    const existing = await prisma.strategy.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Strategy not found or access denied' });
      return;
    }

    await prisma.strategy.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
