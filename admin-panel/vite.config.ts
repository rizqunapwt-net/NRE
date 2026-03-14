import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  build: {
    manifest: true,
    outDir: '../public/build',
    emptyOutDir: true,
    chunkSizeWarningLimit: 950,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('/antd/')) return 'antd-core';
          if (id.includes('@ant-design/icons')) return 'antd-icons';
          if (id.includes('/rc-')) return 'antd-rc';

          if (id.includes('/@tanstack/')) return 'tanstack-query';
          if (id.includes('/recharts/')) return 'charts';
          if (id.includes('/framer-motion/')) return 'motion';
          if (id.includes('pdfjs-dist')) return 'pdfjs';

          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 4000,
    host: '0.0.0.0',
    watch: {
        usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
      '/sanctum': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
    },
  },
})
