// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
    dedupe: ['react', 'react-dom'],
  },

  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['recharts'], // don't prebundle recharts
  },

  // Optional: you can put your other fields back later, but avoid manualChunks until we're stable.
  build: {
    sourcemap: false,
  },
});
