import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  css: {
    postcss: './postcss.config.js',
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  server: {
    port: 3000,
    open: true,
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/public/**'],
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
  },

  // Fix for 'process' is not defined errors
  define: {
    'process.env': 'process.env',
    global: 'globalThis',
  },

  // Ensure Node.js types are available
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
