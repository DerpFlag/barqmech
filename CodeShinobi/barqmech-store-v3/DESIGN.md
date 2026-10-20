# V3 motion study — 2026-10-17

### 2026-10-19 — Compact admin and Listings section

User revoked the locked no-page-scroll requirement for the workspace. Orders now uses a short heading/compact metrics; Orders/Listings navigation replaces the tall greeting. Long order and listing forms use ordinary document flow. Listings has a searchable status-filtered thumbnail list and a focused editor for metadata/images/designs/sizes/PKR pricing. One visible design at a time keeps the1007-design panel manageable. Strong labels, derived area display, disabled-first new listings and reversible archive replace destructive removal. Blue/cream/fonts/logo retained. Login can still fit the desktop viewport. Demo notices are compact and distinguish memory edits from actual local/server persistence. Desktop runtime checked; this turn's viewport override did not resize editor tabs, so mobile runtime is not claimed verified.

### 2026-10-19 — Studio desk admin

Desktop admin now fits the viewport at widths above900px/heights at least560px: compact header/heading/stats, flexible order area, independent list/detail scrolling. Login uses the same bounded desktop frame. No page overflow is hidden to conceal content; small/mobile and heavily zoomed windows retain ordinary document flow for readability. Desktop1280×720 and1100×600 measured without document overflow.

V3 /admin uses a separate blue/cream workspace with the existing local DM Sans/Archivo Black fonts. A split blue login panel leads to order overview, search/status filters, a master list and focused detail sheet; mobile stacks list/details with a bounded vertical list. Strong labels, restrained borders, clear selected states and saved totals prioritize order work. No storefront physics, section snapping or scroll-ink on admin. Scoped a- CSS follows the ordered stylesheet entry. Fictional sample preview is dev-only and labelled; real records require the existing cookie APIs. See src/admin/README.md for contracts and unverified live acceptance checks.

V3 is an isolated copy of V2 on localhost:5177. The inherited design history below describes earlier iterations; V2 itself is preserved.

