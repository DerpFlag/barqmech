/** Gmail-only addresses for checkout, contact, and Calendly prefill. */

export const GMAIL_FIELD_ERROR = 'Please enter a Gmail email address.'

const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com'])

function parseEmail(raw) {
  const e = String(raw || '').trim().toLowerCase()
  const at = e.lastIndexOf('@')
  if (at < 1) return null
  const local = e.slice(0, at)
  const domain = e.slice(at + 1)
  if (!local || !domain) return null
  return { local, domain }
}

/** Gmail local-part rules (format only — no free API proves the inbox exists). */
function gmailLocalPartOk(local) {
  if (!local || local.length > 64) return false
  if (local.startsWith('.') || local.endsWith('.')) return false
  if (local.includes('..')) return false
  return /^[a-z0-9](?:[a-z0-9.+]*[a-z0-9])?$/i.test(local) || /^[a-z0-9]$/i.test(local)
}

/**
 * @param {string} email
 * @returns {{ ok: boolean; reason: string; normalized: string }}
 */
export function validateGmailEmail(email) {
  const parsed = parseEmail(email)
  if (!parsed || !GMAIL_DOMAINS.has(parsed.domain)) {
    return { ok: false, reason: GMAIL_FIELD_ERROR, normalized: '' }
  }
  if (!gmailLocalPartOk(parsed.local)) {
    return { ok: false, reason: GMAIL_FIELD_ERROR, normalized: '' }
  }
  return { ok: true, reason: '', normalized: `${parsed.local}@gmail.com` }
}
