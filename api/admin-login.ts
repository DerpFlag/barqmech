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
    const o = req.body as Record<string, unknown>
    const ctor = (o as { constructor?: { name?: string } }).constructor?.name
    if (ctor === 'Readable' || ctor === 'Gunzip' || ctor === 'Inflate') {
      /* fall through to stream read */
    } else if (Object.keys(o).length > 0 || 'password' in o || 'Password' in o) {
      return o
    }
    /* Empty plain object: runtime may have left stream unread — try below. */
  }
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? bodyFromParsedJson(raw) : {}
}

function json(res: any, status: number, payload: Record<string, unknown>) {
  if (res.writableEnded) return
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return json(res, 405, { error: 'Method not allowed' })
    }

    let body: Record<string, unknown>
    try {
      body = await readJsonBody(req)
    } catch {
      return json(res, 400, { error: 'Invalid JSON body.' })
    }

    const onVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
    if (onVercel && !adminPasswordConfigured()) {
      return json(res, 503, {
        error:
          'ADMIN_PASSWORD is not set for this Vercel environment. Open Project → Settings → Environment Variables and add it for Production (and Preview if you test preview URLs). Redeploy after saving.',
      })
    }

    const password = String(body.password ?? (body as { Password?: unknown }).Password ?? '')
    if (!password.trim()) {
      return json(res, 400, {
        error:
          'Missing password. The server did not receive a JSON body with a "password" field. Try another browser or disable extensions that block request bodies.',
      })
    }
    if (!adminPasswordOk(password)) {
      return json(res, 401, {
        error:
          'Invalid password. Tip: re-copy the value from Vercel with no extra spaces; env values are trimmed on the server.',
      })
    }

    const token = createAdminToken()
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Set-Cookie', setAdminCookieHeader(token))
    res.end(JSON.stringify({ ok: true }))
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    json(res, 500, { error: `Login handler error: ${msg}` })
  }
}
