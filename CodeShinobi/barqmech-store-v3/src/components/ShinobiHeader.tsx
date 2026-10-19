import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { ProductSearch } from '@store/components/ProductSearch.tsx'
import { categorySlugs, featuredCategories, finalLogoUrl, slugToCategory } from '../data/catalog.ts'
import { ShinobiCartButton } from './ShinobiCartButton.tsx'

type ShinobiHeaderProps = {
  overVideo?: boolean
}

export function ShinobiHeader({ overVideo = false }: ShinobiHeaderProps) {
  const location = useLocation()
  const onProducts = location.pathname.startsWith('/products')
  const categoryParam = new URLSearchParams(location.search).get('category')
  const activeCategorySlug = categoryParam && slugToCategory[categoryParam] ? categoryParam : null
  const [scrolled, setScrolled] = useState(false)
  const wasScrolled = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      const next=window.scrollY>56
      if(next!==wasScrolled.current){wasScrolled.current=next;setScrolled(next)}
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.pathname])

  const glass = !overVideo || scrolled

  return (
    <header className={`shinobi-header${glass ? ' shinobi-header--solid' : ' shinobi-header--over-video'}`}>
      <div className="shinobi-header__row">
        <div className="shinobi-header__left">
          <Link to="/" className="shinobi-icon-btn" aria-label="Home">
            <svg viewBox="0 0 24 24" className="shinobi-icon-btn__svg" aria-hidden>
              <path
                fill="currentColor"
                d="M12 3.2 3 11h2.2v8.5h5.1V14h3.4v5.5h5.1V11H21L12 3.2z"
              />
            </svg>
            <span>Home</span>
          </Link>
          <Link to="/#contact" className="shinobi-icon-btn" aria-label="Contact">
            <svg viewBox="0 0 24 24" className="shinobi-icon-btn__svg" aria-hidden>
              <path
                fill="currentColor"
                d="M3 6h18v12H3V6zm2 2v.35L12 12.8l7-4.45V8H5zm14 8v-5.3l-7 4.45-7-4.45V16h14z"
              />
            </svg>
            <span>Contact</span>
          </Link>
        </div>

        <Link to="/" className="shinobi-logo" aria-label="BarqMech home">
          <img
            src={finalLogoUrl}
            alt=""
            className="shinobi-logo__mark"
            width={148}
            height={44}
            decoding="async"
          />
          <img
            src="/brand/barqmech-wordmark.png?v=2"
            alt="BarqMech"
            className="shinobi-logo__wordmark"
            width={280}
            height={48}
            decoding="async"
          />
        </Link>

        <div className="shinobi-header__search">
          <ProductSearch className="shinobi-search" />
        </div>

        <nav className="shinobi-header__actions" aria-label="Primary">
          <Link to="/products" className={`shinobi-nav-link${onProducts ? ' is-active' : ''}`}>
            Shop
          </Link>
          <Link to="/#contact" className="shinobi-nav-link">
            Contact
          </Link>
          <Link to="/products" className={`shinobi-icon-btn shinobi-icon-btn--shop${onProducts ? ' is-active' : ''}`} aria-label="Shop">
            <svg viewBox="0 0 24 24" className="shinobi-icon-btn__svg" aria-hidden>
              <path
                fill="currentColor"
                d="M7 8V7a5 5 0 0 1 10 0v1h3v13H4V8h3zm2 0h6V7a3 3 0 0 0-6 0v1zm-3 2v9h12v-9H6z"
              />
            </svg>
            <span>Shop</span>
          </Link>
          <ShinobiCartButton />
        </nav>
      </div>

      <nav className="shinobi-cat-nav" aria-label="Categories">
        <Link to="/products" className={`shinobi-cat-link${onProducts && !activeCategorySlug ? ' is-active' : ''}`}>
          All
        </Link>
        {featuredCategories.map((category) => {
          const slug = categorySlugs[category]
          return (
            <Link
              key={category}
              to={`/products?category=${slug}`}
              className={`shinobi-cat-link${activeCategorySlug === slug ? ' is-active' : ''}`}
            >
              {category}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
