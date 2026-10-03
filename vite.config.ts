import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

function serveProcessedData() {
  return {
    name: 'serve-processed-data',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        // Proxy SportPesa active jackpot API with mobile okhttp User-Agent to bypass Akamai bot challenge
        if (req.url && (req.url === '/api/sportpesa/active' || req.url.startsWith('/api/sportpesa/active'))) {
          try {
            const upstreamRes = await fetch('https://jackpot-offer-api.ke.sportpesa.com/api/jackpots/active', {
              headers: {
                'User-Agent': 'okhttp/4.9.0',
                'Accept': 'application/json, text/plain, */*',
              },
            })
            const data = await upstreamRes.text()
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.statusCode = upstreamRes.status
            res.end(data)
            return
          } catch (err: any) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
            return
          }
        }

        // Proxy Mozzart predefined tickets API — returns JSON with okhttp UA directly
        if (req.url && (req.url === '/api/mozzart/super-jackpot' || req.url.startsWith('/api/mozzart/super-jackpot'))) {
          try {
            const upstreamRes = await fetch('https://www.mozzartbet.co.ke/predefined-tickets', {
              headers: {
                'User-Agent': 'okhttp/4.9.0',
                'Accept': 'application/json, text/plain, */*',
              },
            })
            const data = await upstreamRes.text()
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.statusCode = upstreamRes.status
            res.end(data)
            return
          } catch (err: any) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
            return
          }
        }

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
