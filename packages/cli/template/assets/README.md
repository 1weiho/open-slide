# Global assets

Cross-deck, cross-theme reusable assets — company logos, presenter avatars,
recurring icons. Anything you reach for from more than one slide belongs here.

One-off images that only ever appear in a single slide should stay next to that
slide, under `slides/<id>/assets/`.

## Importing

Use the `@assets` alias from any slide:

```tsx
import logo from '@assets/logos/acme.svg';
```

The alias resolves to this folder. Vite handles hashing and emits the file into
the build output like any other imported asset.

## Organising

Group by kind however suits you — `logos/`, `avatars/`, `icons/`, `fonts/`. A
`themes/*.md` file can name an asset path in prose (e.g. "use
`@assets/logos/acme.svg` in the title slot"); slides then import it explicitly.
