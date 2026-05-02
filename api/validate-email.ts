const zeroBounceApiKey = process.env.ZEROBOUNCE_API_KEY

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]{2,})+$/

const ACCEPTED_ZEROBOUNCE_STATUS = new Set(['valid'])

type ZeroBounceResult = {
  status?: string
  error?: string
}

const logUpstreamError = (context: string, details: Record<string, unknown>) => {
  console.error(`[validate-email] ${context}`, details)
}

const validateWithZeroBounce = async (email: string) => {
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
    return { ok: false, reason: 'Email validation service is unavailable. Please try again.' }
  }

  const data = (await response.json()) as ZeroBounceResult
  if (data.error) {
    return { ok: false, reason: 'Email validation failed. Please use a different email.' }
  }

  const status = String(data.status ?? '').toLowerCase()
  if (!ACCEPTED_ZEROBOUNCE_STATUS.has(status)) {
    return { ok: false, reason: 'Please provide a valid non-disposable email address.' }
  }

  return { ok: true, reason: '' }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const email = String(req.body?.email ?? '').trim()
  if (!email || !EMAIL_REGEX.test(email) || email.includes('..')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }

  let emailValidation: { ok: boolean; reason: string }
  try {
    emailValidation = await validateWithZeroBounce(email)
  } catch (error) {
    logUpstreamError('Unhandled exception in validateWithZeroBounce', {
      error: error instanceof Error ? error.message : String(error),
    })
    return res.status(500).json({ error: 'Email validation service is unavailable. Please try again.' })
  }
  if (!emailValidation.ok) {
    if (/rate|too many|429/i.test(emailValidation.reason)) {
      return res.status(429).json({ error: emailValidation.reason })
    }
    return res.status(400).json({ error: emailValidation.reason })
  }

  return res.status(200).json({ ok: true })
}
