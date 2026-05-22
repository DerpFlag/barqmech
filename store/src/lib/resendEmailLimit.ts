export const RESEND_TEST_INBOX = 'derpflag@gmail.com'

export const RESEND_EMAIL_FAILED_MESSAGE =
  'Email failed. Only derpflag@gmail.com can receive mail until our domain is set up.'

export function isResendDeliveryError(message: string): boolean {
  return message.includes('Email failed')
}
