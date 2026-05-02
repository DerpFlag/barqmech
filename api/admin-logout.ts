import { clearAdminCookieHeader } from './lib/admin-auth'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  res.setHeader('Set-Cookie', clearAdminCookieHeader())
  return res.status(200).json({ ok: true })
}
