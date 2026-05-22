/**
 * Free email validation (no API key): format, disposable blocklist, DNS MX, common typos.
 * Used by checkout, contact form, and /api/validate-email.
 */
import { resolveMx, resolve4 } from 'node:dns/promises'
import MailChecker from 'mailchecker'

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

/** Common domain typos → suggestion shown to the user */
const DOMAIN_TYPOS = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'icloud.con': 'icloud.com',
}

const MX_TIMEOUT_MS = 4500

export function emailFormatOk(email) {
  const e = String(email || '').trim()
  if (!e || e.length > 254) return false
  if (e.includes('..')) return false
  return EMAIL_REGEX.test(e)
}

function parseEmail(email) {
  const e = String(email || '').trim().toLowerCase()
  const at = e.lastIndexOf('@')
  if (at < 1) return null
  const local = e.slice(0, at)
  const domain = e.slice(at + 1)
  if (!local || !domain || !domain.includes('.')) return null
  return { local, domain, normalized: `${local}@${domain}` }
}

function typoSuggestion(domain) {
  const hint = DOMAIN_TYPOS[domain]
  if (!hint) return null
  return `Did you mean @${hint}?`
}

function domainDoesNotExist(err) {
  const code = err && typeof err === 'object' && 'code' in err ? err.code : ''
  return code === 'ENOTFOUND' || code === 'ENODATA'
}

async function domainAcceptsMail(domain) {
  if (process.env.EMAIL_CHECK_MX === 'false') return true

  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('mx_timeout')), MX_TIMEOUT_MS)
  })

  const check = async () => {
    let resolverIssue = false

    try {
      const mx = await resolveMx(domain)
      if (mx?.length) return true
    } catch (err) {
      if (domainDoesNotExist(err)) return false
      resolverIssue = true
      console.warn('[validate-email] MX lookup', domain, err?.code || err?.message)
    }

    try {
      const a = await resolve4(domain)
      if (a?.length) return true
    } catch (err) {
      if (domainDoesNotExist(err)) return false
      resolverIssue = true
      console.warn('[validate-email] A lookup', domain, err?.code || err?.message)
    }

    if (resolverIssue) return true
    return false
  }

  try {
    return await Promise.race([check(), timeout])
  } catch (e) {
    if (e?.message === 'mx_timeout') {
      console.warn('[validate-email] MX timeout for', domain)
    }
    return true
  }
}

/**
 * @param {string} email
 * @returns {Promise<{ ok: boolean; reason: string }>}
 */
export async function validateCustomerEmail(email) {
  const parsed = parseEmail(email)
  if (!parsed) {
    return { ok: false, reason: 'Please enter a valid email address (for example you@example.com).' }
  }

  if (!emailFormatOk(parsed.normalized)) {
    return { ok: false, reason: 'Please enter a valid email address (for example you@example.com).' }
  }

  const typo = typoSuggestion(parsed.domain)
  if (typo) {
    return { ok: false, reason: `That email domain does not look right. ${typo}` }
  }

  if (!MailChecker.isValid(parsed.normalized)) {
    return {
      ok: false,
      reason: 'Please use a real inbox — disposable or temporary email addresses are not allowed.',
    }
  }

  const acceptsMail = await domainAcceptsMail(parsed.domain)
  if (!acceptsMail) {
    return {
      ok: false,
      reason: `We could not verify the domain "${parsed.domain}". Check for typos or use another email.`,
    }
  }

  return { ok: true, reason: '' }
}
