import { fileURLToPath, URL } from 'node:url';

import { sentryVitePlugin } from '@sentry/vite-plugin';
/// <reference types="vite/client" />

// vite.config.ts

import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

/* In vite.config.ts, we use process.env (Node.js) since import.meta.env is not available during build config */
// Only warn if we're in development mode - in production/CI, env vars are injected at build time
const isDev = process.env.NODE_ENV === 'development';
const hasSupabaseUrl = Boolean(process.env.VITE_SUPABASE_URL);
const hasSupabaseKey = Boolean(process.env.VITE_SUPABASE_ANON_KEY);

if (isDev && (!hasSupabaseUrl || !hasSupabaseKey)) {
  console.warn(
    'Warning: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Authentication will fail at runtime.',
  );
}

export default defineConfig({
  // Ensure we're serving from root, not relative path
  base: '/',

  // Build configuration
  build: {
    sourcemap: true, // Enable source maps for better debugging in production
    chunkSizeWarningLimit: 2000, // Completely suppress chunk warnings (largest chunk ~472kB)
    target: 'es2020', // Ensure consistent target
    minify: 'terser',
    terserOptions: {
      compress: {
        // Drop console.log, console.debug, console.trace in production
        drop_console: ['log', 'debug', 'trace'],
        // Keep console.warn and console.error
        pure_funcs: [],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['lucide-react', 'clsx'],
          // Heavy dependencies get their own chunks
          'vendor-tiptap': [
            '@tiptap/core',
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-character-count',
            '@tiptap/extension-history',
            '@tiptap/extension-placeholder',
            // Typography extension moved to avoid line 43
            '@tiptap/extension-typography',
          ],
          'vendor-charts': ['recharts'],
          'vendor-crypto': ['crypto-js'],
          'vendor-utils': ['date-fns', 'zod'],
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
  },
  plugins: [
    react(),
    tsconfigPaths(),
    ...(process.env.VITE_ENABLE_PWA === 'false'
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            manifestFilename: 'site.webmanifest', // Output to site.webmanifest, not manifest.webmanifest
            // Force immediate updates and bypass HTTP cache
            injectRegister: 'inline',
            workbox: {
              globDirectory: 'dist',
              // Force cache bypass for service worker updates
              cleanupOutdatedCaches: true,
              globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
              globIgnores: [
                '**/node_modules/**/*',
                'sw.js',
                'workbox-*.js',
                'site.webmanifest',
                '*.webmanifest',
              ],
              navigateFallback: '/index.html',
              // Force immediate activation of new service workers
              skipWaiting: true,
              clientsClaim: true,
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
              // NOTE: site.webmanifest is explicitly added here with matching path to VitePWA's output
              additionalManifestEntries: [
                { url: '/', revision: `v2025-11-15-migration-${Date.now().toString()}` },
              ],
            },
            includeAssets: [
              'favicon.svg',
              'favicon.ico',
              'brand/inkwell-icon-192.png',
              'brand/inkwell-icon-512.png',
              'brand/1.svg',
              'brand/2.svg',
              'brand/3.svg',
              'brand/*.png',
              'brand/*.svg',
            ],
            manifest: {
              name: 'Inkwell - Professional Writing Studio',
              short_name: 'Inkwell',
              description:
                'A sophisticated writing environment for authors, novelists, and creative writers',
              theme_color: '#13294B', // Inkwell Blue (updated to match brand)
              background_color: '#ffffff',
              display: 'standalone',
              orientation: 'portrait-primary',
              scope: '/',
              start_url: '/',
              icons: [
                {
                  src: 'favicon.svg',
                  sizes: 'any',
                  type: 'image/svg+xml',
                  purpose: 'any',
                },
                {
                  src: 'brand/inkwell-icon-192.png',
                  sizes: '192x192',
                  type: 'image/png',
                  purpose: 'any',
                },
                {
                  src: 'brand/inkwell-icon-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any',
                },
                {
                  src: 'brand/inkwell-icon-192.png',
                  sizes: '192x192',
                  type: 'image/png',
                  purpose: 'maskable',
                },
                {
                  src: 'brand/inkwell-icon-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
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
    sentryVitePlugin({
      org: 'nexus-partners',
      project: 'inkwell',
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@brand/icon': '/brand/1.svg',
      '@brand/logo-dark': '/brand/3.svg',
      '@brand/logo-light': '/brand/2.svg',
    },
    dedupe: ['react', 'react-dom'],
  },

  // Vite handles workers out of the box; this keeps them ESM.
  worker: {
    format: 'es',
  },

  optimizeDeps: {
    include: ['lucide-react'],
  },

  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
  },
});
