/** Pakistan mobile: 03XXXXXXXXX, +923XXXXXXXXX, or 00923XXXXXXXXX (spaces ignored). */

export function normalizePakistanPhoneInput(raw: string): string {
  return String(raw ?? '')
    .trim()
    .replace(/[\s().-]/g, '')
}

export function isPakistanMobile(raw: string): boolean {
  const s = normalizePakistanPhoneInput(raw)
  if (!s) return false
  if (/^03\d{9}$/.test(s)) return true
  if (/^\+923\d{9}$/.test(s)) return true
  if (/^00923\d{9}$/.test(s)) return true
  return false
}
