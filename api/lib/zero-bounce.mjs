/**
 * Shared ZeroBounce v2 validate (same behavior as HF/store contact flows).
 * If ZEROBOUNCE_API_KEY is unset, validation is skipped (ok: true).
 */
const ACCEPTED_ZEROBOUNCE_STATUS = new Set(['valid'])

const logUpstreamError = (context, details) => {
  console.error(`[zero-bounce] ${context}`, details)
}

/**
 * @param {string} email
 * @returns {Promise<{ ok: boolean; reason: string; code?: number }>}
 */
export async function validateWithZeroBounce(email) {
  const zeroBounceApiKey = process.env.ZEROBOUNCE_API_KEY
  if (!zeroBounceApiKey) {
    return { ok: true, reason: '' }
  }

  const endpoint = `https://api.zerobounce.net/v2/validate?api_key=${encodeURIComponent(
    zeroBounceApiKey
  )}&email=${encodeURIComponent(email)}&ip_address=`

  const response = await fetch(endpoint, { method: 'GET' })
  if (!response.ok) {
    let body = ''
    try {
      body = await response.text()
    } catch {
      body = '<unreadable>'
    }
    logUpstreamError('ZeroBounce request failed', {
      status: response.status,
      statusText: response.statusText,
      body,
    })
    if (response.status === 429) {
      return {
        ok: false,
        reason: 'Email validation rate limit reached. Please try again shortly.',
        code: 429,
      }
    }
    return { ok: false, reason: 'Email validation service is unavailable. Please try again.' }
  }

  const data = await response.json()
  if (data.error) {
    logUpstreamError('ZeroBounce returned error payload', { error: data.error, status: data.status })
    return { ok: false, reason: 'Email validation failed. Please use a different email.' }
  }

  const status = String(data.status ?? '').toLowerCase()
  if (!ACCEPTED_ZEROBOUNCE_STATUS.has(status)) {
    return { ok: false, reason: 'Please provide a valid non-disposable email address.' }
  }

  return { ok: true, reason: '' }
}
