# V3 stylesheet ownership

`main.tsx` imports only `storefront.css`. Its ordered imports own the public storefront cascade. The isolated lazy admin route imports `admin/styles.css`, preserving admin.css then listings.css then surfaces.css order without downloading those rules on ordinary storefront visits. Its selectors remain scoped to administration. Keep both entry orders intentional.

| File | Edit here for |
| --- | --- |
| `store-base.css` | V3-owned shared commerce/reset baseline, copied from `store/src/index.css` on 2026-10-17 with unused admin chrome removed. Changes in the production app's CSS no longer silently change V3. Shared token definitions are still imported explicitly. |
| `../shinobi.css` | Shell, header, hero and base listing structure. Poster/video occupy the same absolute layer. |
| `../theme.css` | Blue/cream/ink palette tokens. |
| `../storefront-commerce.css` | Listing, PDP, checkout, receipt and cart surfaces. |
| `../pages/home.css` | Home section layout, mosaic, responsive composition and palette. Replaces the four former home stylesheets, retaining their cascade order. |
| `../components/metal-playground.css` | Footer shape overlay. |
| `../refinement.css`, `../commerce-gallery.css` | Shared finish/edge rules and commerce gallery/drawer refinements. |
| `../typography.css`, `../studio-motion.css` | Local font faces/type tokens and opt-in motion/reduced-motion behavior. |
| `../surface-patterns.css` | Shared responsive wave paint variables and home/commerce surfaces. Home header artwork fades through data-home-section; commerce viewport artwork continues behind transparent navigation. Last public import. |
| `../admin/surfaces.css` | Lazy admin-only wave surfaces and translucent field/editor/top-bar treatment; reuses shared paint variables. |
| `../admin/admin.css` | Lazy admin/styles.css entry only: V3 studio desk/login, scoped to a-root and a- classes. |
| `../admin/listings.css` | Lazy admin/styles.css entry only: Orders/Listings navigation and responsive forms. Public catalog-live-notice rules live in refinement.css so errors stay styled before any admin visit. |

Find the existing component rule and its breakpoint before changing it. Update that owner rather than appending another global override. Keep necessary browser fallbacks, `!important` precedence, selector specificity and media conditions intact. V1/V2 and shared production CSS are preserved.

The 2026-10-17 cleanup removed 110 unused legacy rules and 298 superseded declarations, including obsolete intro-loader/marquee/mosaic styling; merged adjacent compatible rules; and removed empty blocks. It does not claim every selector is minimal or every old component in shared React source has been deleted. A conservative cleanup preserves working breakpoints and interactions.

Evidence: root `docs/V3-CSS-CONSOLIDATION.json` records sizes/removal counts. Production build validates asset paths and CSS parsing. Browser checks compare sampled computed styles before/after at desktop/mobile and review commerce/home layouts. Computed-style parity is not a full cross-browser visual regression suite.
