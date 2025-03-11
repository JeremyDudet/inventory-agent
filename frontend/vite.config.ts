import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000, // Match the default CRA port
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Backend runs on port 8080
        changeOrigin: true,
        secure: false
      }
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
}) 