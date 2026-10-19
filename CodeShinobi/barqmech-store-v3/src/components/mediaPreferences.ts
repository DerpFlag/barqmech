type Connection = EventTarget & {saveData?:boolean;effectiveType?:string}
const connection = () => (navigator as Navigator & {connection?:Connection}).connection

export function saveMediaData() {
  const current = connection()
  // A fluctuating 3G estimate should select the smaller video, not disable it.
  return Boolean(current?.saveData || ['slow-2g','2g'].includes(current?.effectiveType ?? ''))
}
export function compactVideo() {
  return matchMedia('(max-width:767px)').matches || connection()?.effectiveType === '3g'
}
export function watchMediaConnection(listener:()=>void) {
  const current=connection()
  current?.addEventListener?.('change',listener)
  return ()=>current?.removeEventListener?.('change',listener)
}
