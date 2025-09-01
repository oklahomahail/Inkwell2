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
  },
});
