# open-slide — Agent Guide

You are authoring **slide decks** in this repo. Every deck is arbitrary React code that you write.

## Hard rules

- Put your deck under `slides/<kebab-case-id>/`.
- The deck entry is `slides/<id>/index.tsx`.
- Put images/videos/fonts under `slides/<id>/assets/`.
- Do **not** touch `package.json`, `open-slide.json`, or other decks.
- Do not add dependencies. Use only `react` and standard web APIs.

## File contract

```tsx
// slides/<id>/index.tsx
import type { DeckMeta, SlidePage } from '@open-slide/core';

const Cover: SlidePage = () => <div>…</div>;
const Body: SlidePage = () => <div>…</div>;

export const meta: DeckMeta = { title: 'My deck' };
export default [Cover, Body] satisfies SlidePage[];
```

- `export default` is an **array of React components**, one per page, in order.
- `meta.title` (optional) is shown in the deck header. Default is the folder name.
- Each page is a zero-prop function component.

## Canvas

Every slide renders into a fixed **1920 × 1080** canvas. The framework handles scaling.

- Use **absolute pixel values** for font-size, padding, positioning. Design as if the viewport is literally 1920×1080.
- The root element of each page should fill the canvas: `width: '100%'; height: '100%'`.
- Prefer inline `style={{ ... }}` unless you need something CSS can't do. Any CSS you load is global — scope classnames carefully.

## Assets

Place files in `./assets/` and import them:

```tsx
import cover from './assets/cover.png';
// …
<img src={cover} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
```

Or, for URL-only use:

```tsx
const videoUrl = new URL('./assets/intro.mp4', import.meta.url).href;
```

## What you get for free

- Home page lists every folder under `slides/`.
- Clicking a deck shows: left thumbnail rail, main slide, prev/next, page counter.
- Arrow keys / PageUp / PageDown to navigate. `F` to enter fullscreen play mode.
- In play mode: Space/→ next, ← prev, Esc exit.
- Hot reload: edit `index.tsx` and the browser updates live.

## Checklist before finishing

- `slides/<id>/index.tsx` default-exports a **non-empty** array.
- Each page fills 1920×1080 and looks right at that aspect ratio.
- All imported assets exist under `slides/<id>/assets/`.
- You didn't edit anything outside `slides/<id>/`.
