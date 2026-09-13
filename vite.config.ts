import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Cross-origin isolation (COOP/COEP) is required for SharedArrayBuffer, which
// the multi-threaded Stockfish build needs. Mirrored in vercel.json for prod.
const crossOriginIsolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { headers: crossOriginIsolationHeaders },
  preview: { headers: crossOriginIsolationHeaders },
})
