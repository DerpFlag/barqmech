import { Resend } from 'resend'
import { validateGmailEmail } from './lib/gmail-email.mjs'
import { isResendTestSender, resolveStoreInbox } from './lib/resend-email-limit.mjs'
import { escapeHtml, resolveSiteBaseUrl, emailShell } from './lib/email-brand.mjs'
import { telHrefFromPakistanRaw } from './lib/pakistan-phone.mjs'

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

async function readJsonBody(req) {
  if (req.body != null && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body
  }
  if (typeof req.body === 'string' && req.body.length) {
    return JSON.parse(req.body)
  }
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw)
}

export default async function handler(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    return res.end()
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  try {
    const resendApiKey = process.env.RESEND_API_KEY
    const resendFromEmail =
      process.env.RESEND_FROM_EMAIL || process.env.ORDER_FROM_EMAIL || 'onboarding@resend.dev'
    const contactToEmail = resolveStoreInbox()

    if (!resendApiKey || !resendFromEmail || !contactToEmail) {
      return sendJson(res, 500, { error: 'Email service is not configured.' })
    }

    const resend = new Resend(resendApiKey)

    let body
    try {
      body = await readJsonBody(req)
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON' })
    }

    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim()
    const company = String(body.company ?? '').trim()
    const subject = String(body.subject ?? '').trim()
    const message = String(body.message ?? '').trim()

    if (!name || !email || !subject || !message) {
      return sendJson(res, 400, { error: 'Missing required fields.' })
    }

    const emailValidation = validateGmailEmail(email)
    if (!emailValidation.ok) {
      return sendJson(res, 400, { error: emailValidation.reason })
    }
    const visitorEmail = emailValidation.normalized

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
      Someone used the &quot;Send Us a Message&quot; form on the BarqMech website. Their Gmail is below — reply from this notification.
    </p>
    <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;font-weight:700;">Contact details</p>
    <table role="presentation" style="margin-bottom:26px;font-size:14px;color:#334155;line-height:1.75;font-family:Arial,Helvetica,sans-serif;">
      <tr><td style="padding:4px 16px 4px 0;color:#64748b;vertical-align:top;width:100px;">Name</td><td style="padding:4px 0;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#64748b;vertical-align:top;">Email</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(visitorEmail)}" style="color:#1d4ed8;text-decoration:none;">${escapeHtml(visitorEmail)}</a></td></tr>
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

    const mail = {
      from: resendFromEmail,
      to: contactToEmail,
      subject: `[Website Contact] ${subject}`,
      html: emailShell('Website contact form', innerTd, siteBase),
    }
    if (!isResendTestSender(resendFromEmail)) {
      mail.replyTo = visitorEmail
    }

    const sent = await resend.emails.send(mail)
    if (sent.error) {
      console.error('[contact] Resend send failed', {
        error: sent.error,
        to: contactToEmail,
        from: resendFromEmail,
      })
      return sendJson(res, 500, { error: 'Failed to send message. Please try again.' })
    }

    return sendJson(res, 200, { ok: true })
  } catch (error) {
    console.error('[contact] handler error', error)
    return sendJson(res, 500, { error: 'Failed to send message. Please try again.' })
  }
}
