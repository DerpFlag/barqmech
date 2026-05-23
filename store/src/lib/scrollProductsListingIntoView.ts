/** Scroll the products listing header into view after page changes. */
export function scrollProductsListingIntoView() {
  const el =
    document.querySelector<HTMLElement>('.products-listing-heading-row') ??
    document.querySelector<HTMLElement>('.products-search-header')
  if (!el) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
