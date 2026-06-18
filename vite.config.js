import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: 'localhost'
  }
  ,
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pdfmake')) return 'pdfmake';
          if (id.includes('node_modules/xlsx')) return 'xlsx';
          if (id.includes('node_modules/canvg')) return 'canvg';
        }
      }
    }
  }
})
