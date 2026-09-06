import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware } from './users.js';

export const drawingsRouter = Router();
drawingsRouter.use(authMiddleware);

// Helper: Verify session ownership
async function verifySessionOwnership(sessionId: string, userId: string): Promise<boolean> {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId }
  });
  return !!session;
}

// POST /api/drawings/sync — Bulk sync drawings for a session
drawingsRouter.post('/sync', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { sessionId, drawings } = req.body;
    if (!sessionId || !Array.isArray(drawings)) {
      res.status(400).json({ error: 'sessionId and drawings array required' });
      return;
    }

    const isOwner = await verifySessionOwnership(sessionId, userId);
    if (!isOwner) {
      res.status(404).json({ error: 'Session not found or access denied' });
      return;
    }

    // Delete all existing drawings for this session and re-create
    await prisma.drawing.deleteMany({ where: { sessionId } });

    if (drawings.length > 0) {
      await prisma.drawing.createMany({
        data: drawings.map((d: any) => ({
          id: d.id,
          sessionId,
          type: d.type,
          points: JSON.stringify(d.points || []),
          color: d.color || '#2196F3',
          lineWidth: d.lineWidth || 1,
          text: d.text || null
        }))
      });
    }

    res.json({ success: true, count: drawings.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drawings/session/:sessionId — Get drawings for a session
drawingsRouter.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { sessionId } = req.params as { sessionId: string };

    const isOwner = await verifySessionOwnership(sessionId, userId);
    if (!isOwner) {
      res.status(404).json({ error: 'Session not found or access denied' });
      return;
    }

    const drawings = await prisma.drawing.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });

    res.json(drawings.map(d => ({
      ...d,
      points: JSON.parse(d.points || '[]')
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/drawings/equity/sync — Bulk sync equity points for a session
drawingsRouter.post('/equity/sync', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { sessionId, equityPoints } = req.body;
    if (!sessionId || !Array.isArray(equityPoints)) {
      res.status(400).json({ error: 'sessionId and equityPoints array required' });
      return;
    }

    const isOwner = await verifySessionOwnership(sessionId, userId);
    if (!isOwner) {
      res.status(404).json({ error: 'Session not found or access denied' });
      return;
    }

    // Delete existing and re-create
    await prisma.equityPoint.deleteMany({ where: { sessionId } });

    if (equityPoints.length > 0) {
      // Only save every Nth point to avoid massive data (keep last 500 points)
      const sampled = equityPoints.length > 500
        ? equityPoints.filter((_: any, i: number) => i % Math.ceil(equityPoints.length / 500) === 0 || i === equityPoints.length - 1)
        : equityPoints;

      await prisma.equityPoint.createMany({
        data: sampled.map((ep: any) => ({
          sessionId,
          timestamp: BigInt(ep.timestamp),
          balance: ep.balance,
          equity: ep.equity
        }))
      });
    }

    res.json({ success: true, count: equityPoints.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
