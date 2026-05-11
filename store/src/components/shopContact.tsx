import { memo, useState, type FormEvent } from 'react'
import { getEmailFieldError, getPakistanPhoneFieldError } from '../lib/contactFormValidation.ts'

export function useShopContactDemo() {
  const [demoPromptOpen, setDemoPromptOpen] = useState(false)
  const [demoEmail, setDemoEmail] = useState('')
  const [demoSubmitting, setDemoSubmitting] = useState(false)
  const [demoStatus, setDemoStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactStatus, setContactStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [contactFieldErrors, setContactFieldErrors] = useState<{ email?: string; phone?: string }>({})

  const openCalendly = () => {
    const run = async () => {
      if (demoSubmitting) return
      const normalized = demoEmail.trim()
      const emailErr = getEmailFieldError(normalized)
      if (emailErr) return setDemoStatus({ type: 'error', message: emailErr })
      setDemoSubmitting(true)
      setDemoStatus(null)
      try {
        const response = await fetch('/api/validate-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalized }),
        })
        const result = (await response.json().catch(() => ({}))) as { error?: string }
        if (!response.ok) throw new Error(result.error || 'Email verification failed.')
        const calendlyUrl = `https://calendly.com/derpflag/30min?email=${encodeURIComponent(normalized)}`
        window.open(calendlyUrl, '_blank', 'noopener,noreferrer')
        setDemoStatus({ type: 'success', message: 'Opening Calendly...' })
        setDemoPromptOpen(false)
      } catch (error) {
        setDemoStatus({ type: 'error', message: error instanceof Error ? error.message : 'Email verification failed.' })
      } finally {
        setDemoSubmitting(false)
      }
    }
    void run()
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
      if (!response.ok) throw new Error(result.error || 'Failed to send message.')
      form.reset()
      setContactFieldErrors({})
      setContactStatus({ type: 'success', message: 'Message sent successfully. We will get back to you soon.' })
    } catch (error) {
      setContactFieldErrors({})
      setContactStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to send message.' })
    } finally {
      setContactSubmitting(false)
    }
  }

  return {
    demoPromptOpen,
    setDemoPromptOpen,
    demoEmail,
    setDemoEmail,
    demoSubmitting,
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
    demoSubmitting,
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
            <div className="contact-info-links-grid">
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="contact-info-icon-svg">
                    <path d="M3 6h18v12H3V6zm2 2v.35L12 12.8l7-4.45V8H5zm14 8v-5.3l-7 4.45-7-4.45V16h14z" />
                  </svg>
                </span>
                <div>
                  <p>Email</p>
                  <a href="mailto:derpflag@gmail.com">derpflag@gmail.com</a>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="contact-info-icon-svg">
                    <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1-.24c1.12.37 2.33.57 3.59.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.3 21 3 13.7 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.26.2 2.47.57 3.59a1 1 0 0 1-.24 1l-2.21 2.2z" />
                  </svg>
                </span>
                <div>
                  <p>Phone</p>
                  <a href="tel:+923082779843">+92 308 2779843</a>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="contact-info-icon-svg">
                    <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9zm10.75 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                  </svg>
                </span>
                <div>
                  <p>Instagram</p>
                  <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer">
                    Follow on Instagram
                  </a>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="contact-info-icon-svg">
                    <path d="M13 22v-8h3l.5-4H13V7.5c0-1.15.33-1.9 1.98-1.9H16.7V2.1c-.3-.04-1.34-.1-2.55-.1-2.53 0-4.26 1.55-4.26 4.4V10H7v4h2.9v8H13z" />
                  </svg>
                </span>
                <div>
                  <p>Facebook</p>
                  <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer">
                    Visit Facebook Page
                  </a>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="contact-info-icon-svg">
                    <path d="M23 12.02c0-.78-.08-1.57-.26-2.33a3.06 3.06 0 0 0-2.16-2.17C18.72 7 12 7 12 7s-6.72 0-8.58.52A3.06 3.06 0 0 0 1.26 9.7C1.08 10.45 1 11.24 1 12.02c0 .78.08 1.57.26 2.33a3.06 3.06 0 0 0 2.16 2.17C5.28 17 12 17 12 17s6.72 0 8.58-.52a3.06 3.06 0 0 0 2.16-2.17c.18-.76.26-1.55.26-2.33zM10 14.5v-5l4.5 2.5-4.5 2.5z" />
                  </svg>
                </span>
                <div>
                  <p>YouTube</p>
                  <a href="https://youtube.com/" target="_blank" rel="noopener noreferrer">
                    Watch on YouTube
                  </a>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="contact-info-icon-svg">
                    <path d="M20.52 3.48A11.9 11.9 0 0 0 12.03 0C5.41 0 .03 5.38.03 12c0 2.11.55 4.17 1.6 5.99L0 24l6.17-1.62A11.94 11.94 0 0 0 12.03 24c6.62 0 12-5.38 12-12 0-3.2-1.25-6.2-3.51-8.52zM12.03 21.96a9.94 9.94 0 0 1-5.08-1.39l-.36-.21-3.66.96.98-3.57-.24-.37A9.93 9.93 0 0 1 2.03 12c0-5.51 4.49-10 10-10 2.67 0 5.18 1.04 7.07 2.93A9.93 9.93 0 0 1 22.03 12c0 5.51-4.49 9.96-10 9.96zm5.46-7.46c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.77.97-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.5-1.79-1.67-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.66-.5h-.57c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.08 4.49.71.3 1.26.48 1.69.61.71.22 1.35.19 1.86.11.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z" />
                  </svg>
                </span>
                <div>
                  <p>WhatsApp</p>
                  <a href="https://wa.me/923082779843" target="_blank" rel="noopener noreferrer">
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            </div>
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
                <button type="button" onClick={openCalendly} disabled={demoSubmitting}>
                  {demoSubmitting ? 'Verifying Email...' : 'Continue to Calendly'}
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
