import { Resend } from 'resend'
import { validateWithZeroBounce } from './lib/zero-bounce.mjs'
import { escapeHtml, resolveSiteBaseUrl, emailShell } from './lib/email-brand.mjs'
import { isPakistanMobile, telHrefFromPakistanRaw } from './lib/pakistan-phone.mjs'

const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = process.env.RESEND_FROM_EMAIL
const contactToEmail = process.env.CONTACT_TO_EMAIL

const resend = resendApiKey ? new Resend(resendApiKey) : null

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]{2,})+$/

const logUpstreamError = (context: string, details: Record<string, unknown>) => {
  console.error(`[contact] ${context}`, details)
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

  const siteBase = resolveSiteBaseUrl(body)
  const messageHtml = escapeHtml(message).replace(/\n/g, '<br/>')
  const companyRow = company
    ? `<tr><td style="padding:4px 16px 4px 0;color:#64748b;vertical-align:top;width:100px;">Company</td><td style="padding:4px 0;">${escapeHtml(company)}</td></tr>`
    : ''

  const innerTd = `
<tr>
  <td style="padding:32px 28px 36px;font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">New contact form submission</p>
    <p style="margin:0 0 22px;font-size:15px;color:#475569;line-height:1.65;">
      Someone used the &quot;Send Us a Message&quot; form on the BarqMech website. You can reply directly to this email to reach them.
    </p>
    <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;font-weight:700;">Contact details</p>
    <table role="presentation" style="margin-bottom:26px;font-size:14px;color:#334155;line-height:1.75;font-family:Arial,Helvetica,sans-serif;">
      <tr><td style="padding:4px 16px 4px 0;color:#64748b;vertical-align:top;width:100px;">Name</td><td style="padding:4px 0;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#64748b;vertical-align:top;">Email</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(email)}" style="color:#1d4ed8;text-decoration:none;">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#64748b;vertical-align:top;">Phone</td><td style="padding:4px 0;"><a href="${escapeHtml(telHrefFromPakistanRaw(subject))}" style="color:#1d4ed8;text-decoration:none;font-weight:600;">${escapeHtml(subject)}</a></td></tr>
      ${companyRow}
    </table>
    <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;font-weight:700;">Message</p>
    <table role="presentation" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
      <tr>
        <td style="padding:20px 22px;font-size:14px;color:#334155;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">${messageHtml}</td>
      </tr>
    </table>
  </td>
</tr>`

  try {
    await resend.emails.send({
      from: resendFromEmail,
      to: contactToEmail,
      replyTo: email,
      subject: `[Website Contact] ${subject}`,
      html: emailShell('Website contact form', innerTd, siteBase),
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
