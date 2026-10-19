import { getAdminTokenFromReq, verifyAdminToken } from '../server/shared/admin-auth.mjs';
export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const token = getAdminTokenFromReq(req);
    const ok = verifyAdminToken(token);
    return res.status(200).json({ ok });
}
