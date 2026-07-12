import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

<<<<<<< HEAD
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
=======
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // Proxy /api calls to the backend container (service name in docker network)
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
>>>>>>> origin/main
})
