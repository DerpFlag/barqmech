/** Same-origin on Vercel; optional absolute origin when API is on another host. */
export function validateEmailApiUrl() {
  const raw =
    typeof import.meta.env.VITE_API_ORIGIN === 'string' ? import.meta.env.VITE_API_ORIGIN.trim() : ''
  const base = raw.replace(/\/$/, '')
  return `${base}/api/validate-email`
}

/** Server-side disposable / MX / typo checks — call before contact, checkout, or Calendly. */
export async function verifyCustomerEmail(email: string): Promise<void> {
  const normalized = email.trim()
  const response = await fetch(validateEmailApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalized }),
  })
  const result = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) {
    throw new Error(result.error || 'Email verification failed.')
  }
}
