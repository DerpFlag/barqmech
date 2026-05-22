import { validateWithZeroBounce } from './lib/zero-bounce.mjs'

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]{2,})+$/

const logUpstreamError = (context: string, details: Record<string, unknown>) => {
  console.error(`[validate-email] ${context}`, details)
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const email = String(req.body?.email ?? '').trim()
  if (!email || !EMAIL_REGEX.test(email) || email.includes('..')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }

  const emailValidation = await validateWithZeroBounce(email)
  if (emailValidation.skipped) {
    console.warn('[validate-email] ZeroBounce skipped:', emailValidation.skipReason)
  }
  if (!emailValidation.ok) {
    if (emailValidation.code === 429) {
      return res.status(429).json({ error: emailValidation.reason })
    }
    if (/rate|too many|429/i.test(emailValidation.reason)) {
      return res.status(429).json({ error: emailValidation.reason })
    }
    return res.status(400).json({ error: emailValidation.reason })
  }

  return res.status(200).json({ ok: true })
}
