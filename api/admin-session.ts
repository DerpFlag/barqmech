import { getAdminTokenFromReq, verifyAdminToken } from './lib/admin-auth'

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const token = getAdminTokenFromReq(req)
  const ok = verifyAdminToken(token)
  return res.status(200).json({ ok })
}
