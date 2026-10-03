import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

function serveProcessedData() {
  return {
    name: 'serve-processed-data',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/data/')) {
          const relativePath = req.url.replace(/^\/data\//, '').split('?')[0]
          const targetFile = path.resolve(import.meta.dirname, 'data/processed', relativePath)

          if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
            res.setHeader('Content-Type', 'application/json')
            fs.createReadStream(targetFile).pipe(res)
            return
          }
        }
        next()
      })
    },
    closeBundle() {
      // In production build, copy data/processed to dist/data
      const sourceDir = path.resolve(import.meta.dirname, 'data/processed')
      const targetDir = path.resolve(import.meta.dirname, 'dist/data')
      if (fs.existsSync(sourceDir)) {
        fs.cpSync(sourceDir, targetDir, { recursive: true })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    serveProcessedData(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
})
