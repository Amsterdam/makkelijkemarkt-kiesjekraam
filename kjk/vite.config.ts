import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/kjk',
  build: {
    outDir: 'build',
    assetsDir: 'static',
    rollupOptions: {
      output: {
        entryFileNames: 'static/js/[name]-[hash].js',
        chunkFileNames: 'static/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'static/css/[name]-[hash][extname]'
          }
          return 'static/[name]-[hash][extname]'
        }
      }
    }
  },
  server: {
    port: 3000
  }
})
