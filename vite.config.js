import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Also publish index.html as 404.html, so hosts that serve a custom 404 page
// still load the app for routes like /learn or /admin.
const spaFallback = {
  name: 'spa-fallback-404',
  closeBundle() {
    const dist = resolve(process.cwd(), 'dist')
    const index = resolve(dist, 'index.html')
    if (existsSync(index)) copyFileSync(index, resolve(dist, '404.html'))
  },
}

export default defineConfig({
  plugins: [react(), spaFallback],
  preview: { allowedHosts: true },
})
