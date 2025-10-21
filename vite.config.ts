// vite.config.ts
import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    'Warning: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Authentication will fail at runtime.',
  );
}

export default defineConfig({
  build: {
    sourcemap: true, // Enable source maps for better debugging in production
  },
  plugins: [
    react(),
    ...(process.env.VITE_ENABLE_PWA === 'false'
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            workbox: {
              globDirectory: 'dist',
              globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
              globIgnores: ['**/node_modules/**/*', 'sw.js', 'workbox-*.js'],
              navigateFallback: '/index.html',
              runtimeCaching: [
                // Cache the editor shell and core assets
                {
                  urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'google-fonts-cache',
                    expiration: {
                      maxEntries: 10,
                      maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
                    },
                  },
                },
                {
                  urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'gstatic-fonts-cache',
                    expiration: {
                      maxEntries: 10,
                      maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
                    },
                  },
                },
                // Cache API responses with network-first strategy
                {
                  urlPattern: /\/api\/.*/i,
                  handler: 'NetworkFirst',
                  options: {
                    cacheName: 'api-cache',
                    expiration: {
                      maxEntries: 100,
                      maxAgeSeconds: 60 * 60 * 24, // 24 hours
                    },
                    networkTimeoutSeconds: 3,
                  },
                },
                // Cache images
                {
                  urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'images-cache',
                    expiration: {
                      maxEntries: 100,
                      maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                    },
                  },
                },
              ],
              // Ensure core application assets are precached
              additionalManifestEntries: [{ url: '/', revision: Date.now().toString() }],
            },
            includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
            manifest: {
              name: 'Inkwell - Professional Writing Studio',
              short_name: 'Inkwell',
              description:
                'A sophisticated writing environment for authors, novelists, and creative writers',
              theme_color: '#0A2F4E', // Navy blue
              background_color: '#ffffff',
              display: 'standalone',
              orientation: 'portrait-primary',
              scope: '/',
              start_url: '/',
              icons: [
                {
                  src: 'icon-192.png',
                  sizes: '192x192',
                  type: 'image/png',
                  purpose: 'maskable any',
                },
                {
                  src: 'icon-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable any',
                },
              ],
              shortcuts: [
                {
                  name: 'New Project',
                  short_name: 'New',
                  description: 'Create a new writing project',
                  url: '/?action=new-project',
                  icons: [{ src: 'icons/shortcut-new.png', sizes: '192x192' }],
                },
                {
                  name: 'Recent Projects',
                  short_name: 'Recent',
                  description: 'Open recent writing projects',
                  url: '/?view=dashboard',
                  icons: [{ src: 'icons/shortcut-recent.png', sizes: '192x192' }],
                },
                {
                  name: 'Quick Write',
                  short_name: 'Write',
                  description: 'Start writing immediately',
                  url: '/?view=writing',
                  icons: [{ src: 'icons/shortcut-write.png', sizes: '192x192' }],
                },
              ],
              categories: ['productivity', 'business', 'lifestyle'],
              prefer_related_applications: false,
            },
            devOptions: {
              enabled: true, // Enable PWA in development
            },
          }),
        ]),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },

  // Vite handles workers out of the box; this keeps them ESM.
  worker: {
    format: 'es',
  },

  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['recharts'], // don't prebundle recharts
  },

  build: {
    sourcemap: true,
    target: 'es2020', // Ensure consistent target
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge'],
          // Heavy dependencies get their own chunks
          'vendor-tiptap': [
            '@tiptap/core',
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-character-count',
            '@tiptap/extension-history',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-typography',
          ],
          'vendor-charts': ['recharts'],
          'vendor-crypto': ['crypto-js'],
          'vendor-utils': ['date-fns', 'lodash', 'zod'],
          'vendor-export': ['file-saver', 'jszip'],
        },
        // Ensure deterministic chunk naming
        chunkFileNames: (chunkInfo) => {
          const rawModuleId = chunkInfo.facadeModuleId;
          const facadeModuleId = rawModuleId
            ? rawModuleId
                .split('/')
                .pop()
                ?.replace(/\.[jt]sx?$/, '') || 'chunk'
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
      },
    },
    chunkSizeWarningLimit: 2000, // Completely suppress chunk warnings (largest chunk ~472kB)
  },
});
