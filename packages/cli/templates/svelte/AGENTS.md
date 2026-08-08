# Slide authoring

- Each deck lives at `slides/<id>/index.ts`.
- Each page is a normal `.svelte` component sized by the runtime to a 1920 × 1080 canvas.
- Keep deck assets beside the deck under `slides/<id>/assets/`.
- Default-export the ordered page component array from `index.ts`.
- Export `meta` and optional `notes` from `index.ts`.
