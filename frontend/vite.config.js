import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000', // or your backend port
      '/property': 'http://localhost:5000/api', // proxy property requests
      '/auth': 'http://localhost:5000/api', // proxy auth requests
      '/chat': 'http://localhost:5000/api', // proxy chat requests
      '/user': 'http://localhost:5000/api', // proxy user requests
      '/contract': 'http://localhost:5000/api', // proxy contract requests
      '/uploads': 'http://localhost:5000', // proxy uploads for images
      '/socket.io': {
        target: 'ws://localhost:5000',
        ws: true
      },
    }
  },
})
