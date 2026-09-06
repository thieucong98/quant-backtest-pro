import { Router, Request, Response } from 'express';
import localtunnel from 'localtunnel';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';

export const tunnelRouter = Router();

interface TunnelState {
  active: boolean;
  publicUrl: string | null;
  provider: 'CLOUDFLARE' | 'LOCALTUNNEL' | null;
  port: number;
  startedAt: number | null;
  pin: string | null;
  error: string | null;
  logs: string[];
}

let tunnelState: TunnelState = {
  active: false,
  publicUrl: null,
  provider: null,
  port: 5174,
  startedAt: null,
  pin: null,
  error: null,
  logs: []
};

let activeLocaltunnel: any = null;
let activeCloudflaredProcess: ChildProcess | null = null;

/**
 * Helper to check which local port (5173 or 5174) is active
 */
async function detectActiveFrontendPort(): Promise<number> {
  const portsToTest = [5174, 5173, 4173];
  for (const port of portsToTest) {
    const isLive = await new Promise<boolean>((resolve) => {
      const req = http.get(`http://localhost:${port}/`, (res) => {
        resolve(res.statusCode !== undefined && res.statusCode < 500);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(800, () => {
        req.destroy();
        resolve(false);
      });
    });
    if (isLive) return port;
  }
  return 5174;
}

/**
 * Start Cloudflare Tunnel via cloudflared npm / binary
 */
async function startCloudflareTunnel(port: number): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Cloudflare Tunnel initialization timed out (15s)'));
      }
    }, 15000);

    try {
      // Import cloudflared bin path or run command
      let cloudflaredBin = 'cloudflared';
      try {
        const cfModule = await import('cloudflared');
        cloudflaredBin = cfModule.bin || 'cloudflared';
      } catch {}

      const child = spawn(cloudflaredBin, ['tunnel', '--url', `http://localhost:${port}`], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
      });

      activeCloudflaredProcess = child;

      const onOutput = (data: Buffer) => {
        const text = data.toString();
        tunnelState.logs.push(text.trim());
        if (tunnelState.logs.length > 50) tunnelState.logs.shift();

        // Extract trycloudflare.com URL
        const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match && !settled) {
          settled = true;
          clearTimeout(timeout);
          resolve(match[0]);
        }
      };

      child.stdout?.on('data', onOutput);
      child.stderr?.on('data', onOutput);

      child.on('error', (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(err);
        }
      });

      child.on('close', (code) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(new Error(`Cloudflared exited prematurely with code ${code}`));
        } else {
          // Process terminated while running
          tunnelState.active = false;
          tunnelState.publicUrl = null;
          tunnelState.provider = null;
          tunnelState.startedAt = null;
        }
      });
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(err);
      }
    }
  });
}

/**
 * Start Localtunnel (Pure Node.js Fallback)
 */
async function startLocaltunnel(port: number, subdomain?: string): Promise<string> {
  const tunnel = await localtunnel({
    port,
    subdomain: subdomain || `quant-pro-${Math.random().toString(36).substring(2, 7)}`
  });

  activeLocaltunnel = tunnel;

  tunnel.on('close', () => {
    tunnelState.active = false;
    tunnelState.publicUrl = null;
    tunnelState.provider = null;
    tunnelState.startedAt = null;
  });

  tunnel.on('error', (err: any) => {
    tunnelState.error = err.message || 'Localtunnel error';
  });

  return tunnel.url;
}

/**
 * Middleware: Verify PIN for requests coming through remote tunnel
 */
export function verifyTunnelPin(req: Request, res: Response, next: Function) {
  if (tunnelState.active && tunnelState.pin) {
    const forwardedHost = req.headers['x-forwarded-host'] || req.headers['host'] || '';
    const isRemote = typeof forwardedHost === 'string' && (
      forwardedHost.includes('trycloudflare.com') ||
      forwardedHost.includes('localtunnel.me')
    );

    if (isRemote) {
      const clientPin = req.headers['x-tunnel-pin'] || req.query.pin;
      if (!clientPin || String(clientPin).trim() !== tunnelState.pin) {
        res.status(403).json({
          error: 'Yêu cầu mã PIN bảo vệ Tunnel. Vui lòng cung cấp header X-Tunnel-Pin hợp lệ.',
          requiresPin: true
        });
        return;
      }
    }
  }
  next();
}

