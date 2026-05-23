import { Link, useNavigate } from 'react-router-dom'
import { finalLogoUrl } from '../data/catalog.ts'
import { TopbarCartButton } from '../cart/CartContext.tsx'
import { ProductSearch } from './ProductSearch.tsx'

type ShopTopbarProps = {
  visible?: boolean
  /** When set, Contact scrolls to this section id on the current page. */
  contactSectionId?: string
  showContact?: boolean
  showAccount?: boolean
  searchValue?: string
  onSearchChange?: (query: string) => void
}

export function ShopTopbar({
  visible = true,
  contactSectionId = 'order-design',
  showContact = true,
  showAccount = true,
  searchValue,
  onSearchChange,
}: ShopTopbarProps) {
  const navigate = useNavigate()

  const scrollToSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <header className={`topbar ${visible ? 'visible' : ''}`}>
      <div className="topbar-inner">
        <Link to="/" className="brand-logo-btn">
          <img
            src={finalLogoUrl}
            alt="BarqMech"
            className="brand-logo-img"
            width={240}
            height={72}
            decoding="async"
            fetchPriority="high"
          />
          <span className="brand-title">BARQMECH</span>
        </Link>

        <ProductSearch value={searchValue} onChange={onSearchChange} />

        <nav className="topbar-actions" aria-label="Primary">
          <button type="button" className="topbar-nav-link" onClick={() => navigate('/products')}>
            <span className="nav-icon" aria-hidden>
              <svg viewBox="0 0 24 24" className="nav-icon-svg">
                <path d="M7 8V7a5 5 0 0 1 10 0v1h3v13H4V8h3zm2 0h6V7a3 3 0 0 0-6 0v1zm-3 2v9h12v-9H6z" />
              </svg>
            </span>
            <span className="nav-label">Shop</span>
          </button>
          {showContact && (
            <button type="button" className="topbar-nav-link" onClick={() => scrollToSection(contactSectionId)}>
              <span className="nav-icon" aria-hidden>
                <svg viewBox="0 0 24 24" className="nav-icon-svg">
                  <path d="M3 6h18v12H3V6zm2 2v.35L12 12.8l7-4.45V8H5zm14 8v-5.3l-7 4.45-7-4.45V16h14z" />
                </svg>
              </span>
              <span className="nav-label">Contact</span>
            </button>
          )}
          {showAccount && (
            <button type="button" className="topbar-nav-link" aria-label="Account">
              <span className="nav-icon" aria-hidden>
                <svg viewBox="0 0 24 24" className="nav-icon-svg">
                  <path d="M12 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 12c4.42 0 8 2.01 8 4.5V21H4v-1.5C4 17.01 7.58 15 12 15z" />
                </svg>
              </span>
              <span className="nav-label">Account</span>
            </button>
          )}
          <TopbarCartButton />
        </nav>
      </div>
    </header>
  )
}
