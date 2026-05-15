import type { ImgHTMLAttributes } from 'react'
import { catalogImageUrl, type CatalogImageSize } from './productImages.ts'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  publicUrl: string
  size: CatalogImageSize
}

export function CatalogImage({ publicUrl, size, ...rest }: Props) {
  return <img {...rest} src={catalogImageUrl(publicUrl, size)} />
}
