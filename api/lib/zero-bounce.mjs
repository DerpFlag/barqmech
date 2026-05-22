/**
 * Shared ZeroBounce v2 validate (checkout, contact, demo).
 * If ZEROBOUNCE_API_KEY is unset, validation is skipped (ok: true).
 *
 * If the key is invalid or credits are exhausted, ZeroBounce returns
 * `{ "error": "Invalid API Key or your account ran out of credits" }`.
 * By default we **fail open** (allow the request) so orders are not blocked.
 * Set ZEROBOUNCE_STRICT=true on Vercel to block when ZeroBounce is misconfigured.
 */
const ACCEPTED_ZEROBOUNCE_STATUS = new Set(['valid'])

const logUpstreamError = (context, details) => {
  console.error(`[zero-bounce] ${context}`, details)
}

function isStrictMode() {
  return process.env.ZEROBOUNCE_STRICT === 'true'
}

function skipValidation(reason) {
  return { ok: true, reason: '', skipped: true, skipReason: reason }
}

/**
 * @param {string} email
 * @returns {Promise<{ ok: boolean; reason: string; code?: number; skipped?: boolean; skipReason?: string }>}
 */
export async function validateWithZeroBounce(email) {
  const zeroBounceApiKey = String(process.env.ZEROBOUNCE_API_KEY || '').trim()
  if (!zeroBounceApiKey) {
    return skipValidation('no_api_key')
  }

  const endpoint = `https://api.zerobounce.net/v2/validate?api_key=${encodeURIComponent(
    zeroBounceApiKey
  )}&email=${encodeURIComponent(email)}&ip_address=`

  try {
    const response = await fetch(endpoint, { method: 'GET' })
    if (!response.ok) {
      let body = ''
      try {
        body = await response.text()
      } catch {
        body = '<unreadable>'
      }
      logUpstreamError('ZeroBounce HTTP error', {
        status: response.status,
        statusText: response.statusText,
        body,
      })
      if (!isStrictMode()) {
        return skipValidation(`http_${response.status}`)
      }
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
      const upstream = String(data.error)
      logUpstreamError('ZeroBounce API error (check key/credits on Vercel)', { error: upstream })
      if (!isStrictMode()) {
        return skipValidation(upstream)
      }
      const reason = /invalid api key|credits/i.test(upstream)
        ? 'Email verification is unavailable (ZeroBounce API key or credits). Fix ZEROBOUNCE_API_KEY on Vercel.'
        : 'Email validation failed. Please use a different email.'
      return { ok: false, reason }
    }

    const status = String(data.status ?? '').toLowerCase()
    if (!ACCEPTED_ZEROBOUNCE_STATUS.has(status)) {
      const didYouMean = data.did_you_mean ? ` Did you mean ${data.did_you_mean}?` : ''
      return {
        ok: false,
        reason: `Please provide a valid non-disposable email address.${didYouMean}`,
      }
    }

    return { ok: true, reason: '' }
  } catch (e) {
    logUpstreamError('ZeroBounce request exception', {
      error: e instanceof Error ? e.message : String(e),
    })
    if (!isStrictMode()) {
      return skipValidation('network_error')
    }
    return { ok: false, reason: 'Email validation service is unavailable. Please try again.' }
  }
}
