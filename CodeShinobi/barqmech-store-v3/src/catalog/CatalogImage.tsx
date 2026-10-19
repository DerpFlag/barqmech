import { useState, type ImgHTMLAttributes } from 'react'
import type { CatalogImageSize } from '@store/catalog/productImages.ts'
import widths from '../data/image-widths.json'
type Props=Omit<ImgHTMLAttributes<HTMLImageElement>,'src'>&{publicUrl:string;size:CatalogImageSize;rawSrc?:string}
export function CatalogImage({publicUrl,size,rawSrc,onError,sizes,...rest}:Props){
  const [failed,setFailed]=useState('')
  const source=rawSrc??publicUrl
  const candidates=source.startsWith('/catalog-images/')?[320,640,1200].map(width=>source.replace(/-1200\.webp$/,`-${width}.webp`)):[]
  const seen=new Set<number>()
  const match=source.match(/^\/catalog-images\/([^/]+)\/(\d+)-1200\.webp$/)
  const dimensions=match?(widths[match[1] as keyof typeof widths] as number[][]|undefined)?.[Number(match[2])]:undefined
  const srcSet=candidates.flatMap((url,index)=>{const width=dimensions?.[index];if(!width||seen.has(width))return [];seen.add(width);return `${url} ${width}w`}).join(',')
  const preferred=size==='thumb'?candidates[0]:size==='card'?candidates[1]:source
  return <img {...rest} src={failed===source?'/image-unavailable.svg':preferred||source} srcSet={failed===source?undefined:srcSet||undefined} sizes={sizes??(size==='thumb'?'80px':size==='card'?'(max-width:767px) 45vw, (max-width:1100px) 30vw, 24vw':'(max-width:767px) 100vw, 55vw')} onError={event=>{if(failed!==source)setFailed(source);onError?.(event)}} />
}
