import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    // Development only: forward any request starting with /api to the LocalConnect backend,
    // so the browser sees a single address (http://localhost:5173). Start the backend first.
    // 127.0.0.1 (not "localhost") avoids an IPv4/IPv6 mismatch with the backend's default HOST.
    proxy: { '/api': 'http://127.0.0.1:4000' },
  },
})
