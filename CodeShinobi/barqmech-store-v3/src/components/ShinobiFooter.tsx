import { Link, useLocation } from 'react-router-dom'
import { MetalPlayground } from './MetalPlayground.tsx'
import { SpringWordmark } from './StudioMotion.tsx'
import { categorySlugs, featuredCategories, finalLogoUrl, storefrontEmail, storefrontPhoneDisplay, storefrontPhoneTel, storefrontFacebookUrl, storefrontLinkedInUrl } from '../data/catalog.ts'

export function ShinobiFooter({ home = false }: { home?: boolean }) {
  const onHome = useLocation().pathname === '/'
  if (home) return (
    <footer className="metal-footer" id="footer" data-home-footer data-section-theme="denim" aria-label="Footer">
      <div className="metal-footer__top"><p>Laser-cut metalwork.<br />Made to order in Pakistan.</p><a href={onHome ? '#home' : '/'} className="metal-footer__up" aria-label={onHome ? 'Back to the first section' : 'Back to home'}>↑</a></div>
      <SpringWordmark />
      <div className="metal-footer__links"><nav aria-label="Footer shop"><Link to="/products">Shop everything</Link>{featuredCategories.map((category) => <Link key={category} to={`/products?category=${categorySlugs[category]}`}>{category}</Link>)}</nav>
        <div><a href={`mailto:${storefrontEmail}`}>{storefrontEmail}</a><a href={`tel:${storefrontPhoneTel}`}>{storefrontPhoneDisplay}</a></div>
        <nav aria-label="Social links"><a href={storefrontFacebookUrl} target="_blank" rel="noreferrer">Facebook ↗</a><a href={storefrontLinkedInUrl} target="_blank" rel="noreferrer">LinkedIn ↗</a></nav></div>
      <MetalPlayground />
      <div className="metal-footer__bottom"><span>© {new Date().getFullYear()} BarqMech</span><span>Cut with precision. Finished your way.</span></div>
    </footer>
  )
  return (
    <footer className="shinobi-footer">
      <div className="shinobi-footer__inner">
        <div className="shinobi-footer__brand">
          <img
            src={finalLogoUrl}
            alt="BarqMech"
            className="shinobi-footer__logo"
            width={148}
            height={44}
            loading="lazy"
            decoding="async"
          />
          <p>Precision laser-cut metal art, panels, and custom fabrication — made to order in Pakistan.</p>
        </div>
        <div className="shinobi-footer__col">
          <h4>Shop</h4>
          <ul>
            <li>
              <Link to="/products">All products</Link>
            </li>
            {featuredCategories.map((category) => (
              <li key={category}>
                <Link to={`/products?category=${categorySlugs[category]}`}>{category}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="shinobi-footer__col">
          <h4>Contact</h4>
          <ul>
            <li>
              <a href="/#contact">Send a message</a>
            </li>
            <li>
              <a href={`tel:${storefrontPhoneTel}`}>{storefrontPhoneDisplay}</a>
            </li>
            <li>Cash on delivery nationwide</li>
          </ul>
        </div>
      </div>
      <MetalPlayground />
      <p className="shinobi-footer__copy">© {new Date().getFullYear()} BarqMech. Crafted with precision.</p>
    </footer>
  )
}
