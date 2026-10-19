import widths from './local-image-widths.json'
const large=import.meta.glob('../assets/optimized/categories/**/*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>
const small=import.meta.glob('../assets/optimized/categories-small/**/*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>
const sets=new Map<string,string>()
for(const [path,url] of Object.entries(large)){
  const key=path.replace('../assets/optimized/',''),smallKey=key.replace('categories/','categories-small/')
  const smallUrl=small['../assets/optimized/'+smallKey]
  const wide=widths[key as keyof typeof widths],narrow=widths[smallKey as keyof typeof widths]
  sets.set(url,smallUrl&&narrow<wide?`${smallUrl} ${narrow}w, ${url} ${wide}w`:`${url} ${wide}w`)
}
export const localImageSet=(url?:string)=>url?sets.get(url):undefined
