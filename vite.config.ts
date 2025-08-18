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

  // FIXED: Remove quotes around process.env
  define: {
    'process.env': process.env, // ← Changed from 'process.env' to process.env
    global: 'globalThis',
  },

  // Ensure Node.js types are available
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
