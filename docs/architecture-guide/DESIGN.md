# BarqMech field guide

Direction: editorial, precise, approachable. This is an internal architecture/operations companion, not a storefront redesign.

- Cream reading surface, dark navy navigation, existing BarqMech blue accents. Dark-blue links have stronger contrast than the bright brand accent on cream.
- Existing licensed DM Sans for reading and Archivo Black for large headings; embedded fonts and OFL notices make the output portable.
- Signature motif: numbered field notes and clear connection lines. Each diagram explains a real boundary or sequence; no invented activity feeds, fake live metrics or ornamental chart data.
- Component variety follows tasks: interactive service map, sequential order explorer, listing-state/revision demonstrations, ownership matrix, file lanes, dimension-based shipping model, email branches, release sequence, searchable source rows and expandable notes.
- Native HTML/CSS/SVG and lightweight inline JavaScript. No runtime dependency, external font request, analytics or live business API call. The single generated index.html embeds fonts and three safe release screenshots.
- Motion: native smooth anchor navigation, short hover/state transitions, limited connection tracing. Journey playback is user-started, pausable and stops on page hide; reduced-motion preferences remove visual movement.
- Accessibility: semantic landmarks, skip link, visible focus, native dialogs/disclosures, labelled controls, live feedback and responsive layouts. Table overflow is contained intentionally. No screen-reader or WCAG conformance certification is implied.
- Reference guidance: AUTONOMOUS_VIBE_RECONCILED_V4_PACK creative-direction, anti-ai-slop, component-craft, frontend-quality, browser-qa, design/copy/accessibility standards. Upstream UI UX Pro Max, Frontend Design and Impeccable were reported not installed by the local catalog; no installation claimed or required.
- Current-state content wins over historical proposals. No credentials, customer records, signed receipt/download URLs or private DXFs in the guide. Account dashboard links require the viewer's own access.

Build: `python docs/architecture-guide/build.py` from the repository root. The generated index.html is the portable deliverable; the template/CSS/JS remain editable source.

2026-10-20 review: corrected a 320px heading overflow, restored the real logo instead of a legacy 1px placeholder, made closed mobile navigation inert, added a native copy-path fallback dialog and improved print text contrast. Browser checks covered navigation/search, diagrams, local state models, shipping boundaries, screenshot viewing and source filtering. The 51 source paths exist; 68 HTML IDs are unique and internal anchors resolve. No external runtime resources or secret-like tokens were found by the static validator. Evidence and explicit untested cases are in `qa.json`; the screenshots show actual local browser output. No new tool or library was installed.
