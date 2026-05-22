import { emailFormatOk, validateCustomerEmail } from './lib/validate-customer-email.mjs'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const email = String(req.body?.email ?? '').trim()
  if (!emailFormatOk(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }

  const emailValidation = await validateCustomerEmail(email)
  if (!emailValidation.ok) {
    return res.status(400).json({ error: emailValidation.reason })
  }

  return res.status(200).json({ ok: true })
}
