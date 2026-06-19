import { useEffect, useState, type ImgHTMLAttributes } from 'react'
import { catalogImageUrl, type CatalogImageSize } from './productImages.ts'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  publicUrl: string
  size: CatalogImageSize
  /** Use this URL directly (mosaic / static assets) instead of catalog transform sizing. */
  rawSrc?: string
}

export function CatalogImage({ publicUrl, size, rawSrc, onError, ...rest }: Props) {
  const primary = rawSrc ?? catalogImageUrl(publicUrl, size)
  const [src, setSrc] = useState(primary)

  useEffect(() => {
    setSrc(primary)
  }, [primary])

  return (
    <img
      {...rest}
      src={src}
      onError={onError}
    />
  )
}
