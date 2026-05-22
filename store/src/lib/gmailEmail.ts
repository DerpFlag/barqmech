export const GMAIL_FIELD_ERROR = 'Please enter a Gmail email address.'

const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com'])

function parseEmail(raw: string) {
  const e = raw.trim().toLowerCase()
  const at = e.lastIndexOf('@')
  if (at < 1) return null
  const local = e.slice(0, at)
  const domain = e.slice(at + 1)
  if (!local || !domain) return null
  return { local, domain }
}

function gmailLocalPartOk(local: string) {
  if (!local || local.length > 64) return false
  if (local.startsWith('.') || local.endsWith('.')) return false
  if (local.includes('..')) return false
  return /^[a-z0-9](?:[a-z0-9.+]*[a-z0-9])?$/i.test(local) || /^[a-z0-9]$/i.test(local)
}

export function getGmailFieldError(email: string): string | undefined {
  const v = email.trim()
  if (!v) return GMAIL_FIELD_ERROR
  const parsed = parseEmail(v)
  if (!parsed || !GMAIL_DOMAINS.has(parsed.domain)) return GMAIL_FIELD_ERROR
  if (!gmailLocalPartOk(parsed.local)) return GMAIL_FIELD_ERROR
  return undefined
}

export function isGmailValidationError(message: string): boolean {
  return message.includes('Gmail')
}