Reference: [Two26 Studio](https://two26.studio/), inspected live alongside the user's six screenshots. Adapt motion principles, not their illustrations, branding, wording or orange palette. BarqMech retains its blue #5aa7ff, cream and light-blue surfaces, existing hero video, real product imagery and mosaic.

- Heading/card entrances: one small overshoot, 850ms native Web Animations, 65ms sibling stagger. Footer letters use1000ms/45ms and replay after leaving view. Reading text settles without permanent transform layers.
- Ribbon: SVG text follows a curved blue baseline; 28 SVG units/second plus scroll contribution. No pause control (user request); right-to-left SVG path/text-mask reveal on entry, offscreen/background/reduced-motion sleep. Band reaches actual shell edges with slice fitting.
- Narrative: short genuine product/finish copy; blue-to-ink words follow viewport progress in both directions. No invented metrics or testimonials. Workshop crossing path removed; a12px desktop/8px mobile continuous page-edge line follows scroll and changes blue/cream, away from text.
- Liquid reveal: a solid blue or cream SVG brush is followed350ms later by a second brush mask exposing alternate photography. Timing950/1050ms; pointer leave reverses at1.3x. Original paths, same two-stage technique found in the reference inline source; native Web Animations, no new dependency. Collection and mosaic both use it, with keyboard focus support and image-load guard. Captions remain above the effect. Commerce product colors and buying controls stay steady.
- Footer: same blue wordmark, spring letters and quiet concentric-line backdrop; existing draggable metal shapes retained.

Mobile keeps native vertical scrolling and stacked sections. Desktop section/category gestures remain intact. Reduced motion skips arrivals and settles full-color text/path; live preference emulation remains untested. Build and five cart regression tests pass; desktop1280x720/mobile374x668 screenshots and overflow checks completed. No measured frame-rate/Core Web Vitals claim or deployment.

---

## Inherited V2 design history

# V2 storefront design decisions

## Commerce gallery and cart — 2026-10-17

Keep the home's cream/blue/black theme, but make shopping feel like an open gallery. Remove floating Catalog text and the duplicate category header on listing routes; use a compact title, one category index and a native filter/sort disclosure. Use24 products per full page,4 columns on wide desktop,3 on tablet and2 on phone. Remaining products on the final page stay real rather than being hidden or duplicated. Exclude image-less records before paginating. Native product photography sits directly on the page; remove blue backing, padding and frames from PDP/listing images. Original image pixels, borders and watermarks remain unchanged.

PDP choices use clear label/value rows, subdued selected treatments and a full-width Add to cart action above secondary actions. Support and details get quiet rules rather than large blue blocks. Keep shared pricing/product logic and genuine product imagery.

Cart becomes a cream,500px desktop/full-width mobile drawer: stable header/count, geometric centered SVG X in44px circle, concise size/finish/add-on metadata,44px quantity buttons, contained scrolling and anchored totals. Empty state offers collection browsing. Focus stays in the dialog and restores on dismissal. V2 owns this context/drawer; a V2-only alias redirects shared PDP/checkout imports without editing production or V1.

Cart state now uses same-origin operation persistence and storage-event updates, preventing stale whole-cart replacement. Tests cover competing tabs, migration, removals/quantities, limits and storage errors. Live two-tab/closed-tab/checkout checks and desktop/mobile geometry verified; final build passes. Native device/performance and long-lived journal compaction remain unverified; see architecture log and docs/previews/v2-cart-refined-*, v2-gallery-* and v2-product-open-*.

## V2 finish and motion pass - 2026-10-16

V1 source is frozen; this directory is the active V2. Preserve hero composition/colors, the approved palette, angled collection, mosaic slots, desktop-only in-section category sequence and footer overlay. Improve finish through native edges (8px controls, 14px panels), subtle borders, stable text surfaces, General Sans supporting copy and retained Clash Display headings. Small navigation >=12px; mobile supporting paragraphs15px and fields16px. Avoid blanket smoothing/GPU hacks; do not claim a universal rasterization fix.

V2 font declarations updated at source; refinement.css defines the finish grammar. No dependency added. Fontshare serves General Sans/Clash; unused Google family requests removed. Listing photo timers stop; mosaic labels stay stationary and slides wait for decoded neighboring images.42 category sources audited;29 survive dimension thresholds without editing originals. Keep2000ms cycling and supplied MP4s; source video resolution remains a constraint.

One520ms animation clock replaces native smooth-scroll plus750ms cooldown. Mobile wheel/key input remains native; desktop category changes have a240ms guard with no redundant page scroll. Hero decoder pauses offscreen/hidden/reduced-motion; commerce bypasses the hero loader. Footer damping uses elapsed time; circle-hull limitations remain.

Actual validation/screenshots in living architecture. No real order/contact/booking submitted, shared production/API/schema edits or deployment. Next: user visual review and native-browser performance evidence.

## Historical V1 commerce continuity — 2026-10-16

Extend the approved home language to all customer routes: warm cream #fff5e6, blue panel #d9eaf5, near-black ink #171b20, hero blue #5aa7ff actions. Shared palette now lives in theme.css; storefront-commerce.css scopes new-app presentation. Home remains cinematic; commerce removes fixed video for readable catalog/configuration/forms. Bold Clash Display hierarchy, Segoe UI supporting text, generous contained photos, understated borders, clipped-corner primary buttons, blue selected options and clear native inputs. All routes reuse the home-style blue footer and metallic bottom overlay.

Shop/search use consistent cards and usable mobile filters; PDP keeps actual size/finish/add-on data and image controls; cart/checkout emphasize quantities and COD totals; confirmation uses an order-code treatment and clear actions. Mobile stacks content naturally with16px fields and44px quantity controls. Empty/search/incomplete-link states match. Preserve all shared store/src pricing/cart/order handlers and production styles; overrides require the new shell, including body-scoped portalled search suggestions. Only local listing headings strip redundant bracket prefixes. No business-policy copy changed.

Evidence: final build passed; desktop1440 and phone390 visual review and interaction checks recorded in living architecture. Synthetic code000000 used only to inspect confirmation display; no actual order/email/booking submitted. Checkout validation and arithmetic checked; test cart removed. Router-state amount/email confirmation branch styled from source; native device/full automated accessibility/performance and live backend order checks remain unverified. See docs/previews/commerce-* artifacts.

## Footer metal overlay — 2026-10-16

Inspired by Evermark’s movable pieces: original gold/black/silver hexagons, washers, stars and frames. User correction: preserve the exact pre-playground footer layout. No caption/reset/floor line or reserved stage; restore original wordmark size and gaps. Absolute transparent overlay fills the existing footer and settles shapes at the bottommost edge, in front of text if overlapping. Only the draggable pieces accept pointer input. Nine wide/six narrow; drag/throw and keyboard arrows/Space/Enter remain, plus visibility/reduced-motion lifecycle. No dependency. Circle hulls approximate silhouettes. Build and clean narrow preview checked; mobile footer matches original457.46px height.

## Shop the edit scrolling — 2026-10-16, desktop only

Keep one edit chapter/product stage. At widths >=768px, wheel/key direction at content boundaries cycles Islamic → Artwork → Panels → Custom & utility in place, then continues to workshop; upward gestures reverse. Below768px, scrolling never changes categories: retain manual category buttons and normal mobile page scrolling. No custom touch handlers. Hide the desktop scroll/progress hint on mobile. CTA/products track category state; seven top-level destinations remain. Build and desktop/mobile wheel distinction verified; native hardware untested.

## Current palette and CTA rules — 2026-10-16

Alternate from blue hero: cream collection, light-blue mosaic, cream product edit, light-blue workshop, cream contact, light-blue footer. Cream #fff5e6, blue surface #d9eaf5, black ink #171b20, charcoal supporting text #41464c; action/selection blue references hero --bm-accent-glow #5aa7ff, with matching hover and near-black labels for readability. Remove pink/red from active UI. Header follows cream/sky/denim tokens (denim aliases same blue surface). Hero heading/video/accent blues retained, but at user’s new explicit request its two CTA links now share cut-button polygon shape, arrow/type and action blue. Home All has no active highlight; all-products route still has accurate active navigation. No composition changes. Build passed and desktop1440/mobile319 hero/full-page screenshots saved under docs/previews/alternating-palette-*.png.

2026-10-16 position refinement: swap Stairs & Railings and Doors, Dividers & Gates in the existing third-section mosaic slots on desktop/mobile. Preserve fixed grid structure and each category’s own gallery/link.

## Collection media — 2026-10-16

Second-section category previews now use user-supplied videos from src/assets/collection, mapped Islamic/Artwork/Panels/Custom & utility to their existing category links. Preserve full-frame contain fit, angled desktop composition and upright mobile grid. Videos loop silently inline while visible, pause offscreen/hidden/reduced motion, and retain category photographs as posters. Collection arrows use deep red #a32e32 to match Explore the shop. Product-edit collection button/selection stay blue. Hero and mosaic remain unchanged. Build passed and browser playback/fit verified at1440×900 and390×844; native-device autoplay/reduced-motion paths remain unverified.

## Superseded palette — 2026-10-16: blue, cream and red

Warm, precise, cohesive. Hero colors remain unchanged. Home-palette.css follows home-responsive.css and owns colors only, at every viewport width. Collection/workshop use cream #fff5e6; mosaic/contact soft red #f3c5bf; product edit light blue #d9eaf5; footer denim #a9c9e9. Main ink #163858, muted #435767, primary actions #a32e32 with cream-white labels, secondary/selected controls and the product-edit “Shop this collection” CTA #245b87 (navy hover). Use navy/blue borders and focus, and red errors. Header follows semantic section theme cream/rose/sky/denim. Original hero blue and actual material preview swatches remain unchanged. Layout, mosaic geometry, two-second images and responsive flow preserved. Other commerce routes keep their dark blue/white theme.

Validation: production build passed; desktop1440 and mobile390 visual review, narrow319 bounds check. Main text/button contrast calculations exceed4.5:1; form boundaries exceed3:1. Not a complete accessibility audit. Artifacts: ../../docs/previews/palette-desktop-full.png and palette-mobile-full.png.

## Previous responsive revision — 2026-10-16: fixed mosaic and dedicated mobile layout

The user rejects the shrinking-photo desktop mosaic and compressed mobile lower sections, and supplies barqmech_old as the reference. The mobile hero is approved and unchanged. Desktop sections outside the mosaic retain their styling.

**Mosaic:** gallery pause/resume button removed at the user’s request; automatic reduced-motion/visibility handling remains.  older source confirms fixed cell geometry. Keep the reference desktop arrangement and cycle all category photos at 2000ms. Each slide fills its cell with a single cover-cropped photo, removing the decorative backdrop at the user’s follow-up request. Edge cropping is intentional to fill each tile. Labels stay on the fixed cell. This replaces the loose natural-ratio slide sizing. No Discover visuals return. Provided old source is read-only reference, not a runtime dependency.

**Mobile <=767px:** home-responsive.css owns lower-home layout after earlier styles. Natural vertical content flow replaces viewport-height compression; touch proximity snap is disabled. Upright 2×2 collection photos, larger two-column product images and category controls, aligned workshop actions with separate full-size pattern/controls, one-column 16px inquiry fields, clear booking panel and natural-height blue footer. Old app’s two-column mosaic areas are reused with generous rows. Compact arrow navigation avoids the old wide floating pill; it hides at footer. No mobile hero selectors are changed.

Booking now brings its form below the header on mobile, preserves message drafts and keeps existing Gmail/Calendly behavior. Footer no longer forces an empty full-screen blue area; document-end recognition supports its shorter natural height and preserves end alignment on resize.

Evidence: build passes; screenshots for all mobile chapters at 390×844; 319×668 and 430×932 content bounds checks; desktop 1440×900 fixed-cell check. Verified category route changes, Silver/backlight, demo validation/focus/draft preservation and zero movement on extra footer scroll. Native hardware, automated accessibility/performance and actual booking/contact/order submission remain untested. Screenshots: ../../docs/previews/mobile-rebuild-full-page.png and desktop-mosaic-restored-fixed-cells.png (plus individual mobile-rebuild-* views).

## Earlier refinement — 2026-10-16: rotating complete category photographs

User requests all category photos rotating about every second, with the complete image fitted to the available tile. Keep the reference mosaic positions and title-only links; replace cover cropping with whole-photo fitting.

- Local MosaicSlideshow.tsx adapts the older storefront’s visibility-aware rotating stack without editing production/shared code. Each of seven tiles cycles its own image list, at 1000ms with a 220ms opacity fade. Reference-matching photo remains first in each reordered sequence.
- Fit scale is min(tile width / natural width, tile height / natural height). CSS size-container units + each photo’s natural aspect ratio size its frame. The full image and proportions remain visible; hover scaling removed. Transparent spare space is intentional for mixed ratios.
- Caption and gradient travel with each fitted photo, avoiding dark rectangles in letterboxed tile space. One pause/play control affects all tiles. Offscreen/hidden-page and reduced-motion paths suspend timers; reduced motion also removes fades.
- Inspected old App.tsx and RotatingImageStack.tsx. No upstream packages or shared files changed. All 42 source photos remain in their own categories (7/6/4/4/6/5/10).

Checks: production build passed; desktop/phone screenshots; observed all seven categories changing across samples; pause stability and resume; all images loaded; active-frame aspect ratios match sources within 0.0001 and stay inside tiles. Phone section fits available height with no horizontal overflow. Exact interval configured in source; precise browser timing observer unavailable in read-only evaluator. Reduced-motion/background-tab/native-touch/performance audits remain unverified.

## Earlier correction — 2026-10-16: supplied mosaic reference and footer endpoint

The user supplied a specific screenshot and rejected the loose source-ratio collage. That screenshot governs the new third-section structure. Orange surface remains; the reference's image arrangement and overlaid titles are reproduced with local assets. Discover visuals were subsequently removed at the user's request; tiles remain clickable.

- Dense desktop mosaic: large artwork upper left; doors above a tall lamp in the center; racks upper right; wide stairs plus Islamic below the lead, ceiling below racks. A 20×12 grid and 10px gaps reproduce these proportions. All tiles fill their boxes using object-fit:cover; this is intentional and supersedes earlier uncropped application guidance. Keep collection/product image behavior unchanged.
- Use local artwork 06, doors 01, racks 01, lamp 03, stairs 02, Islamic 01 and ceiling 09. Small source resolution, particularly the railing photo, remains a limitation inherited from the supplied assets.
- White readable titles sit over local dark gradients; Discover visuals have been removed. Whole tiles are category links, without nested buttons. Phone switches to a two-column mosaic; compact panel keeps the desktop arrangement with wrapped captions.
- Footer at 319×668 previously measured 542.9px for 529.2px available and left 13.2px after its section stop. Narrow padding/gap now fit. Final-section navigation clamps to document end when the footer fits; oversized chapters retain native content access.

Checks: production build; reference comparison at 1440×900; phone 390×844; compact 582×612; no horizontal document overflow. Phone wheel contact→footer, reverse, and extra-downward gesture checked. Extra downward movement is 0px at phone and original narrow-footer test size; remaining <0.5px geometry is browser rounding. No native touch, external submissions or deployment. Screenshots: ../../docs/previews/home-reference-mosaic-desktop.png and home-footer-scroll-end-narrow.png.

## Earlier correction — 2026-10-16: composition, first-screen fit and booking

User rejected the flat collection/collage and generic numbered process, and reported a hero scroll regression. Product edit and blue footer are approved and outside this correction. New rules live in home-composition.css after home-sections.css.

- **Hero:** use measured header height instead of fixed rem deductions; remove mobile copy-top/CTA offsets. Short desktop title size follows available height; blue/video/copy retained. Reserve space for the hint. On narrow phones the section dropdown hides only on hero, leaving two navigation arrows and a visible left-aligned hint.
- **Collection:** light blue remains. Headline and one concise subtitle form a single left-aligned block; shop CTA at right. Frameless photos hang at -6/+5/-3/+6 degrees, with deliberate spacing and straightening on hover/focus. Captions remain upright. No colored mats return.
- **Applications:** balanced asymmetric layout gives more space to smaller destinations; full photographs retain source ratios. Over-image type uses localized dark gradients and white text rather than bulky navy chips. Phone uses a separate two-column composition.
- **Workshop:** remove numbered circles. Three staggered typographic actions lead to the shop, select/focus the Silver finish, and contact. Keep the enlarged floating illustration and finish controls.
- **Booking:** one click switches the form area to a dedicated Gmail/Calendly panel. Opening focuses email without scrolling; close restores toggle focus. Message form stays mounted/hidden to preserve draft values. Errors are associated with the input; appointment confirmation is explicitly completed on Calendly. External scheduling endpoint/contract unchanged.

Reviewed desktop/laptop/phone/compact screenshots and refined twice. Actual first wheel transition confirmed at 1280×720 and 319×668, with hero content/hint fitting. Checked booking toggle/validation/focus/draft preservation and workshop action. Build passes. No external appointment, contact/order submission, deployment or native touch/automated accessibility audit performed. Product lengths can still require native scrolling on small windows; no content clipping added.

## Earlier revision — 2026-10-16: open imagery and readable copy

- Collection surface is light blue #d1eaff with deep-blue controls. Footer is a distinct denim blue #91b9e0 with navy #173e6b wordmark/controls. Header and chapter controls follow sky/denim theme attributes. Orange applications, peach products, lilac workshop and citron inquiry remain.
- Remove colored backing mats/padding from category, application and product images. Photos retain their own embedded backgrounds and full proportions; no raster editing or background removal applied. Category photos get more vertical space. Application collage places a large square artwork left and tall lamp right; smaller applications sit between. CSS size containers and known source ratios make overlay labels follow actual image edges. White semibold/bold text on near-opaque navy badges stays readable across photos.
- Pattern study floats directly on the lilac section, enlarged from an 88% drawing within a 42svh stage to a full-stage drawing in 48svh (desktop). Caption moves below it; finish/backlight behavior retained.
- Keep display headings in Clash Display. Home supporting copy uses Segoe UI/Arial, weight 600, with larger small labels and prices at 700. Body font and control changes are home-scoped; shared/production styles untouched.
- Preserve section rhythm via spacing adjustments, including phone/short-panel layouts. Content still grows naturally on exceptionally narrow/short screens.

Evidence: production build passed; browser review at 1440×900, 390×844, 582×612 and narrow 319×668. No horizontal document overflow at the three main test sizes; all lower chapters fit their available height at those sizes. Checked transparent computed backing colors, supporting font/weight, category routes and finish/backlight control state. Native touch, automated accessibility/performance audits and form submission remain untested. New screenshots use `../../docs/previews/home-open-images-*.png`.

## Earlier refinements — 2026-10-15, following positive user feedback

The user likes the bright direction and requested specific changes. Hero composition/video stay intact; its original blue CTA (#2d76d9) and bright blue heading (#5aa7ff) are restored. Footer wordmark uses the same primary blue.

- **Palette continuity:** citron collection/custom work, orange applications/footer, peach-pink product edit with berry (#873a56) controls, light lilac (#e4d8f4) workshop with plum (#65487e) controls. Header/search/category/cart colors and chapter controls follow section theme state. Brand image pixels remain unchanged; wordmark blending adapts on light headers.
- **Applications:** asymmetric seven-image collage restores varied sizes. Landscape lead and tall lighting tile contrast with smaller application studies; every image remains contained. All tiles link to their existing catalog category. The wall image uses the 1188px source.
- **Product discovery:** image-led, numbered collection index replaces pills. All four categories stay visible, selection/counts are explicit, products reveal with a short stagger and the collection CTA stays synchronized. Desktop uses an index beside products; phone uses a 2×2 index above products. Native buttons support Tab/Enter and pressed state; a polite description announces selection. No automatic category rotation. Reduced motion removes product animation.
- **Readability:** custom-work headings, copy, links, labels and booking text use weight 600; field text uses 500.
- **Footer:** distribute content within the available dynamic viewport, reduce bottom padding to 24px, move chapter controls to the top of this chapter and keep the bottom line at its lower edge. Long content still grows naturally.

Research: [Codrops filterable product grid](https://tympanus.net/codrops/2015/06/16/filterable-product-grid/) informed image-led filtering/product staging; [W3C carousel accessibility guidance](https://www.w3.org/WAI/tutorials/carousels/) informed explicit user control and restrained motion. These are design references; no demo libraries/code were imported. V4 frontend-quality, component-craft and motion-animation guidance used.

Checked production build, desktop/phone/short-panel geometry, category click and keyboard switching, finish/backlight controls, themed header colors, wheel navigation, strip pause/resume and footer end geometry. No native touch-device, automated contrast/axe/performance audit or form submission performed. Screenshots: `../../docs/previews/home-refined-collage-desktop.png`, `home-refined-edit-desktop.png`, `home-refined-workshop-desktop.png`, `home-refined-footer-desktop.png`.

## Earlier bright revision — 2026-10-15 (superseded by refinements below)

**Brief:** keep the opening hero's layout and video; replace the lower sections completely. Use bright colors, deliberate motion, properly fitted images, and working section navigation through the footer. The previous navy/blue editorial treatment was rejected by the user and is historical, not an approved reference.

**Direction:** cut-paper, colorful, material. Citron and orange come from high-visibility workshop marks and finish samples; image framing follows each real photograph rather than cropping everything into a tile. Preserve the original hero's composition; its blue text/button accent becomes bright citron. Brand-logo pixels and the video are unchanged.

### Palette and typography

- Citron `#e7f5a0`: the collection surface.
- Hot orange `#ff8658`: application selector and full-screen footer.
- Peach `#f7c9ac`: product edit, with warmer image backing.
- Workshop green `#2b3525`: finish-preview surface.
- Ink `#252b20`: typography, buttons, and navigation.
- Bright accent `#edff7a`: hero CTA/type and navigation controls.
- Keep existing Clash Display and Space Grotesk. Remove the repeated uppercase eyebrow labels, section numbering, hairline separators, and isolated colored heading words used in the rejected revision.

### Composition and interaction

1. **Hero:** original content, layout and media; accent color only.
2. **Collection:** four distinct real-image samples with small angled matting, category names/counts and direct shop links. Full images remain visible using intrinsic dimensions and max-width/max-height. The substantial filled/outlined text loop runs continuously; hover does not pause it. Explicit pause/resume remains available.
3. **Applications:** one large uncropped room image and seven choices. Click a choice to replace the image with a short lateral transition; category link changes with it. No cropped mosaic of unrelated aspect ratios.
4. **Product edit:** four catalog products at a time, category filtering and fully contained original images. A second product image appears on hover where one exists. Display titles omit redundant category prefixes; actual slugs/prices remain unchanged.
5. **Workshop:** three actual ordering stages plus an original SVG pattern study. Silver/Gold/Black and backlight controls visibly change the illustration. It is explicitly illustrative, not a claim about a particular product's available options or final manufacturing result.
6. **Custom work:** large direct heading, plain phone/email/WhatsApp links and a compact underlined inquiry form. Demo booking remains available; same validation/API contracts as before.
7. **Footer:** orange, full-screen brand/navigation section. Included in the same scroll target list, dropdown and previous/next controls. Back-to-top anchor remains available.

### Scroll corrections

- Collect six main sections plus sibling `[data-home-footer]`; footer is no longer outside the system.
- Wheel handling no longer depends on a fine-pointer media query. Reduced-motion navigation is immediate; native touch uses proximity snap.
- Retain gesture threshold/inertia suppression, keyboard navigation, input/dialog/zoom exclusions and native scrolling for expanded/oversized content.
- When a section is aligned, resizing realigns it to the measured header. Do not relocate someone midway through taller content.
- Replace the six-number bar with compact previous/next buttons and a section selector that includes the footer.

### Guidance actually consulted

- Local V4 curator/workflow plus creative-direction, anti-AI-slop, component-craft, motion-animation, browser-QA and accessibility/testing standards.
- The catalog's upstream [Frontend Design guidance](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) was read on 2026-10-15 as a source reference, not installed or claimed as an executed external skill.
- Chose native React/CSS/SVG for these interactions; no new package, paid service or remote component runtime was needed.

### Evidence and limits

- Local image metadata inspected: source images include square, landscape and portrait sizes. Actual image dimensions were checked in the browser; no cover crop/stretch is used in lower-home imagery.
- The large wall/ceiling preview uses the available 1188×1118 `...-08.jpg` image, replacing a 183×275 first thumbnail in that view.
- Browser review at 1440×900, 1366×768, 390×844, and 582×612. All six lower destinations, including footer, fit the available height in those checks; no horizontal document overflow.
- Observed contact→footer with one wheel gesture (footer top aligned to header, document at end), then footer→contact with one reverse gesture.
- Strip transform changed while animation state was running; explicit pause and resume yielded paused/running states.
- Application selection changed the photograph and shop destination. Silver/backlight controls changed the accessible preview state.
- Production build passed; final verification evidence is maintained in the architecture document.
- Footer back-to-top and home→shop cleanup checked. Clean reload recorded no new console errors. Current screenshot files: `docs/previews/home-bright-collection-desktop.png` and `docs/previews/home-bright-footer-desktop.png` (repository-relative).
- Native touch hardware, reduced-motion emulation, cross-browser/automated axe/Lighthouse and side-effecting checkout/contact email tests remain unrun. Mechanical checks do not imply that the user has approved the new appearance.

---

## Historical revision — superseded, user rejected

## 2026-10-15 — Home chapters

**Direction:** architectural, material, editorial. Preserve the existing opening hero, typography, blue brand accent, and user-updated fixed video. Rework the lower home page as a guided catalog instead of repeated translucent card panels.

### Structure and visual system

1. Existing introduction/hero, unchanged copy and media.
2. Category index with four numbered previews, a large real product image, live collection counts, a shop link, and a restrained looping capability strip with a pause control.
3. Room/application collections: one lead photograph plus six smaller applications. Warm off-white surface provides contrast with the dark catalog.
4. Four selected products at a time; category buttons switch the edit rather than repeating four full grids.
5. A practical three-stage ordering explanation and Silver/Gold/Black finish study. No fabricated reviews, sales counts, or delivery guarantees.
6. Compact inquiry form; direct contact/social/demo options remain visible on desktop and expand from a disclosure on mobile.

- Reuse Clash Display, Space Grotesk, and JetBrains Mono. Large headings, restrained section metadata, hairline rules, square image framing.
- Colors: navy `#111a27`, deep background `#0c141f`, off-white `#e9e9e5`, pale blue `#8db9ef`. Metallic gradients appear only in the finish swatches.
- Spacing follows roughly 8px increments; common gaps 12/16/24/32px. Use responsive clamps where viewport height matters.
- Real existing catalog and category assets only. Some photographs include existing brand watermarks; no new imagery or third-party assets installed.

### Scroll and responsive contract

- Six sections. Each lower section fills the available viewport beneath the measured sticky header.
- Fine-pointer wheel gestures: accumulate a small threshold, advance one section, suppress remaining momentum in that gesture, and animate smoothly. A 180ms idle gap separates bursts; a 750ms transition guard avoids rapid skipping.
- PageDown/PageUp, arrows, and Space advance when focus is not in a control. Numbered buttons provide direct access.
- Native wheel behavior remains for expanded/taller content, inputs, dialogs, and zoom gestures. Footer remains reachable. No fixed-height clipping or nested scrolling panel.
- Coarse-pointer/touch and reduced motion use native proximity snapping with stop points. Reduced-motion navigation is immediate and strip animation disabled.
- Compact phone layout uses 2×2 categories/products; contact options collapse. Larger text, short windows, errors and expanded options may intentionally grow beyond a screen.
- Short panels between 500–640px wide use a compact side-by-side category/process composition, a horizontal product rail, and a two-column inquiry layout. This keeps the actual Codex preview panel at one screen per chapter without clipping content.
- Home-only listeners, root class, and measured-header property are cleaned up when leaving the home route.

### Reference and rejected patterns

Applied the local V4 pack's creative-direction, component-craft, frontend-quality, motion-animation, anti-AI-slop, and browser-QA guidance. No external upstream skill was installed or claimed as executed. Local BarqMech imagery and the existing hero were the visual references.

Avoided a new animation framework, generic glass-card repetition, decorative 3D, fabricated social proof, and scroll locking that hides content. Broad backend and old-store changes are outside this task.

### Evidence

- Production build passes after adding the missing TypeScript `@store/*` path mapping.
- Browser screenshot/DOM review at 1440×900, 1366×768, 390×844, and the actual 582×612 preview panel; no horizontal document overflow in those checks. All five lower chapters fit available screen height at the final phone and compact-panel checks.
- Observed wheel forward/back, PageDown, chapter buttons, category preview updates, featured category switching, strip pause, mobile contact disclosure, cart scroll lock, shop link routing, and home listener/class cleanup.
- Native touch-device behavior, reduced-motion emulation, automated axe audit, cross-browser testing, and contact/email submission remain untested. No deployment performed.

Keep this file and `../../docs/NEW-DESIGN-ARCHITECTURE.md` current as the design evolves.

### 2026-10-17 — Commerce loading states

Product routes include their code eagerly and use a V2 catalog-ready wrapper. Initial data waits use static cream/ink layout placeholders with busy semantics; no visible Loading copy or shimmer. Listing/search use the same grid treatment. Loaded catalog stays in the existing provider during internal navigation; fresh visits still fetch live data. No persistent price cache or shared production changes. Desktop/mobile cold entries and warm navigation checked; production build passed. Server-rendered data and measured latency remain separate work.

### 2026-10-17 correction evidence

Inspected actual reference card/marquee DOM and inline animation setup. Previous circle/color-blend implementation was removed. Final V3 build passed194 modules; desktop1280x720/mobile374x668 full-width and overflow checks passed. Keyboard reveal shows alternate photography after the solid color clears, and reverses fully on blur. Page line color/progress changes checked; no workshop trace or pause button remains. No measured FPS, real touch-device or reduced-motion runtime claim.

### 2026-10-17 — Curved ribbon and typography revision

Removed the rejected page-margin line. Band and text now share one measured parabola with central alignment, physical SVG coordinates and equal vertical spacing. The ribbon remains edge-to-edge and moves along its curve. Larger 750-weight scroll copy interpolates muted blue through bright blue into ink per character.

Local OFL Archivo Black and variable DM Sans replace external font requests as free alternatives to the reference’s commercial MD Nichrome / PP Neue Montreal. Licenses are retained beside assets in src/assets/fonts; no proprietary font files copied. typography.css owns the tokens and faces.

Build passed195 modules. Desktop1280x720 and mobile374x668 checked for ribbon alignment/overflow; desktop workshop/contact retain viewport fit. Partial scroll produced14 RGB shades. Physical display sharpness, real touch-device performance and reduced-motion runtime remain unmeasured. Previous page-line evidence is historical; that component is now removed.

### 2026-10-17 — Hero descender clearance

Brand/lede offset16px on desktop,10px on mobile; mobile CTA group follows10px while desktop actions retain their layout. Upper title and section flow stay fixed. Browser reviewed374x668 and1280x720; screenshots saved under docs/previews/v3-hero-spacing-*.png.

### 2026-10-17 — Home edit loading

Shop the Edit uses four static card placeholders on cold catalog/featured selection waits, following the existing responsive product grid. No visible loading text or shimmer; busy semantics and real error retry remain. Cold mobile transition and195-module build checked.


### 2026-10-17 — Delivery and catalog release preparation

Keep approved blue/cream visuals and motion; compression changes delivery copies, never masters. Hero has immediate poster, desktop/mobile silent fast-start sources and no percentage loader. Video respects visibility/data-saving/reduced motion. Product cards use responsive WebP sizes and one stationary image. Browse/home data is available synchronously from the GitHub catalog; per-product configuration is versioned and fetched on intent. Product/checkout waits retain quiet busy placeholders, no Loading copy. Corrected header wordmark blending and small-screen breadcrumb/back-button wrapping; short desktop hero fits beneath the header. Browser sampled desktop/mobile home/collection/PDP/cart/checkout; no actual order submitted. Historical CSS layer consolidation and full real-device/network/a11y validation remain open. See architecture section0 and launch runbook for backend/deployment boundaries.


### 2026-10-17 — Visible video and consolidated stylesheet ownership

Poster and moving hero video now occupy the same absolute rectangle; the previous normal-flow stack hid the playing video below the viewport.3G selects the compact source; explicit data-saving/2G/reduced-motion imagery remains. Visible playback checked at1280×720 and390×844.

The single entry `src/styles/storefront.css` owns import order; four home sheets are merged into `pages/home.css`. V3 owns a trimmed shared commerce CSS snapshot, protecting the production app from these edits. Removed110 unused legacy rules and298 superseded declarations; built CSS196308 bytes (~14% smaller), gzip35253.44 sampled home elements ×19 computed properties match before/after on desktop/mobile; mosaic/PDP/cart reviewed. See `src/styles/README.md` for ownership and root `docs/V3-CSS-CONSOLIDATION.json` for measurement. No visual redesign, dependencies, shared production CSS edits or deployment.


### 2026-10-18 — Reduce scroll-frame work

Preserve section/category behavior and blue/cream composition. Browser-native smooth scrolling replaces per-frame JS scroll writes; section geometry is cached, state/datasets update only at boundaries, progress uses a transform ref and scroll-ink only changes affected letters. The ribbon retains its measured curve, viewport-sized repetitions and paint containment. Hero darkening uses a static overlay; previous slight saturation filter removed to avoid full-screen video filtering. Footer physics sets sizes only on reset/resize.

Development-only motionDebug panel records callback timing, not true displayed FPS. Exploratory samples are variable;60fps is a target, not verified sustained performance. See living architecture for evidence/limitations. No new animation library or global GPU promotion was added.

### 2026-10-20 — Prioritize scrolling over decorative work

Preserve the blue/cream composition, curved ribbon, mosaics and desktop-only category sequencing. A shared passive scroll listener pauses decorative video/ribbon/shape simulation during movement and resumes after160ms quiet. Offscreen/background/reduced-motion/data-saving guards remain. No global will-change or new animation library. Stable memoized mosaic props keep section/category changes from rebuilding gallery arrays and restarting slideshow intervals; native-lazy stationary product cards no longer create visibility observers. Mosaic sizes match the winning desktop/mobile CSS slots.

Intent prefetch reuses successful summary checks for15s and skips no-op product/error state writes. Focus, visibility, broadcast, manual refresh and30s poll still force refresh; server checkout remains authoritative. Admin styles load with the lazy admin route; the public catalog error surface stays in the storefront CSS. Initial storefront CSS falls from about217.3kB to196.9kB; main JS increases slightly for the controls.43 tests and the production build pass. Sampled desktop/mobile home, categories, footer, product routes and local admin demo checked. Short development RAF samples remain variable; no sustained60fps claim or production deployment. Root docs/previews/v3-optimization-2026-10-20.json records evidence and limitations.

### 2026-10-20 — Seamless hero opening

The loading poster now represents frame0 of the actual compressed hero rather than a later logo shot at1s. Fallback image and video poster remain aligned in the same cover rectangle. Source preparation now extracts the delivery video's first frame without seeking. Poster31234 bytes; encoded video/approved layout unchanged. Build/artifact checks and local mobile reload/playback checked. Local change, not deployed.

### 2026-10-20 — First-screen scroll affordance

Scroll to explore is centered in both layouts and is one48px native button, with a small matching currentColor chevron below. A5px CSS bob invites downward movement; reduced motion disables animation. Text and arrow share header-aware navigation to the collection. Existing typography/color retained; label moved up to fit the chevron. Removed lower-right section navigation and its unused CSS/state; desktop chapter/category wheel behavior remains. Browser checked374×668 and1280×720, text/arrow/keyboard activation, clear spacing, control removal and product-route absence. Build passes; local only.

### 2026-10-20 — Receipt text contrast

Order confirmation now explicitly uses palette-ink for heading, supporting text, order code and totals instead of inherited legacy white/pale-blue text. Blue accents, cream page and light-blue amount surface stay consistent with commerce. Existing code badge is now applied and the intended38px total wins over paragraph sizing. Actual production-build receipt rendering checked with clearly labelled local sample data at1280×720 and390×844, including no-token error state; build passes. No order/email/production changes.

### 2026-10-20 — Local surface pattern study

User requested subtle themed detail on the cream/sky backgrounds. Added V3 src/surface-patterns.css as the final public CSS import: static machining arcs, a small perforation cluster and rounded rotated cut contours across the five home chapters. Blue linework uses low alpha and edge fades; mobile shapes scale down. Decorative pseudo-elements are pointer-transparent and isolated behind chapter content, hidden in forced colors and print. Hero, footer's original circles, commerce/admin, layout, fonts, APIs and data are unchanged. No new dependency, animation loop, media request or claim of improved FPS. V4 creative-direction/anti-slop/design/copy/accessibility guidance applied; upstream specialist skills unavailable, no installation needed.

Browser sampled 1280x800 and 390x844: collection arcs visible, contact form remains clear, workshop pattern sits behind the finish preview, no document horizontal overflow. All five chapter pseudo-elements compute pointer-events none/z-index -1. Mobile collection arcs strengthened after visual review. Production build and 346-product artifact checks pass (225 modules). Screenshot evidence in docs/previews/v3-surfaces-desktop-2026-10-20.png and v3-surfaces-mobile-2026-10-20.png; this is sampled browser evidence, not a full accessibility/device/FPS audit. A stale dev import cache was resolved by restarting the existing V3 server.

Local experiment only, not committed/pushed/deployed. Revert by removing the surface-patterns.css import from src/styles/storefront.css; exact previous entry and SHA256 manifest saved under .cache/v3-surface-study-before-20261020/. Documentation records the experiment separately from production. Next: user visual review, adjust or revert before any approved publication.

### 2026-10-20 — User-supplied blue wave background (local study)

User rejected the fine contour/perforation experiment and supplied 6094668.jpg (4500x3000,277631 bytes). Replaced the entire experimental surface-patterns.css contents: cream chapters are plain again; mosaic, workshop and home footer use the supplied wave artwork with a15% sky wash, centered cover cropping. Hero video remains unchanged. Original footer contour pseudo-element is disabled in this local study so it does not compete with the waves. No layout, font, commerce/admin or backend changes.

Pillow resized/compressed delivery copies to src/assets/backgrounds/blue-waves-1920.webp (31526 bytes) and blue-waves-768.webp (9612 bytes); supplied master preserved at root. CSS selects the compact copy below768px. Static backgrounds, no filters, JS or added motion; print/forced-colors omit the image. Previous experiment saved at .cache/v3-wave-study-before-20261020/surface-patterns.css; removing the last import restores the pre-experiment home backgrounds and original footer circles.

Checks:225-module production build and346-product artifact checks pass. Browser1280x800/390x844 workshop visual review shows image behind readable dark text; no sampled document horizontal overflow. Computed styles confirm waves on exactly mosaic/workshop/home footer, no patterns on the three cream chapters and compact WebP on mobile. Screenshots docs/previews/v3-waves-desktop-2026-10-20.png and v3-waves-mobile-2026-10-20.png. No full contrast/FPS/device audit claimed. Standing V4 design/performance guidance used; no extra tools installed. Local only, no push/deployment. Next: user review of wave treatment.

### 2026-10-20 — Supplied warm cream background study

User supplied aaaa 13.jpg (7000x4082) for the cream sections. Applied its actual gold/cream artwork to home collection/categories, Shop the Edit and custom contact sections in the isolated surface-patterns.css, with15% cream wash and centered cover cropping. Existing blue artwork, hero video, layout, type and controls retained. Asset delivery copies cream-waves-1920.webp13062 bytes and cream-waves-768.webp3668 bytes are generated with Pillow at quality85; original master preserved. No new motion/dependencies or backend/commerce changes. Print/forced-color fallback omits all decorative images. Previous blue-only stylesheet backed up at .cache/v3-wave-study-before-20261020/blue-only-surface-patterns.css.

Checks: production build225 modules and346-product artifact verification pass. Browser collection sampled at1280x800 and390x844: supplied image visible behind dark copy/blue buttons, no horizontal overflow, section below header at130.4/136.8px. Computed styles confirm all three cream chapters select the new image and compact source on mobile. Screenshots docs/previews/v3-cream-desktop-2026-10-20.png and v3-cream-mobile-2026-10-20.png. This is sampled visual evidence, not full cross-device/contrast certification. Standing V4 design/performance guidance remains applicable. Architecture unchanged except decorative asset/style ownership. Local only, not pushed/deployed; next user review of alternating warm/blue artwork.

### 2026-10-20 — Frosted home navigation study

User requested the top navigation become slightly blurred/translucent instead of cream/sky, with white text over the first section and black below. Home-only header now uses10px backdrop blur (including WebKit declaration); hero remains transparent with existing white nav ink. Lower home sections replace solid nav-surface fill with78% neutral white frost and retain palette-ink rgb23/27/32. Initial25% white tint was visually too dark over the underlying video; increased opacity after browser review. No change to product/admin headers, navigation behavior, section backgrounds or dimensions. Fallback without backdrop-filter uses near-opaque cream for lower sections. Backups pre-glass-home.css and pre-glass-refinement.css in .cache/v3-wave-study-before-20261020.

Browser checked390x844 and1280x800 collection: computed10px blur,78% white background, dark nav text, no sampled horizontal overflow. Hero computed transparent background and rgb243/247/255 text. Screenshots docs/previews/v3-glass-header-mobile-2026-10-20.png and v3-glass-header-desktop-2026-10-20.png.225-module production build/346-product artifact checks passed before final opacity-only adjustment; final opacity reviewed in browser. Header-sized backdrop blur adds compositing work; no FPS improvement or full device/contrast certification claimed. Standing V4 restrained design/performance guidance applied. Local only, no push/deployment. Next: user visual review.

### 2026-10-20 — Reduced navigation frost opacity

User requested less white/more transparency. Changed only the lower-home header fill from78% white (#ffffffc7) to60% (#ffffff99);10px blur and dark navigation retained, hero white/transparent behavior unchanged. Browser mobile collection confirms rgba255/255/255/.6 and blur10px; screenshot docs/previews/v3-header-transparency-2026-10-20.png. No new build/tests for this one-value reversible CSS adjustment; prior build remains earlier evidence. No architecture/backend/deployment change. Local only; next user visual review.

### 2026-10-20 — Section-tinted translucent home navigation

User requested section color instead of white frost. Lower-home header fill now mixes existing --nav-surface at60% with transparency: cream sections use palette-cream and sky/footer use palette-sky, retaining10px blur/dark nav ink. Transparent hero/white navigation unchanged. No-backdrop-filter fallback also follows current section tint at92% opacity. Existing section observer supplies tone; no new scroll logic or images added. Browser mobile cream header computed color(srgb1 .960784 .901961 / .6),10px blur and dark text; blue mapping source-reviewed through existing sky/denim tokens, not separately runtime-confirmed this turn. Screenshot docs/previews/v3-section-tinted-header-2026-10-20.png. No new build/tests for this small CSS-only adjustment. Architecture otherwise unchanged, local only, no deployment. Next: user review of tinted glass.

### 2026-10-20 — Continuous artwork behind home header

User clarified that the actual section artwork should be enlarged upward into the navigation, not replaced with a matching tint. Moved each home chapter/footer's wave background into an isolated pointer-transparent ::before layer extending upward by measured --home-header-height. Cover sizing now includes header+chapter in one image, avoiding a separately scaled header image/seam. Header fill is transparent with existing10px blur; lower text stays dark and hero text white. Removed superseded tint and tint fallback rules. With unsupported backdrop blur, the artwork remains visible without blur.

Existing useHomeSections boundary update now also publishes data-home-section (and removes it on cleanup). CSS reveals the upward extension only for the current chapter; other backgrounds clip their extension to avoid covering adjacent chapter content or the initial hero. This adds no new scroll listener or per-frame geometry work. Home footer allows its decorative background extension; draggable playground/world still own overflow clipping. Original section dimensions, snap destinations, forms, assets and backend unchanged. Pre-change surface stylesheet stored at .cache/v3-wave-study-before-20261020/pre-extended-surface-patterns.css; earlier header backups retained.

Checks: production TypeScript/Vite225-module build and346-product artifact checks pass before final equivalent selector cleanup. Mobile390x844 cream collection shows continuous image behind navigation; computed transparent header, active categories, ::before top -137.175px and clip none, no horizontal overflow. Desktop1280x800 blue workshop shows same enlarged artwork behind10px-blurred header; active how-it-works, transparent fill and no horizontal overflow. Hero protection source-reviewed via inactive clipping; no claim of comprehensive transition/FPS/device testing. Screenshots docs/previews/v3-continuous-header-mobile-2026-10-20.png and v3-continuous-header-desktop-2026-10-20.png. Living design notes updated; local only, no push/deployment. Next: review continuous artwork locally.

### 2026-10-20 — Gradual header artwork transition

User reported abrupt section-to-section header artwork switching. Split the decorative background into a stable chapter ::before and a matching ::after clipped to the header-sized extension. Existing data-home-section now selects extension opacity rather than abruptly changing clipping. CSS opacity transitions over650ms with cubic-bezier(.22,1,.36,1); outgoing extension fades away, new extension fades in over preceding content. Image scale/position are identical between layers, preserving continuous artwork. Pointer transparency and hero protection retained; reduced motion disables the transition, print/forced-colors hide extensions. No new JavaScript or listeners.

Runtime mobile contact check confirms active contact and computed opacity650ms curve, clipped to137.175px header strip. Screenshot docs/previews/v3-header-fade-2026-10-20.png records final state; still image cannot demonstrate temporal smoothness. Build result recorded below; no FPS or full device-transition certification claimed. Local only; no deployment/backend changes. Next user review of fade timing.

### 2026-10-20 — Wave surfaces across V3 public pages and admin

User approved carrying the artwork/header treatment throughout V3 and replacing the former flat cream/sky page surfaces, including admin. Added shared responsive --wave-warm-art/--wave-cool-art and composed paint variables in surface-patterns.css; home layers reuse these same variables. Commerce catalog/category/search/PDP/checkout/receipt/empty/not-found routes inherit one fixed viewport-sized warm artwork layer behind header and content, avoiding a cover image stretched over the entire long catalog. Commerce navigation is transparent with10px backdrop blur/dark ink; footer, cart totals, checkout summaries/COD/receipt code and amount panels use blue artwork. Cart/lightbox/filter/search dropdown surfaces use warm artwork. Fields/quantities use translucent white for readability. Darkened product-card category labels previously inheriting light text. Receipt cut-button actions were still legacy green; now use existing #5aa7ff blue/ink, including hover. Receipt email warning surface follows theme. Tiny semantic controls/badges and palette fallback/text tokens remain intentional; old theme files are not deleted wholesale because they own typography/layout and fallback colors.

Admin styling stays lazy: admin/styles.css now imports admin/surfaces.css after admin.css/listings.css. Shared paint variables are defined by the existing public entry available on every route. Admin login story/selected order or listing/notes use blue artwork, base/login/dashboard/listings use warm artwork; order details/editor/fields have translucent white layers. Admin top bar is sticky and subtly blurred. No auth/session, API, data, saved listing, order or email code changes. No new dependencies, media masters or animation loops. Existing650ms header fade remains home-only chapter behavior; normal commerce/admin pages scroll naturally and share their continuous artwork. Preserved V1/V2 and root shared store/API unchanged. Baseline style entries saved under .cache/v3-global-surfaces-before-20261020/.

Checks: final production build225 modules and346 product artifact validation pass. Browser1280x800 catalog, PDP, cart, checkout, search, admin login, fictional admin orders/listings editor sampled;390x844 checkout/admin editor/login/receipt sampled. No horizontal overflow on sampled checkout/admin/receipt/search layouts. Confirmed compact768px WebP selection on mobile checkout/admin/receipt, fixed background art, transparent header,72% white checkout fields,44% white listing editor; category labels rgb65/70/76. Temporary Abstract Ball cart line added to an initially empty local cart for checkout styling, then removed; original empty cart restored. No Place order/Save listing/admin status mutation used. Admin review used adminDemo=1 fictional records, login viewed without submitting credentials.

Production-build receipt success checked with the ignored loopback5182 fixture server returning clearly labelled DEMO01 sample only: no real order lookup/creation/email. Warm backdrop, blue amount/code surfaces and dark text confirmed on desktop/mobile; final actions compute rgb90/167/255 with rgb23/27/32 ink. Fixture server stopped and tab closed. Stale Vite import cache after adding the new lazy admin CSS was resolved by restarting local V3; production build resolves assets normally. Screenshots docs/previews/v3-global-{catalog,cart,checkout,admin,listings,admin-mobile,admin-login,receipt-desktop,receipt-mobile}-2026-10-20.png. Screenshots are sampled visual evidence, not a full device/a11y/FPS or new backend end-to-end certification.

Architecture and style ownership references updated. All background/header studies since the last release remain local, not pushed/deployed. Next: user review of site-wide appearance, then publish only when requested.

### 2026-10-20 — Wave theme published

Reviewed theme1c0a6f4 and production blur correction48b3201 deployed to www.barqmech.com. Browser production optimization required prefixed backdrop-filter first, standard declaration last; final live catalog computes10px blur. Preserve this order. Global responsive artwork and home650ms fade now published; previous local-only entries are historical.43 tests/build/artifact/audit gates pass; recovery tag pre-v3-wave-theme-2026-10-20 retains previous version. See living architecture and v3-wave-production evidence for precise scope/limits.
