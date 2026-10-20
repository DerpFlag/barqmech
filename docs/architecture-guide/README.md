# BarqMech Field Guide

The standalone deliverable is `BarqMech-Field-Guide.html` at the repository root. Double-click it to open it in a normal browser. It needs no server, build tools or companion files; CSS, JavaScript, fonts, diagrams and screenshots are embedded. External website/source links still require internet.

`index.html` here is an identical preview copy. Optionally preview locally:

```powershell
python -m http.server 5180 --bind 127.0.0.1 --directory docs/architecture-guide
```

Then open http://127.0.0.1:5180/ . The guide is self-contained and works offline; external service/source links need internet. It never fetches production APIs or changes listings/orders.

Edit `guide.template.html`, `guide.css`, `guide.js` and run:

```powershell
python docs/architecture-guide/build.py
```

The build embeds the project's local fonts, their licenses, its logo and three non-customer release screenshots. No secrets/environment files or private data are read by this builder. The architecture Markdown remains the living reference; update guide content when behavior changes.

This guide is a local documentation artifact. It has not been added to the public storefront or deployed automatically.

Validation commands:

```powershell
python docs/architecture-guide/validate.py
node --check docs/architecture-guide/guide.js
```

The HTTP preview was checked in the Codex browser at desktop, tablet and small-phone widths. See `qa.json` for actual observations and limitations. Direct file launch is unsupported by the browser tool and was not browser-tested; all runtime assets are embedded by the builder. Print/PDF styling is included but has not been visually verified.
