import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom'))
            return 'react-vendor';
          if (id.includes('node_modules/@tiptap/')) return 'tiptap';
          if (id.includes('node_modules/recharts')) return 'charts';
          return;
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },

  define: {
    global: 'globalThis',
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },

  optimizeDeps: { include: ['react', 'react-dom'] },
});
