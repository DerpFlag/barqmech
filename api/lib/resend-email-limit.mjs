/** Resend test sender: only this inbox receives mail until a domain is verified. */
export const RESEND_TEST_INBOX = 'derpflag@gmail.com'

export const RESEND_EMAIL_FAILED_MESSAGE =
  'Email failed. Only derpflag@gmail.com can receive mail until our domain is set up.'

export function normalizeEmail(s) {
  return String(s || '').trim().toLowerCase()
}

/** True when using Resend's onboarding@resend.dev (test) sender. */
export function isResendTestSender(fromEmail) {
  return normalizeEmail(fromEmail).includes('@resend.dev')
}

/** Inbox for merchant notifications — must match Resend account email in test mode. */
export function resolveStoreInbox() {
  const contact = String(process.env.CONTACT_TO_EMAIL || '').trim()
  const order = String(process.env.ORDER_NOTIFY_EMAIL || '').trim()
  const from =
    process.env.RESEND_FROM_EMAIL || process.env.ORDER_FROM_EMAIL || 'onboarding@resend.dev'
  if (isResendTestSender(from)) {
    // Test sender only delivers to the Resend account inbox — ignore a mismatched CONTACT_TO_EMAIL.
    return order || RESEND_TEST_INBOX
  }
  return contact || order || RESEND_TEST_INBOX
}
