import { CheckoutError } from '../server/v3/checkout.mjs';
import { database, rateLimit, enforceOrigin } from '../server/v3/http.mjs';
import getRawBody from 'raw-body';
import { adminPasswordConfigured, adminPasswordOk, createAdminToken, setAdminCookieHeader, } from '../server/shared/admin-auth.mjs';
function bodyFromParsedJson(raw) {
    try {
        const v = JSON.parse(raw);
        return v != null && typeof v === 'object' && !Array.isArray(v) ? v : {};
    }
    catch {
        return {};
    }
}
function isSafeParsedBody(b) {
    if (b == null || typeof b !== 'object' || Array.isArray(b))
        return false;
    if (Buffer.isBuffer(b) || b instanceof Uint8Array)
        return false;
    const proto = Object.getPrototypeOf(b);
    return proto === Object.prototype || proto === null;
}
function coerceParsedBody(b) {
    if (Buffer.isBuffer(b)) {
        const raw = b.toString('utf8');
        return raw ? bodyFromParsedJson(raw) : {};
    }
    if (b instanceof Uint8Array) {
        const raw = Buffer.from(b).toString('utf8');
        return raw ? bodyFromParsedJson(raw) : {};
    }
    if (typeof b === 'string' && b.length)
        return bodyFromParsedJson(b);
    if (isSafeParsedBody(b))
        return b;
    return {};
}
/**
 * Prefer `req.body` (Vercel pre-parsed). If missing, read raw JSON once via `raw-body`
 * (avoids manual stream iteration that can crash on some runtimes).
 */
async function readLoginBody(req) {
    if (req.body !== undefined && req.body !== null) {
        return coerceParsedBody(req.body);
    }
    try {
        const cl = req.headers?.['content-length'];
        const len = typeof cl === 'string' ? parseInt(cl, 10) : typeof cl === 'number' ? cl : NaN;
        const rawBuf = await getRawBody(req, {
            length: Number.isFinite(len) && len > 0 ? len : undefined,
            limit: 32 * 1024,
        });
        const raw = Buffer.isBuffer(rawBuf) ? rawBuf.toString('utf8') : String(rawBuf || '');
        if (raw.trim())
            return bodyFromParsedJson(raw);
    }
    catch {
        /* stream absent, already read, or non-JSON */
    }
    return {};
}
function json(res, status, payload) {
    if (res.writableEnded)
        return;
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
}
export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    try {
        if (req.method !== 'POST') {
            return json(res, 405, { error: 'Method not allowed' });
        }
        enforceOrigin(req);
        await rateLimit(req, database(), 'admin-login', 5);
        const body = await readLoginBody(req);
        const onVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
        if (onVercel && !adminPasswordConfigured()) {
            return json(res, 503, {
                error: 'ADMIN_PASSWORD is not set for this Vercel environment. Open Project → Settings → Environment Variables and add it for Production (and Preview if you test preview URLs). Redeploy after saving.',
            });
        }
        const password = String(body.password ?? body.Password ?? '');
        if (!password.trim()) {
            return json(res, 400, {
                error: 'Missing password. The server did not receive a JSON body with a "password" field. Try another browser or disable extensions that block request bodies.',
            });
        }
        if (!adminPasswordOk(password)) {
            return json(res, 401, {
                error: 'Invalid password. Tip: re-copy the value from Vercel with no extra spaces; env values are trimmed on the server.',
            });
        }
        const token = createAdminToken();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Set-Cookie', setAdminCookieHeader(token));
        res.end(JSON.stringify({ ok: true }));
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const r = res;
        if (!r.headersSent && !r.writableEnded) {
            json(res, err instanceof CheckoutError ? err.status : 503, { error: err instanceof CheckoutError ? msg : 'Admin login is temporarily unavailable.' });
        }
    }
}
