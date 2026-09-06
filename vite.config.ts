import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    // Local dev: forward relative /api calls to the Express backend.
    // The app uses VITE_API_URL when set, else http://localhost:5000/api.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/webhooks': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
