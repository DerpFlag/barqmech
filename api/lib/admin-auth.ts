import { createHmac, timingSafeEqual } from 'node:crypto'

export const ADMIN_COOKIE = 'barqmech_admin'

const MAX_AGE_SEC = 60 * 60 * 24 * 7

function sessionSecret(): string {
  const fromEnv =
    (process.env.ADMIN_SESSION_SECRET && String(process.env.ADMIN_SESSION_SECRET).trim()) ||
    (process.env.SUPABASE_SERVICE_ROLE_KEY && String(process.env.SUPABASE_SERVICE_ROLE_KEY).trim()) ||
    ''
  if (fromEnv.length > 0) return fromEnv
  return 'barqmech-admin-dev-only-set-admin-session-secret'
}

export function createAdminToken(): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC
  const key = sessionSecret()
  const sig = createHmac('sha256', key).update(String(exp)).digest('hex')
  return `${exp}.${sig}`
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false
  const dot = token.indexOf('.')
  if (dot < 1) return false
  const expStr = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false
  const key = sessionSecret()
  const expected = createHmac('sha256', key).update(String(exp)).digest('hex')
  if (sig.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'))
  } catch {
    return false
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  const raw = String(cookieHeader || '')
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const k = part.slice(0, idx).trim()
    const v = part.slice(idx + 1).trim()
    if (k) out[k] = decodeURIComponent(v)
  }
  return out
}

export function getAdminTokenFromReq(req: { headers?: { cookie?: string } }): string {
  const cookies = parseCookies(req.headers?.cookie)
  return cookies[ADMIN_COOKIE] || ''
}

export function adminCookieFlags(): string {
  const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
  const securePart = secure ? '; Secure' : ''
  return `Path=/; HttpOnly; SameSite=Lax${securePart}`
}

export function setAdminCookieHeader(token: string): string {
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; ${adminCookieFlags()}; Max-Age=${MAX_AGE_SEC}`
}

export function clearAdminCookieHeader(): string {
  return `${ADMIN_COOKIE}=; ${adminCookieFlags()}; Max-Age=0`
}

function normalizeAdminPassword(s: string): string {
  let t = String(s)
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1)
  }
  return t
}

export function adminPasswordConfigured(): boolean {
  const raw = process.env.ADMIN_PASSWORD
  return raw != null && normalizeAdminPassword(String(raw)) !== ''
}

export function adminPasswordOk(password: string | undefined | null): boolean {
  const raw = process.env.ADMIN_PASSWORD
  const normalizedEnv = raw != null ? normalizeAdminPassword(String(raw)) : ''
  const fromEnv = normalizedEnv !== '' ? normalizedEnv : null
  const expected =
    fromEnv ??
    (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' ? null : 'barq123mech')
  if (expected == null || expected === '') return false
  const a = normalizeAdminPassword(String(password ?? ''))
  const b = normalizeAdminPassword(String(expected))
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
  } catch {
    return false
  }
}
