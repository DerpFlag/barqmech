import getRawBody from 'raw-body'
import {
  adminPasswordConfigured,
  adminPasswordOk,
  createAdminToken,
  setAdminCookieHeader,
} from './lib/admin-auth'

function bodyFromParsedJson(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown
    return v != null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function isSafeParsedBody(b: unknown): b is Record<string, unknown> {
  if (b == null || typeof b !== 'object' || Array.isArray(b)) return false
  if (Buffer.isBuffer(b) || b instanceof Uint8Array) return false
  const proto = Object.getPrototypeOf(b)
  return proto === Object.prototype || proto === null
}

function coerceParsedBody(b: unknown): Record<string, unknown> {
  if (Buffer.isBuffer(b)) {
    const raw = b.toString('utf8')
    return raw ? bodyFromParsedJson(raw) : {}
  }
  if (b instanceof Uint8Array) {
    const raw = Buffer.from(b).toString('utf8')
    return raw ? bodyFromParsedJson(raw) : {}
  }
  if (typeof b === 'string' && b.length) return bodyFromParsedJson(b)
  if (isSafeParsedBody(b)) return b
  return {}
}

/**
 * Prefer `req.body` (Vercel pre-parsed). If missing, read raw JSON once via `raw-body`
 * (avoids manual stream iteration that can crash on some runtimes).
 */
async function readLoginBody(req: any): Promise<Record<string, unknown>> {
  if (req.body !== undefined && req.body !== null) {
    return coerceParsedBody(req.body)
  }
  try {
    const cl = req.headers?.['content-length']
    const len = typeof cl === 'string' ? parseInt(cl, 10) : typeof cl === 'number' ? cl : NaN
    const rawBuf = await getRawBody(req, {
      length: Number.isFinite(len) && len > 0 ? len : undefined,
      limit: 32 * 1024,
    })
    const raw = Buffer.isBuffer(rawBuf) ? rawBuf.toString('utf8') : String(rawBuf || '')
    if (raw.trim()) return bodyFromParsedJson(raw)
  } catch {
    /* stream absent, already read, or non-JSON */
  }
  return {}
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

    const body = await readLoginBody(req)

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
    const r = res as { headersSent?: boolean; writableEnded?: boolean }
    if (!r.headersSent && !r.writableEnded) {
      json(res, 500, { error: `Login handler error: ${msg}` })
    }
  }
}
