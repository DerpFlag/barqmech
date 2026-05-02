import {
  adminPasswordConfigured,
  adminPasswordOk,
  createAdminToken,
  setAdminCookieHeader,
} from './lib/admin-auth.mjs'

function bodyFromParsedJson(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown
    return v != null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

async function readJsonBody(req: any): Promise<Record<string, unknown>> {
  if (Buffer.isBuffer(req.body)) {
    const raw = req.body.toString('utf8')
    return raw ? bodyFromParsedJson(raw) : {}
  }
  if (req.body instanceof Uint8Array) {
    const raw = Buffer.from(req.body).toString('utf8')
    return raw ? bodyFromParsedJson(raw) : {}
  }
  if (typeof req.body === 'string' && req.body.length) {
    return bodyFromParsedJson(req.body)
  }
  if (req.body != null && typeof req.body === 'object' && !Array.isArray(req.body)) {
    return req.body as Record<string, unknown>
  }
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? bodyFromParsedJson(raw) : {}
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let body: Record<string, unknown>
  try {
    body = await readJsonBody(req)
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body.' })
  }

  const onVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
  if (onVercel && !adminPasswordConfigured()) {
    return res.status(503).json({
      error:
        'ADMIN_PASSWORD is not set for this Vercel environment. Open Project → Settings → Environment Variables and add it for Production (and Preview if you test preview URLs). Redeploy after saving.',
    })
  }

  const password = String(body.password ?? (body as { Password?: unknown }).Password ?? '')
  if (!password.trim()) {
    return res.status(400).json({
      error:
        'Missing password. The server did not receive a JSON body with a "password" field. Try another browser or disable extensions that block request bodies.',
    })
  }
  if (!adminPasswordOk(password)) {
    return res.status(401).json({
      error:
        'Invalid password. Tip: re-copy the value from Vercel with no extra spaces; env values are trimmed on the server.',
    })
  }

  const token = createAdminToken()
  res.setHeader('Set-Cookie', setAdminCookieHeader(token))
  return res.status(200).json({ ok: true })
}
