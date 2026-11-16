import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { watch: { ignored: ['**/.browser-check/**'] } },
  build: {
    rolldownOptions: {
      input: { main: 'index.html', 'ba-data-preview': 'ba-data-preview.html' },
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/, includeDependenciesRecursively: true },
            { name: 'firebase', test: /node_modules[\\/](?:@firebase|firebase)[\\/]/, includeDependenciesRecursively: true },
          ],
        },
      },
    },
  },
})
