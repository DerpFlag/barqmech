import type { ReactNode } from 'react'
import {
  storefrontEmail,
  storefrontFacebookUrl,
  storefrontLinkedInUrl,
  storefrontPhoneDisplay,
  storefrontPhoneTel,
  storefrontWhatsApp,
} from '../data/catalog.ts'

type ContactLinkItemProps = {
  label: string
  href: string
  children: ReactNode
  icon: ReactNode
}

function ContactLinkItem({ label, href, children, icon }: ContactLinkItemProps) {
  return (
    <div className="contact-info-item">
      <span className="contact-info-icon" aria-hidden>
        {icon}
      </span>
      <div>
        <p>{label}</p>
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      </div>
    </div>
  )
}

const iconClass = 'contact-info-icon-svg'

export function ContactInfoLinks() {
  return (
    <div className="contact-info-links-grid">
      <ContactLinkItem
        label="Email"
        href={`mailto:${storefrontEmail}`}
        icon={
          <svg viewBox="0 0 24 24" className={iconClass}>
            <path d="M3 6h18v12H3V6zm2 2v.35L12 12.8l7-4.45V8H5zm14 8v-5.3l-7 4.45-7-4.45V16h14z" />
          </svg>
        }
      >
        {storefrontEmail}
      </ContactLinkItem>

      <ContactLinkItem
        label="Phone"
        href={`tel:${storefrontPhoneTel}`}
        icon={
          <svg viewBox="0 0 24 24" className={iconClass}>
            <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1-.24c1.12.37 2.33.57 3.59.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.3 21 3 13.7 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.26.2 2.47.57 3.59a1 1 0 0 1-.24 1l-2.21 2.2z" />
          </svg>
        }
      >
        {storefrontPhoneDisplay}
      </ContactLinkItem>

      <ContactLinkItem
        label="Facebook"
        href={storefrontFacebookUrl}
        icon={
          <svg viewBox="0 0 24 24" className={iconClass}>
            <path d="M13 22v-8h3l.5-4H13V7.5c0-1.15.33-1.9 1.98-1.9H16.7V2.1c-.3-.04-1.34-.1-2.55-.1-2.53 0-4.26 1.55-4.26 4.4V10H7v4h2.9v8H13z" />
          </svg>
        }
      >
        Visit Facebook Page
      </ContactLinkItem>

      <ContactLinkItem
        label="LinkedIn"
        href={storefrontLinkedInUrl}
        icon={
          <svg viewBox="0 0 24 24" className={iconClass}>
            <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3v9zM6.5 8.25A1.75 1.75 0 118.25 6.5 1.75 1.75 0 016.5 8.25zM19 19h-3v-4.74c0-1.42-.03-3.24-1.97-3.24-1.97 0-2.27 1.54-2.27 3.12V19h-3v-9h2.92v1.23h.04a3.2 3.2 0 012.92-1.6c3.12 0 3.69 2.05 3.69 4.72V19z" />
          </svg>
        }
      >
        Follow on LinkedIn
      </ContactLinkItem>

      <ContactLinkItem
        label="WhatsApp"
        href={storefrontWhatsApp}
        icon={
          <svg viewBox="0 0 24 24" className={iconClass}>
            <path d="M20.52 3.48A11.9 11.9 0 0 0 12.03 0C5.41 0 .03 5.38.03 12c0 2.11.55 4.17 1.6 5.99L0 24l6.17-1.62A11.94 11.94 0 0 0 12.03 24c6.62 0 12-5.38 12-12 0-3.2-1.25-6.2-3.51-8.52zM12.03 21.96a9.94 9.94 0 0 1-5.08-1.39l-.36-.21-3.66.96.98-3.57-.24-.37A9.93 9.93 0 0 1 2.03 12c0-5.51 4.49-10 10-10 2.67 0 5.18 1.04 7.07 2.93A9.93 9.93 0 0 1 22.03 12c0 5.51-4.49 9.96-10 9.96zm5.46-7.46c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.77.97-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.5-1.79-1.67-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.66-.5h-.57c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.08 4.49.71.3 1.26.48 1.69.61.71.22 1.35.19 1.86.11.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z" />
          </svg>
        }
      >
        Chat on WhatsApp
      </ContactLinkItem>
    </div>
  )
}
