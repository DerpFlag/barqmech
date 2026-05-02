/**
 * Shared BarqMech transactional email frame (header + footer + logo).
 */

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Prefer client `origin` for absolute asset URLs; else PUBLIC_SITE_URL / Vercel. */
export function resolveSiteBaseUrl(body) {
  const raw = body && typeof body.origin === 'string' ? body.origin.trim().replace(/\/$/, '') : ''
  if (raw && /^https:\/\//i.test(raw)) return raw
  if (raw && /^http:\/\/localhost(:\d+)?$/i.test(raw)) return raw
  const explicit = (process.env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '')
  if (explicit) return explicit
  const v = process.env.VERCEL_URL
  if (v) return `https://${String(v).replace(/^https?:\/\//, '')}`
  return ''
}

export function emailFooterBlock(siteBase) {
  const logoSrc = siteBase ? `${siteBase}/barqmech-email-logo.png` : ''
  const logoHtml = logoSrc
    ? `<img src="${escapeHtml(logoSrc)}" alt="BarqMech" width="240" style="max-width:240px;width:100%;height:auto;display:block;margin:16px auto 0;border:0;" />`
    : ''
  return `
  <tr>
    <td style="padding:30px 28px;background:#f0f4f9;border-top:1px solid #d5dee8;text-align:center;">
      <div style="font-size:11px;letter-spacing:0.34em;color:#1e3a5f;font-family:Arial,Helvetica,sans-serif;font-weight:700;">BARQMECH</div>
      ${logoHtml}
      <p style="margin:18px 0 0;font-size:12px;color:#64748b;font-family:Arial,Helvetica,sans-serif;line-height:1.7;max-width:420px;margin-left:auto;margin-right:auto;">
        Precision laser cutting &amp; custom metal fabrication for architecture, décor, and lighting.<br/>
        <span style="color:#94a3b8;font-size:11px;">© ${new Date().getFullYear()} BarqMech. All rights reserved.</span>
      </p>
    </td>
  </tr>`
}

export function emailShell(heroSubtitle, innerTdHtml, siteBase) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta http-equiv="X-UA-Compatible" content="IE=edge"/></head>
<body style="margin:0;padding:0;background:#dfe7f0;-webkit-text-size-adjust:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#dfe7f0;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:100%;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #c5d0dc;box-shadow:0 8px 32px rgba(15,23,42,0.06);">
<tr>
  <td style="background:#152b45;padding:28px 28px 26px;text-align:center;">
    <div style="font-size:11px;letter-spacing:0.38em;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-weight:700;">BARQMECH</div>
    <div style="font-size:14px;color:#a8c9e8;margin-top:12px;font-family:Arial,Helvetica,sans-serif;line-height:1.45;font-weight:400;">${escapeHtml(heroSubtitle)}</div>
  </td>
</tr>
${innerTdHtml}
${emailFooterBlock(siteBase)}
</table>
</td></tr>
</table>
</body>
</html>`
}
