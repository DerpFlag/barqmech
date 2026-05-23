# Home intro video

Summary of how the storefront home intro (`Media/Final Video.mp4`) is played and how the page behaves around it.

**Implementation:** `store/src/IntroHero.tsx`, `store/src/App.tsx` (props), `store/src/index.css` (overlay and fades).

---

## Playback

| Setting | Value | Effect |
|--------|--------|--------|
| `playbackRate` | `1.5` | Plays 50% faster than real time. |
| `endTrimSeconds` | `1.8` | Intro ends **1.8 seconds before** the file’s real end (tail trimmed). |
| `revealLeadSeconds` | `2` | Passed to `IntroHero` but **`onLeadReveal` is not used** — nothing on the page reacts early; only trim + end drive “done.” |
| Safety timeout | `22s` | If the video never finishes (error, stall), intro still ends. |

**Felt length (approx.):** `(file duration − 1.8s) ÷ 1.5` in wall-clock seconds.

Muted, no loop, `playsInline` for mobile autoplay.

---

## What you see

- Video is drawn on a **canvas** each frame (hidden `<video>` element; avoids visible-tag jank).
- **Black letterboxing** + centered frame:
  - **Desktop:** `contain` (full frame visible).
  - **Mobile (≤920px):** cover-style scale capped so at least **~60%** of the frame stays visible.
- Canvas DPR capped (**2** desktop, **1.35** mobile) to limit GPU load.
- **No** color filters or blur on the footage in code.

Overlay copy position tracks the drawn video via `--panel-left-center` / `--panel-right-center`.

---

## During intro

- `body.intro-playing` — page scroll locked.
- Top bar, main content, and carousels **do not mount** until the video finishes.
- Hexagon background pointer effects are paused.

---

## After intro

Video pauses; `introDone` becomes true. Overlay, top bar, mobile copy (narrow screens), and `<main>` appear. About **100ms** later, coordinated CSS fades:

| Element | Transition |
|---------|------------|
| Top bar | Slide down, ~0.7s |
| Hero overlay | Opacity + slide up, ~0.9s |
| Main content | Opacity + slide up, ~0.8s |
| Mobile copy block | ~0.75s (overlay hidden on mobile) |

`hero-below-fade` — gradient under the hero (black → transparent) into the page below.

---

## Not used (stutter fix)

Early UI reveal **~2 seconds before** the trimmed end (`onLeadReveal`) was removed so heavy DOM does not mount during playback.

---

## Tweaking

In `App.tsx` on `<IntroHero>`:

```tsx
playbackRate={1.5}
revealLeadSeconds={2}
endTrimSeconds={1.8}
```

Rebuild and redeploy the store after changing props.
