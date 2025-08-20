import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(() => ({
  plugins: [react()],

  css: { postcss: './postcss.config.js' },

  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
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
    // Optional: chunking to reduce bundle size warnings
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          tiptap: ['@tiptap/core', '@tiptap/react', '@tiptap/starter-kit'],
          charts: ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },

  define: {
    // Keep for libs expecting `global`
    global: 'globalThis',
    // Safe, explicit define for app version
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    // If you need a specific env var in the client, expose it explicitly:
    // __API_BASE__: JSON.stringify(import.meta.env.VITE_API_BASE),
  },

  optimizeDeps: { include: ['react', 'react-dom'] },
}));
