import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

export const usersRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Middleware: Extract user from JWT
export async function authMiddleware(req: Request, _res: Response, next: Function) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      (req as any).userId = decoded.userId;
    }
  } catch { /* ignore invalid tokens */ }
  next();
}

// Helper: Get or create default dev user
async function getOrCreateDefaultUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'pro.trader@quantbacktest.com',
        name: 'Pro Trader',
        tier: 'PRO',
        settings: {
          create: {
            language: 'vi',
            llmProvider: 'gemini'
          }
        }
      }
    });
  }
  return user;
}

// POST /api/auth/register
usersRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email đã được sử dụng' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        tier: 'PRO',
        settings: {
          create: { language: 'vi', llmProvider: 'gemini' }
        }
      }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, tier: user.tier, createdAt: user.createdAt }, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
usersRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, tier: user.tier, avatarUrl: user.avatarUrl, createdAt: user.createdAt }, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/sso
usersRouter.post('/sso', async (req: Request, res: Response) => {
  try {
    const { provider, email, name, avatarUrl } = req.body;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatarUrl,
          ssoProvider: provider,
          tier: 'INSTITUTIONAL',
          settings: {
            create: { language: 'vi', llmProvider: 'gemini' }
          }
        }
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, tier: user.tier, avatarUrl: user.avatarUrl, ssoProvider: user.ssoProvider, createdAt: user.createdAt }, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/me
usersRouter.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      // In dev mode, return default user
      const user = await getOrCreateDefaultUser();
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
      res.json({ user: { id: user.id, email: user.email, name: user.name, tier: user.tier, avatarUrl: user.avatarUrl, createdAt: user.createdAt }, token });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id, email: user.email, name: user.name,
        tier: user.tier, avatarUrl: user.avatarUrl,
        ssoProvider: user.ssoProvider, createdAt: user.createdAt
      },
      settings: user.settings
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/settings
usersRouter.put('/settings', authMiddleware, async (req: Request, res: Response) => {
  try {
    let userId = (req as any).userId;
    if (!userId) {
      const user = await getOrCreateDefaultUser();
      userId = user.id;
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: req.body,
      create: { userId, ...req.body }
    });

    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
