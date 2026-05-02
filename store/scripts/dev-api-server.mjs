/**
 * Local substitute for `vercel dev`: serves POST /api/place-order on port 3000.
 * Run from `store`: node --env-file=.env.local scripts/dev-api-server.mjs
 * Then `npm run dev` (Vite proxies /api → 3000).
 */
import http from 'node:http'
import { URL } from 'node:url'

const port = Number(process.env.DEV_API_PORT || 3000)
const handler = (await import('../../api/place-order.mjs')).default

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || `127.0.0.1:${port}`
  let pathname
  try {
    pathname = new URL(req.url || '/', `http://${host}`).pathname
  } catch {
    res.statusCode = 400
    return res.end()
  }

  if (pathname === '/api/place-order') {
    return handler(req, res)
  }

  res.statusCode = 404
  res.setHeader('Content-Type', 'text/plain')
  res.end('Not found — use Vite for the storefront; this server only handles /api/place-order')
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Dev API http://127.0.0.1:${port}/api/place-order`)
})
