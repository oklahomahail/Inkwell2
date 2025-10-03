// vite.config.ts
import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],

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
    sourcemap: false,
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
      },
    },
    chunkSizeWarningLimit: 800, // Higher limit for lazy-loaded chunks (TipTap: 345kB, Recharts: 472kB)
  },
});
