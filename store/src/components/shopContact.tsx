import { memo, useState, type FormEvent } from 'react'
import { getEmailFieldError, getPakistanPhoneFieldError } from '../lib/contactFormValidation.ts'
import { isGmailValidationError } from '../lib/gmailEmail.ts'
import { ContactInfoLinks } from './ContactInfoLinks.tsx'

export function useShopContactDemo() {
  const [demoPromptOpen, setDemoPromptOpen] = useState(false)
  const [demoEmail, setDemoEmail] = useState('')
  const [demoStatus, setDemoStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactStatus, setContactStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [contactFieldErrors, setContactFieldErrors] = useState<{ email?: string; phone?: string }>({})

  const openCalendly = () => {
    const normalized = demoEmail.trim()
    const emailErr = getEmailFieldError(normalized)
    if (emailErr) {
      setDemoStatus({ type: 'error', message: emailErr })
      return
    }
    setDemoStatus({ type: 'success', message: 'Opening Calendly...' })
    const calendlyUrl = `https://calendly.com/raoanasriaz/barqmech-demo?email=${encodeURIComponent(normalized)}`
    window.open(calendlyUrl, '_blank', 'noopener,noreferrer')
    setDemoPromptOpen(false)
  }

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (contactSubmitting) return
    const form = event.currentTarget
    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const subject = String(formData.get('subject') ?? '').trim()
    const message = String(formData.get('message') ?? '').trim()
    const emailErr = getEmailFieldError(email)
    const phoneErr = getPakistanPhoneFieldError(subject)
    setContactFieldErrors({
      ...(emailErr ? { email: emailErr } : {}),
      ...(phoneErr ? { phone: phoneErr } : {}),
    })
    if (emailErr || phoneErr) {
      setContactStatus(null)
      return
    }
    if (!name.trim() || !message.trim()) {
      setContactStatus({ type: 'error', message: 'Please fill in your name and message.' })
      return
    }
    setContactSubmitting(true)
    setContactStatus(null)
    setContactFieldErrors({})
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        }),
      })
      const result = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        const msg = result.error || 'Failed to send message. Please try again.'
        if (isGmailValidationError(msg)) {
          setContactFieldErrors({ email: msg })
          setContactStatus(null)
          return
        }
        throw new Error(msg)
      }
      form.reset()
      setContactFieldErrors({})
      setContactStatus({ type: 'success', message: 'Message sent successfully. We will get back to you soon.' })
    } catch (error) {
      setContactFieldErrors({})
      setContactStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to send message. Please try again.' })
    } finally {
      setContactSubmitting(false)
    }
  }

  return {
    demoPromptOpen,
    setDemoPromptOpen,
    demoEmail,
    setDemoEmail,
    demoStatus,
    contactSubmitting,
    contactStatus,
    contactFieldErrors,
    handleContactSubmit,
    openCalendly,
  }
}

type ShopContactDemo = ReturnType<typeof useShopContactDemo>

function OrderDesignContactFooterInner({
  shopContact,
  demoEmailFieldId,
}: {
  shopContact: ShopContactDemo
  demoEmailFieldId: string
}) {
  const {
    demoPromptOpen,
    setDemoPromptOpen,
    demoEmail,
    setDemoEmail,
    demoStatus,
    contactSubmitting,
    contactStatus,
    contactFieldErrors,
    handleContactSubmit,
    openCalendly,
  } = shopContact

  return (
    <>
      <section className="confidence-section order-design-heading-section" id="order-design" aria-label="Order custom design heading">
        <div className="confidence-title-row">
          <span className="confidence-line" aria-hidden />
          <h3>Order Your Custom Design</h3>
          <span className="confidence-line" aria-hidden />
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-grid">
          <div className="contact-form-card">
            <h3>Send Us a Message</h3>
            <p>Fill out the form below and we&apos;ll get back to you as soon as possible.</p>
            <form className="contact-form" onSubmit={handleContactSubmit}>
              <label>
                Name *
                <input type="text" name="name" placeholder="Your name" required />
              </label>
              <label>
                Email *
                <input type="email" name="email" placeholder="your@email.com" required />
                {contactFieldErrors.email ? (
                  <span className="form-field-error" role="alert">
                    {contactFieldErrors.email}
                  </span>
                ) : null}
              </label>
              <label>
                Contact *
                <input type="tel" name="subject" placeholder="03XX XXXXXXX or +92…" required />
                {contactFieldErrors.phone ? (
                  <span className="form-field-error" role="alert">
                    {contactFieldErrors.phone}
                  </span>
                ) : null}
              </label>
              <label>
                Message *
                <textarea name="message" placeholder="Tell us about your project or inquiry..." rows={6} required />
              </label>
              <button type="submit" className="contact-send-btn" disabled={contactSubmitting}>
                {contactSubmitting ? 'Sending...' : 'Send Message'}
              </button>
              {contactStatus && <p className={`contact-status ${contactStatus.type}`}>{contactStatus.message}</p>}
            </form>
          </div>
          <div className="contact-info-col contact-info-card">
            <div className="contact-info-header">
              <h3>Contact Information</h3>
              <p>Prefer to reach out directly? Here&apos;s how you can contact us.</p>
            </div>
            <ContactInfoLinks />
            <div className="contact-info-box">
              <h4>Ready to Get Started?</h4>
              <p>
                At BarqMech, we design and fabricate premium metal solutions that elevate commercial and residential
                spaces. From custom gates and railings to decorative panels and lighting structures, we deliver quality
                craftsmanship built to last.
              </p>
            </div>
            <div className="contact-info-box">
              <h4>Response Time</h4>
              <p>
                We typically respond to inquiries within 2-5 hours during business days. For urgent matters, please
                call us directly.
              </p>
            </div>
            <button type="button" className="book-demo-btn" onClick={() => setDemoPromptOpen((v) => !v)}>
              Book a Demo
            </button>
            {demoPromptOpen && (
              <div className="demo-prompt">
                <label htmlFor={demoEmailFieldId}>Work Email</label>
                <input
                  id={demoEmailFieldId}
                  type="email"
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  placeholder="you@company.com"
                />
                <button type="button" onClick={openCalendly}>
                  Continue to Calendly
                </button>
                {demoStatus && <p className={`contact-status ${demoStatus.type}`}>{demoStatus.message}</p>}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} BarqMech. All rights reserved.</p>
        <p>Built with innovation in mind.</p>
      </footer>
    </>
  )
}

export const OrderDesignContactFooter = memo(OrderDesignContactFooterInner)
