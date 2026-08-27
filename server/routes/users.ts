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
export async function getOrCreateDefaultUser() {
  const DEFAULT_EMAIL = 'admin@quantbacktest.pro';
  let user = await prisma.user.findUnique({ where: { email: DEFAULT_EMAIL } });
  if (!user) {
    const passwordHash = await bcrypt.hash('QuantPro@2026', 10);
    user = await prisma.user.create({
      data: {
        email: DEFAULT_EMAIL,
        name: 'Quant Pro Trader',
        passwordHash,
        tier: 'INSTITUTIONAL',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        settings: {
          create: {
            language: 'vi',
            llmProvider: 'gemini'
          }
        }
      }
    });
    console.log(`[AUTH] Seeded default institutional account: ${DEFAULT_EMAIL} / QuantPro@2026`);
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
    if (!email || !provider) {
      res.status(400).json({ error: 'Thiếu thông tin xác thực SSO' });
      return;
    }

    const validProviders = ['google', 'github', 'apple'];
    if (!validProviders.includes(provider.toLowerCase())) {
      res.status(400).json({ error: 'Nhà cung cấp SSO không hợp lệ' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Security Guard: If account was created with password, prevent takeover via unverified SSO
      if (user.passwordHash && !user.ssoProvider) {
        res.status(403).json({
          error: 'Tài khoản này đã được tạo bằng mật khẩu. Vui lòng sử dụng phương thức đăng nhập bằng Email/Password.'
        });
        return;
      }
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: name || 'Trader',
          avatarUrl,
          ssoProvider: provider,
          tier: 'PRO',
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
      res.status(401).json({ error: 'Chưa đăng nhập. Vui lòng cung cấp token hợp lệ.' });
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
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: 'Chưa đăng nhập. Vui lòng cung cấp token hợp lệ.' });
      return;
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
