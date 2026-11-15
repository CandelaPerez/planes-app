import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import placesHandler from './api/places.js'

const localApi = {
  name: 'por-hacer-local-api',
  configureServer(server) {
    server.middlewares.use('/api/places', (request, response) => placesHandler(request, response))
  },
  configurePreviewServer(server) {
    server.middlewares.use('/api/places', (request, response) => placesHandler(request, response))
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApi],
  server: { watch: { ignored: ['**/.browser-check/**'] } },
})
