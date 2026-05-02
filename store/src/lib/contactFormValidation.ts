import { isPakistanMobile } from './pakistanPhone.ts'

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]{2,})+$/

export function isValidEmail(value: string) {
  const email = value.trim()
  return EMAIL_REGEX.test(email) && !email.includes('..')
}

export function getEmailFieldError(email: string): string | undefined {
  const v = email.trim()
  if (!v) return 'Please enter your email address.'
  if (!isValidEmail(v)) return 'Use a valid email address, for example you@example.com.'
  return undefined
}

export function getPakistanPhoneFieldError(phone: string): string | undefined {
  const v = phone.trim()
  if (!v) return 'Please enter your mobile number.'
  if (!isPakistanMobile(phone)) {
    return 'Use a Pakistan mobile number: 03XXXXXXXXX, +92 3XX XXXXXXX, or 0092 3XX XXXXXXX.'
  }
  return undefined
}
