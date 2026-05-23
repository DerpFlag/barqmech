import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { categorySlugs } from '../data/catalog.ts'
import { useCatalogProducts } from '../catalog/CatalogProvider.tsx'
import { catalogImageUrl } from '../catalog/productImages.ts'
import { buildProductSearchPath, PREVIEW_LIMIT, searchProductsByName } from '../lib/searchProducts.ts'

type ProductSearchProps = {
  /** Controlled value (e.g. on /products/search). */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  onChange?: (query: string) => void
  className?: string
}

export function ProductSearch({ value, defaultValue = '', onChange, className = '' }: ProductSearchProps) {
  const products = useCatalogProducts()
  const navigate = useNavigate()
  const location = useLocation()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [mobileLayout, setMobileLayout] = useState(false)
  const [mobileDropdownStyle, setMobileDropdownStyle] = useState<CSSProperties>({})

  const isControlled = value !== undefined
  const [internalQuery, setInternalQuery] = useState(defaultValue)
  const query = isControlled ? value : internalQuery

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const isSearchPage = location.pathname === '/products/search'
  const showDropdown = open && !isSearchPage && query.trim().length > 0

  const results = useMemo(() => searchProductsByName(products, query), [products, query])
  const preview = results.slice(0, PREVIEW_LIMIT)
  const hasMore = results.length > PREVIEW_LIMIT

  const setQuery = useCallback(
    (next: string) => {
      if (!isControlled) setInternalQuery(next)
      onChange?.(next)
      setActiveIndex(-1)
    },
    [isControlled, onChange],
  )

  const goToFullSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim()
      if (!trimmed) return
      setOpen(false)
      navigate(buildProductSearchPath(trimmed))
    },
    [navigate],
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    goToFullSearch(query)
  }

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 920px)')
    const sync = () => setMobileLayout(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const syncMobileDropdownPosition = useCallback(() => {
    const input = inputRef.current
    if (!input) return
    const rect = input.getBoundingClientRect()
    const inset = Math.max(10, Math.min(14, window.innerWidth * 0.032))
    const top = Math.round(rect.bottom + 6)
    const maxHeight = Math.max(120, window.innerHeight - top - inset)
    setMobileDropdownStyle({
      position: 'fixed',
      top,
      left: inset,
      width: window.innerWidth - inset * 2,
      maxHeight,
      zIndex: 500,
    })
  }, [])

  useLayoutEffect(() => {
    if (!showDropdown || !mobileLayout) return
    syncMobileDropdownPosition()
    const onReflow = () => syncMobileDropdownPosition()
    window.addEventListener('resize', onReflow)
    window.addEventListener('scroll', onReflow, true)
    return () => {
      window.removeEventListener('resize', onReflow)
      window.removeEventListener('scroll', onReflow, true)
    }
  }, [showDropdown, mobileLayout, syncMobileDropdownPosition, query])

  useEffect(() => {
    if (!showDropdown) return
    const onDocPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [showDropdown])

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || preview.length === 0) {
      if (event.key === 'Enter') return
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => (i + 1) % preview.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => (i <= 0 ? preview.length - 1 : i - 1))
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      const item = preview[activeIndex]
      if (item) {
        setOpen(false)
        navigate(`/products/${categorySlugs[item.category]}/${item.slug}`)
      }
    }
  }

  const dropdownPanel = showDropdown ? (
    <div
      ref={dropdownRef}
      className={`product-search-dropdown${mobileLayout ? ' product-search-dropdown--fixed' : ''}`}
      id={listId}
      role="presentation"
      style={mobileLayout ? mobileDropdownStyle : undefined}
    >
      {preview.length === 0 ? (
        <p className="product-search-empty">No products match &ldquo;{query.trim()}&rdquo;</p>
      ) : (
        <ul className="product-search-list" role="listbox">
          {preview.map((item, index) => {
            const thumb = item.images[0]
            return (
              <li key={item.id} role="option" aria-selected={index === activeIndex}>
                <Link
                  to={`/products/${categorySlugs[item.category]}/${item.slug}`}
                  className={`product-search-hit ${index === activeIndex ? 'active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  {thumb ? (
                    <img
                      src={catalogImageUrl(thumb, 'thumb')}
                      alt=""
                      className="product-search-hit-thumb"
                      width={48}
                      height={48}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="product-search-hit-thumb product-search-hit-thumb--empty" aria-hidden />
                  )}
                  <span className="product-search-hit-body">
                    <span className="product-search-hit-title">{item.title}</span>
                    <span className="product-search-hit-meta">
                      <span className="product-search-hit-category">{item.category}</span>
                      <span className="product-search-hit-price">{item.price}</span>
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      {hasMore && (
        <button
          type="button"
          className="product-search-more mosaic-discover-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => goToFullSearch(query)}
        >
          Show more ({results.length} results)
        </button>
      )}
      {preview.length > 0 && !hasMore && results.length > 1 && (
        <button
          type="button"
          className="product-search-more mosaic-discover-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => goToFullSearch(query)}
        >
          View all {results.length} results
        </button>
      )}
    </div>
  ) : null

  return (
    <div ref={rootRef} className={`product-search ${className}`.trim()}>
      <form className="topbar-search product-search-form" role="search" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="search"
          name="q"
          className="topbar-search-input product-search-input"
          placeholder="Search products by name…"
          autoComplete="off"
          aria-label="Search products by name"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? listId : undefined}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            if (query.trim()) setOpen(true)
          }}
          onKeyDown={onInputKeyDown}
        />
        <button type="submit" className="topbar-search-icon product-search-submit" aria-label="Search">
          <svg viewBox="0 0 24 24" className="nav-icon-svg" aria-hidden>
            <path d="M10.5 3a7.5 7.5 0 0 1 5.95 12.08l4.24 4.24-1.42 1.42-4.24-4.24A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z" />
          </svg>
        </button>
      </form>

      {mobileLayout && dropdownPanel
        ? createPortal(dropdownPanel, document.body)
        : dropdownPanel}
    </div>
  )
}
