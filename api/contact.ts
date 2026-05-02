import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = process.env.RESEND_FROM_EMAIL
const contactToEmail = process.env.CONTACT_TO_EMAIL
const zeroBounceApiKey = process.env.ZEROBOUNCE_API_KEY

const resend = resendApiKey ? new Resend(resendApiKey) : null

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]{2,})+$/

const ACCEPTED_ZEROBOUNCE_STATUS = new Set(['valid'])

type ZeroBounceResult = {
  status?: string
  sub_status?: string
  error?: string
}

const logUpstreamError = (context: string, details: Record<string, unknown>) => {
  console.error(`[contact] ${context}`, details)
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

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
    if (response.status === 429) {
      return { ok: false, reason: 'Email validation rate limit reached. Please try again shortly.', code: 429 }
    }
    return { ok: false, reason: 'Email validation service is unavailable. Please try again.' }
  }

  const data = (await response.json()) as ZeroBounceResult
  if (data.error) {
    logUpstreamError('ZeroBounce returned error payload', { error: data.error, status: data.status })
    return { ok: false, reason: 'Email validation failed. Please use a different email.' }
  }

  const status = String(data.status ?? '').toLowerCase()
  if (!ACCEPTED_ZEROBOUNCE_STATUS.has(status)) {
    return { ok: false, reason: 'Please provide a valid non-disposable email address.' }
  }

  return { ok: true, reason: '', code: 200 }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!resend || !resendFromEmail || !contactToEmail) {
    return res.status(500).json({ error: 'Email service is not configured.' })
  }

  const body = req.body ?? {}
  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim()
  const company = String(body.company ?? '').trim()
  const subject = String(body.subject ?? '').trim()
  const message = String(body.message ?? '').trim()

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  if (!EMAIL_REGEX.test(email) || email.includes('..')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }

  let emailValidation: { ok: boolean; reason: string; code: number }
  try {
    emailValidation = await validateWithZeroBounce(email)
  } catch (error) {
    logUpstreamError('Unhandled exception in validateWithZeroBounce', {
      error: error instanceof Error ? error.message : String(error),
    })
    return res.status(500).json({ error: 'Email validation service is unavailable. Please try again.' })
  }
  if (!emailValidation.ok) {
    return res.status(emailValidation.code === 429 ? 429 : 400).json({ error: emailValidation.reason })
  }

  try {
    await resend.emails.send({
      from: resendFromEmail,
      to: contactToEmail,
      replyTo: email,
      subject: `[Website Contact] ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Company:</strong> ${escapeHtml(company || '-')}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
      `,
    })

    return res.status(200).json({ ok: true })
  } catch (error) {
    logUpstreamError('Resend send failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = Number((error as { statusCode?: unknown }).statusCode)
      if (statusCode === 429) {
        return res.status(429).json({ error: 'Email provider rate limit reached. Please try again shortly.' })
      }
    }
    return res.status(500).json({ error: 'Failed to send message.' })
  }
}
