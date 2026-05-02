import {
  adminPasswordOk,
  createAdminToken,
  setAdminCookieHeader,
} from './lib/admin-auth.mjs'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const password = String(req.body?.password ?? '')
  if (!adminPasswordOk(password)) {
    return res.status(401).json({ error: 'Invalid password.' })
  }

  const token = createAdminToken()
  res.setHeader('Set-Cookie', setAdminCookieHeader(token))
  return res.status(200).json({ ok: true })
}
