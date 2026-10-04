import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3111,
    host: true,
    cors: true,
    // Cho phép tất cả Host header từ Tunnel (Cloudflare trycloudflare.com & Localtunnel loca.lt)
    allowedHosts: true,
    hmr: {
      overlay: false
    },
    watch: {
      ignored: [
        '**/server/**',
        '**/scripts/**',
        '**/*.db*',
        '**/*.sqlite*',
        '**/*.log',
        '**/mt5_gateway/**',
        '**/*.exe',
        '**/*.png',
        '**/*.webp',
        '**/.system_generated/**'
      ]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.warn('[Vite Proxy] Backend on :3001 unreachable:', err.message);
            if (res && 'writeHead' in res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Backend API server on :3001 is offline. Run `npm run dev:all` or `npm run server` to start backend.'
              }));
            }
          });
        }
      }
    }
  },
  preview: {
    port: 3111,
    host: true
  },
  worker: {
    format: 'es'
  }
});
