type ProductsPaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  'aria-label'?: string
}

export function ProductsPagination({
  page,
  totalPages,
  onPageChange,
  className = '',
  'aria-label': ariaLabel = 'Product pages',
}: ProductsPaginationProps) {
  const rootClass = ['products-pagination', className].filter(Boolean).join(' ')

  return (
    <nav className={rootClass} aria-label={ariaLabel}>
      <button
        type="button"
        className="featured-arrow"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        ‹
      </button>
      <span>
        Page {page} / {totalPages}
      </span>
      <button
        type="button"
        className="featured-arrow"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  )
}
