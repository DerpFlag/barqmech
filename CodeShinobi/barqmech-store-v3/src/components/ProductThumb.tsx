import type { ImgHTMLAttributes } from 'react'
import { CatalogImage } from '@store/catalog/CatalogImage.tsx'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  publicUrl: string
}

export function ProductThumb({ publicUrl, alt, className, loading = 'lazy', ...rest }: Props) {
  if (!publicUrl?.trim()) {
    return <div className="shinobi-thumb shinobi-thumb--empty" aria-hidden />
  }
  return (
    <CatalogImage
      publicUrl={publicUrl}
      size="card"
      alt={alt}
      className={className ?? 'shinobi-thumb'}
      loading={loading}
      decoding="async"
      {...rest}
    />
  )
}
