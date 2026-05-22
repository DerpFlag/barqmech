/** Preload image URLs (decode in browser) before starting carousel rotation. */
export function preloadImageUrl(url: string): Promise<void> {
  if (!url?.trim()) return Promise.resolve()
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    const done = () => resolve()
    img.onload = done
    img.onerror = done
    img.src = url
  })
}

export async function preloadImageUrls(urls: string[], concurrency = 4): Promise<void> {
  const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))]
  if (!unique.length) return

  let next = 0
  const workers = Math.min(concurrency, unique.length)

  async function worker() {
    while (next < unique.length) {
      const i = next++
      await preloadImageUrl(unique[i]!)
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()))
}
