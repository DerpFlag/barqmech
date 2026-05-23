# Home intro video

Summary of how the storefront home intro (`Media/Final Video.mp4`) is played and how the page behaves around it.

**Implementation:** `store/src/IntroHero.tsx`, `store/src/App.tsx` (props), `store/src/index.css` (overlay and fades).

---

## Playback

| Setting | Value | Effect |
|--------|--------|--------|
| `playbackRate` | `1.5` | Plays 50% faster than real time. |
| `endTrimSeconds` | `1.5` | Intro ends **1.5 seconds before** the file’s real end (tail trimmed). |
| `revealLeadSeconds` | `1` | Fires `onLeadReveal` **~1 second before** the trimmed end so page chrome can fade in while the video still plays. |
| Safety timeout | `22s` | If the video never finishes (error, stall), intro still ends. |

**Felt length (approx.):** `(file duration − 1.5s) ÷ 1.5` in wall-clock seconds.

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

- `body.intro-playing` — page scroll locked until the trimmed end.
- **~1s before** trimmed end: top bar, hero overlay, mobile copy, and `<main>` mount and begin CSS fades (~100ms delay, then ~0.7–0.9s transitions).
- Carousel timers and resize-driven featured blocks wait until **`introDone`** (video fully finished).

Hexagon background pointer effects are paused while `intro-playing` is set.

---

## After intro

Video pauses at the trimmed end; `introDone` becomes true; `intro-playing` is removed from `body`.

| Element | Transition |
|---------|------------|
| Top bar | Slide down, ~0.7s |
| Hero overlay | Opacity + slide up, ~0.9s |
| Main content | Opacity + slide up, ~0.8s |
| Mobile copy block | ~0.75s (overlay hidden on mobile) |

`hero-below-fade` — gradient under the hero (black → transparent) into the page below.

---

## Tweaking

In `App.tsx` on `<IntroHero>`:

```tsx
playbackRate={1.5}
revealLeadSeconds={1}
endTrimSeconds={1.5}
```

Rebuild and redeploy the store after changing props.
