---
name: split-shared-images
description: Refactor a slide so every image is its own JSX node the inspector can replace or crop independently. Use when the user says "split shared images", "make the images independently editable", complains that replacing or cropping one image changes other images too, or references the shared-image warning shown in the inspector's replace/crop dialog.
---

# Split shared images

The inspector's *Replace image* and *Crop* resolve a click to the `<img>`'s **source location**. When several rendered images share one source location — an `<img src={src}>` inside a shared component, or an `<img>` inside an `array.map` body — editing any one of them rewrites that single line, so **every instance changes together**. The dev UI warns about this in the replace/crop dialogs and points the user here.

Your job: find those shared image locations in one slide and rewrite them so each image is its own JSX node at its own call site, without changing how the slide looks.

> Read the **`slide-authoring`** skill first (section *"Repeated elements: component, not `map`"*) — it defines the target shape. If the user says "this slide" without naming it, resolve it via the **`current-slide`** skill.

## Find the offending patterns

Scan `slides/<id>/index.tsx` for:

1. **A component whose `<img>` renders from a prop** — `const Shot = ({ src, … }) => … <img src={src} …/>` — and that has **two or more** `<Shot …/>` call sites. One call site is technically fine, but refactor it too if you're already touching the component: a second use will silently reintroduce the bug.
2. **An `<img>` inside an `array.map` body** — one source location rendered N times.

`grep -n "<img" slides/<id>/index.tsx` plus a read of the surrounding components is usually enough. Don't read the whole file blindly — locate the image components first.

## The refactor

Move the `<img>` to each call site and pass it as `children`. The wrapper keeps every other job it had — frame, border, aspect ratio, caption slot:

```tsx
// Before — one shared <img>, all instances coupled:
const Shot = ({ src, ratio, alt }: { src: string; ratio: number; alt: string }) => (
  <div style={{ aspectRatio: ratio, borderRadius: 8, overflow: 'hidden' }}>
    <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  </div>
);
<Shot src={imgA} ratio={16 / 9} alt="…" />
<Shot src={imgB} ratio={16 / 9} alt="…" />

// After — each image is its own node, independently replace/crop-able:
const Shot = ({ ratio, children }: { ratio: number; children: React.ReactNode }) => (
  <div style={{ aspectRatio: ratio, borderRadius: 8, overflow: 'hidden' }}>{children}</div>
);
<Shot ratio={16 / 9}>
  <img src={imgA} alt="…" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
</Shot>
<Shot ratio={16 / 9}>
  <img src={imgB} alt="…" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
</Shot>
```

For a `map` body, unroll it into explicit instances (see the `slide-authoring` examples) — one JSX node per item.

## Rules

- **Pixel-identical output.** Carry the `<img>`'s exact style object to every call site; keep wrapper props (`ratio`, `light`, borders) on the wrapper. Move only the `<img>` itself.
- Keep each call site's own `src` import and `alt` text. If the component hard-coded a value the call sites were meant to vary (a known bug this pattern causes), use each call site's prop value, not the hard-coded one.
- Don't touch other slides, other components, or styling that isn't part of the move.
- If an image already carries inspector-applied crop styles (`objectFit` / `objectPosition` / `objectViewBox` overrides), those belong to **one** instance — keep them only on the call site the user actually cropped, or ask if you can't tell.
- Finish with the `slide-authoring` self-review checklist; confirm the slide still typechecks and hot-reloads cleanly.
