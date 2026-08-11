import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // <--- This makes it accessible on LAN/WAN
    port: 3000,        // Or your desired port
    strictPort: true, // Prevents Vite from crashing if port 5173 is used
  }
})
