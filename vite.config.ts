import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Serve kuromoji dict files from node_modules during dev.
 * vite-plugin-static-copy only works at build time, so in dev
 * requests to /dict/*.dat.gz would 404. This plugin intercepts
 * those requests and streams the file directly, without setting
 * Content-Encoding: gzip (which would cause the browser to
 * decompress, and then kuromoji's gunzipSync would fail on
 * already-decompressed data).
 */
function kuromojiDictPlugin(): Plugin {
  return {
    name: 'kuromoji-dict-dev',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/dict/')) return next();
        const filename = req.url.slice('/dict/'.length);
        const filePath = path.resolve('node_modules/@sglkc/kuromoji/dict', filename);
        if (!fs.existsSync(filePath)) return next();
        res.setHeader('Content-Type', 'application/octet-stream');
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

const isTauri = !!process.env.TAURI_ENV_PLATFORM;
const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    kuromojiDictPlugin(),
    viteStaticCopy({
      // Copy kuromoji dict files flat into dist/dict/. In v4 of
      // vite-plugin-static-copy, glob results preserve their full source
      // path under `dest` by default — without `stripBase: true` the files
      // would land at `dist/dict/node_modules/@sglkc/kuromoji/dict/*.dat.gz`
      // and the runtime fetch would 404.
      targets: [{
        src: 'node_modules/@sglkc/kuromoji/dict/*.dat.gz',
        dest: 'dict',
        rename: { stripBase: true },
      }],
    }),
    ...(!isTauri ? [VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Forgua',
        short_name: 'Forgua',
        description: 'Open source language learning engine built for serious learners of CJK and beyond',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        scope: base,
        start_url: base,
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\.(?:json)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pack-data',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    })] : []),
  ],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        this: 'globalThis',
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
});
