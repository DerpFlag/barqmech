import { Resend } from 'resend'
import { validateWithZeroBounce } from './lib/zero-bounce.mjs'

const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = process.env.RESEND_FROM_EMAIL
const contactToEmail = process.env.CONTACT_TO_EMAIL

const resend = resendApiKey ? new Resend(resendApiKey) : null

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]{2,})+$/

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

  let emailValidation: { ok: boolean; reason: string; code?: number }
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
