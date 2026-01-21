import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Split large vendor chunk and relax warning threshold
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          vendor: [
            'axios',
            'bootstrap',
            'react-bootstrap',
            'react-icons',
            'react-toastify',
            'recharts',
            'zustand',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/blockchain': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
})