import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
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
        changeOrigin: true
      }
    }
  },
  worker: {
    format: 'es'
  }
});
