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

/**
 * Vercel parses JSON POST bodies into `req.body` before the handler runs.
 * Do not read `req` as a stream here — that can throw or double-consume and
 * cause FUNCTION_INVOCATION_FAILED.
 */
function readJsonBody(req: any): Record<string, unknown> {
  const b = req.body
  if (b == null) return {}
  if (Buffer.isBuffer(b)) {
    const raw = b.toString('utf8')
    return raw ? bodyFromParsedJson(raw) : {}
  }
  if (b instanceof Uint8Array) {
    const raw = Buffer.from(b).toString('utf8')
    return raw ? bodyFromParsedJson(raw) : {}
  }
  if (typeof b === 'string' && b.length) return bodyFromParsedJson(b)
  if (typeof b === 'object' && !Array.isArray(b)) return b as Record<string, unknown>
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

    const body = readJsonBody(req)

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
