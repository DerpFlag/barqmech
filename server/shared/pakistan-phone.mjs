/**
 * Pakistan mobile: 03XXXXXXXXX (11 digits), +923XXXXXXXXX, or 00923XXXXXXXXX.
 * Spaces, dashes, and parentheses are ignored for validation.
 */

export function normalizePakistanPhoneInput(raw) {
  return String(raw ?? '')
    .trim()
    .replace(/[\s().-]/g, '')
}

export function isPakistanMobile(raw) {
  const s = normalizePakistanPhoneInput(raw)
  if (!s) return false
  if (/^03\d{9}$/.test(s)) return true
  if (/^\+923\d{9}$/.test(s)) return true
  if (/^00923\d{9}$/.test(s)) return true
  return false
}

/** tel: URI for href from a validated-style raw input */
export function telHrefFromPakistanRaw(raw) {
  const s = normalizePakistanPhoneInput(raw)
  if (/^03\d{9}$/.test(s)) return `tel:${s}`
  if (/^\+923\d{9}$/.test(s)) return `tel:${s.replace(/^\+/, '')}`
  if (/^00923\d{9}$/.test(s)) return `tel:${s.slice(2)}`
  return '#'
}
