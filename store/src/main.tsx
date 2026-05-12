function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function showFatal(message: string) {
  const root = document.getElementById('root')
  if (!root || root.dataset.bmFatal) return
  root.dataset.bmFatal = '1'
  root.innerHTML = `<div style="padding:2rem;font-family:system-ui,sans-serif;max-width:40rem;color:#fecaca;background:#140808;border:1px solid #450a0a;border-radius:10px;margin:1rem auto">
    <h1 style="font-size:1.15rem;margin:0 0 0.75rem;color:#fecaca">Could not start the store</h1>
    <pre style="margin:0 0 1rem;white-space:pre-wrap;word-break:break-word;color:#e2e8f0;font-size:0.9rem">${escapeHtml(message)}</pre>
    <p style="margin:0;color:#94a3b8;font-size:0.88rem">Try a <strong>hard refresh</strong> (Ctrl+Shift+R). In DevTools → Network, check whether the <code>bootstrap-….js</code> or <code>index-….js</code> request is red (404).</p>
  </div>`
}

const root = document.getElementById('root')
if (!root) {
  document.body.textContent = 'Missing #root element.'
} else {
  void import('./bootstrap.tsx')
    .then(({ mountApp }) => {
      mountApp(root)
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.stack || err.message : String(err)
      console.error('BarqMech bootstrap import failed:', err)
      showFatal(msg)
    })
}
