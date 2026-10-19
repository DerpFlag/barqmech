import { enforceOrigin } from '../server/v3/http.mjs';
import { clearAdminCookieHeader } from '../server/shared/admin-auth.mjs';
export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try { enforceOrigin(req); } catch (error) { return res.status(error.status ?? 403).json({error:'Request origin not allowed.'}); }
    res.setHeader('Set-Cookie', clearAdminCookieHeader());
    return res.status(200).json({ ok: true });
}
