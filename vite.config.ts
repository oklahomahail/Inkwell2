import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js', // Ensure Tailwind works with PostCSS
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Supports "@/..." imports
    },
  },
  server: {
    port: 3000,
    open: true, // Auto-open browser
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/public/**',
      ],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Enable for debugging if needed
  },
});
