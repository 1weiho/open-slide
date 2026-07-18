# Assets & image placeholders

## Slide-local assets

**Slide-local assets** live under `slides/<id>/assets/` — anything one-off to a single slide. Import them as ES modules:

```tsx
import hero from './assets/hero.jpg';
// …
<img src={hero} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
```

For URL-only access:

```tsx
const videoUrl = new URL('./assets/intro.mp4', import.meta.url).href;
```

## Global assets

**Global assets** — anything reused across decks or themes (company logos, presenter avatars, recurring icons) — live in the project root `assets/` folder. Import them via the `@assets` alias:

```tsx
import logo from '@assets/logos/acme.svg';
```

A `themes/*.md` file may name an asset path in its prose (e.g. "use `@assets/logos/acme.svg` in the title slot"); the slide imports it explicitly.

For a pure-text slide, don't create `slides/<id>/assets/` at all.

## Image placeholders (`<ImagePlaceholder>`)

When a page genuinely needs a real image **the user has to provide** — a product screenshot, a team photo, a chart from their data — leave a typed placeholder instead of inventing a stand-in:

```tsx
import { ImagePlaceholder } from '@open-slide/core';

<ImagePlaceholder hint="Product hero screenshot" width={1280} height={720} />
```

The user uploads the real file via the Assets panel, then clicks the placeholder in the inspector and picks "Replace…" — the JSX is rewritten to a real `<img>` with the import added.

**Use a placeholder only when** a specific concrete image is required by the deck's topic. Examples that warrant one: a product-intro deck (product screenshot per feature), an offsite recap (team photo), a case study (customer logo, dashboard screenshot).

**Do not use a placeholder** for decoration, generic "stock photo" filler, hero imagery on a text-heavy slide, or anywhere a typographic / iconographic / illustrative solution would do. If you can carry the page with type, layout, and color — do that. Empty placeholders the user has to fill are friction; only spend that friction when the alternative is worse.

Size the placeholder to the slot it occupies. Pass `width`/`height` when the layout has a fixed image box; omit them when the placeholder fills a flex/grid cell. The `hint` should describe the *content* the user needs ("Q3 revenue chart") not the *role* ("hero image").

### Placeholder anti-patterns

- ❌ Sprinkling `<ImagePlaceholder>` across pages "for visual interest". Placeholders are for content the user owns; they're not stock-photo slots.
- ❌ Using a placeholder for an icon or decorative shape — those are typography/SVG problems, not asset problems.
