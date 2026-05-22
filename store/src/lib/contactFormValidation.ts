import { getGmailFieldError } from './gmailEmail.ts'
import { isPakistanMobile } from './pakistanPhone.ts'

/** @deprecated Use getGmailFieldError — kept as alias for existing imports. */
export function getEmailFieldError(email: string): string | undefined {
  return getGmailFieldError(email)
}

export function getPakistanPhoneFieldError(phone: string): string | undefined {
  const v = phone.trim()
  if (!v) return 'Please enter your mobile number.'
  if (!isPakistanMobile(phone)) {
    return 'Use a Pakistan mobile number: 03XXXXXXXXX, +92 3XX XXXXXXX, or 0092 3XX XXXXXXX.'
  }
  return undefined
}