/**
 * GET /api/tunnel/status
 */
tunnelRouter.get('/status', async (_req: Request, res: Response) => {
  const uptimeSeconds = tunnelState.startedAt ? Math.floor((Date.now() - tunnelState.startedAt) / 1000) : 0;
  // Security: Never leak pin in plaintext status
  const { pin: _pin, ...safeState } = tunnelState;
  return res.json({
    ...safeState,
    hasPin: Boolean(tunnelState.pin),
    uptime: uptimeSeconds
  });
});

/**
 * POST /api/tunnel/verify-pin
 */
tunnelRouter.post('/verify-pin', (req: Request, res: Response) => {
  const { pin } = req.body;
  if (!tunnelState.pin) {
    return res.json({ success: true, verified: true, message: 'No PIN configured' });
  }
  const isMatch = String(pin || '').trim() === tunnelState.pin;
  if (isMatch) {
    return res.json({ success: true, verified: true });
  }
  return res.status(401).json({ success: false, verified: false, error: 'Mã PIN không chính xác' });
});

/**
 * POST /api/tunnel/start
 */
tunnelRouter.post('/start', async (req: Request, res: Response) => {
  if (tunnelState.active && tunnelState.publicUrl) {
    return res.json({
      success: true,
      message: 'Tunnel is already active',
      state: tunnelState
    });
  }

  const requestedProvider = (req.body?.provider || 'CLOUDFLARE').toUpperCase();
  const requestedPort = Number(req.body?.port) || (await detectActiveFrontendPort());
  const requestedPin = req.body?.pin || tunnelState.pin;

  tunnelState.port = requestedPort;
  tunnelState.error = null;

  let publicUrl: string | null = null;
  let usedProvider: 'CLOUDFLARE' | 'LOCALTUNNEL' = 'CLOUDFLARE';

  try {
    if (requestedProvider === 'CLOUDFLARE') {
      try {
        publicUrl = await startCloudflareTunnel(requestedPort);
        usedProvider = 'CLOUDFLARE';
      } catch (cfErr: any) {
        console.warn('[TUNNEL] Cloudflare tunnel failed, attempting Localtunnel fallback...', cfErr.message);
        publicUrl = await startLocaltunnel(requestedPort);
        usedProvider = 'LOCALTUNNEL';
      }
    } else {
      publicUrl = await startLocaltunnel(requestedPort);
      usedProvider = 'LOCALTUNNEL';
    }

    tunnelState.active = true;
    tunnelState.publicUrl = publicUrl;
    tunnelState.provider = usedProvider;
    tunnelState.startedAt = Date.now();
    tunnelState.pin = requestedPin || null;

    console.log(`🚀 [TUNNEL ACTIVE] Remote URL: ${publicUrl} (${usedProvider}) -> http://localhost:${requestedPort}`);

    return res.json({
      success: true,
      publicUrl,
      provider: usedProvider,
      port: requestedPort,
      message: `Tunnel started successfully via ${usedProvider}`
    });
  } catch (error: any) {
    tunnelState.active = false;
    tunnelState.publicUrl = null;
    tunnelState.error = error.message || 'Failed to start tunnel';
    return res.status(500).json({
      success: false,
      error: tunnelState.error
    });
  }
});

/**
 * POST /api/tunnel/stop
 */
tunnelRouter.post('/stop', async (_req: Request, res: Response) => {
  try {
    if (activeLocaltunnel) {
      activeLocaltunnel.close();
      activeLocaltunnel = null;
    }
    if (activeCloudflaredProcess) {
      activeCloudflaredProcess.kill();
      activeCloudflaredProcess = null;
    }

    tunnelState.active = false;
    tunnelState.publicUrl = null;
    tunnelState.provider = null;
    tunnelState.startedAt = null;
    tunnelState.error = null;

    console.log('🛑 [TUNNEL STOPPED] Remote tunnel has been closed.');

    return res.json({ success: true, message: 'Tunnel stopped successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tunnel/set-pin
 */
tunnelRouter.post('/set-pin', (req: Request, res: Response) => {
  const { pin } = req.body;
  tunnelState.pin = pin ? String(pin).trim() : null;
  return res.json({ success: true, pin: tunnelState.pin });
});
