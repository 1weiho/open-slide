# Global assets

Cross-deck, cross-theme reusable assets — company logos, presenter avatars,
recurring icons. Anything you reach for from more than one slide belongs here.

One-off images that only ever appear in a single slide should stay next to that
slide, under `slides/<id>/assets/`.

## Importing

Use the `@assets` alias from any slide:

```tsx
import logoDark from '@assets/logos/acme-dark.svg';
import logoLight from '@assets/logos/acme-light.svg';
```

The alias resolves to this folder. Vite handles hashing and emits the file into
the build output like any other imported asset.

## Conventions

- **Theme-aware pairs:** name dark/light variants with `-dark.svg` / `-light.svg`
  suffixes so they can be matched to `meta.theme`.
- **Group by kind:** `logos/`, `avatars/`, `icons/`, `fonts/`, etc.
- **Theme references:** a `themes/*.md` file may name an asset path in prose
  (e.g. "use `@assets/logos/acme-dark.svg` in the title slot"). Slides then
  import it explicitly.
