"""Build the portable, offline BarqMech architecture guide. No network or secrets."""
from pathlib import Path
import base64
import html
import json
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FONTS = ROOT / 'CodeShinobi/barqmech-store-v3/src/assets/fonts'

def data_uri(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()

def build():
    page = (HERE / 'guide.template.html').read_text(encoding='utf-8')
    replacements = {
        '__GUIDE_CSS__': (HERE / 'guide.css').read_text(encoding='utf-8'),
        '__GUIDE_JS__': (HERE / 'guide.js').read_text(encoding='utf-8'),
        '__BODY_FONT__': data_uri(FONTS / 'dm-sans-latin-variable.woff2', 'font/woff2'),
        '__DISPLAY_FONT__': data_uri(FONTS / 'archivo-black-latin.woff2', 'font/woff2'),
        '__LOGO__': data_uri(ROOT / 'CodeShinobi/barqmech-store-v3/src/assets/optimized/logo.webp', 'image/webp'),
        '__WORDMARK__': data_uri(ROOT / 'CodeShinobi/barqmech-store-v3/public/brand/barqmech-wordmark.png', 'image/png'),
        '__DESKTOP__': data_uri(ROOT / 'docs/previews/v3-production-checkout-desktop.png', 'image/png'),
        '__MOBILE__': data_uri(ROOT / 'docs/previews/v3-production-checkout-mobile.png', 'image/png'),
        '__CART__': data_uri(ROOT / 'docs/previews/v3-production-cart-mobile.png', 'image/png'),
        '__FONT_LICENSES__': html.escape('\n\n'.join('\n'.join(line.rstrip() for line in (FONTS / name).read_text(encoding='utf-8').splitlines()) for name in ['DM-Sans-OFL.txt', 'Archivo-Black-OFL.txt'])),
    }
    for key, value in replacements.items():
        page = page.replace(key, value)
    if re.findall(r'__[A-Z_]+__', page):
        raise RuntimeError('Unresolved template marker')
    references = re.findall(r"path:'([^']+)'", replacements['__GUIDE_JS__'])
    missing = [path for path in references if not (ROOT / path).exists()]
    if missing:
        raise RuntimeError('Missing source references: ' + ', '.join(missing))
    (HERE / 'index.html').write_bytes(page.encode('utf-8'))
    (ROOT / 'BarqMech-Field-Guide.html').write_bytes(page.encode('utf-8'))
    print(json.dumps({'built': 'docs/architecture-guide/index.html', 'bytes': len(page.encode()), 'external_runtime_dependencies': 0}))

if __name__ == '__main__':
    build()
