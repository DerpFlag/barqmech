import { createHmac, timingSafeEqual } from 'node:crypto'

export const ADMIN_COOKIE = 'barqmech_admin'

const MAX_AGE_SEC = 60 * 60 * 24 * 7

function sessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'barqmech-admin-dev-only-set-admin-session-secret'
  )
}

export function createAdminToken() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC
  const sig = createHmac('sha256', sessionSecret()).update(String(exp)).digest('hex')
  return `${exp}.${sig}`
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return false
  const dot = token.indexOf('.')
  if (dot < 1) return false
  const expStr = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false
  const expected = createHmac('sha256', sessionSecret()).update(String(exp)).digest('hex')
  if (sig.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'))
  } catch {
    return false
  }
}

export function parseCookies(cookieHeader) {
  const out = {}
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

export function getAdminTokenFromReq(req) {
  const cookies = parseCookies(req.headers?.cookie)
  return cookies[ADMIN_COOKIE] || ''
}

export function adminCookieFlags() {
  const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
  const securePart = secure ? '; Secure' : ''
  return `Path=/; HttpOnly; SameSite=Lax${securePart}`
}

export function setAdminCookieHeader(token) {
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; ${adminCookieFlags()}; Max-Age=${MAX_AGE_SEC}`
}

export function clearAdminCookieHeader() {
  return `${ADMIN_COOKIE}=; ${adminCookieFlags()}; Max-Age=0`
}

/** True when ADMIN_PASSWORD is non-empty (after trim). */
export function adminPasswordConfigured() {
  const raw = process.env.ADMIN_PASSWORD
  return raw != null && String(raw).trim() !== ''
}

export function adminPasswordOk(password) {
  const raw = process.env.ADMIN_PASSWORD
  const fromEnv = raw != null && String(raw).trim() !== '' ? String(raw).trim() : null
  const expected =
    fromEnv ??
    (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' ? null : 'barq123mech')
  if (expected == null || expected === '') return false
  const a = String(password).trim()
  const b = String(expected).trim()
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
  } catch {
    return false
  }
}
