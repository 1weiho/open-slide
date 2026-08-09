# Slide authoring

- Each deck lives at `slides/<id>/index.ts`.
- Each page is a normal `.svelte` component sized by the runtime to a 1920 × 1080 canvas.
- Keep deck assets beside the deck under `slides/<id>/assets/`.
- Default-export the ordered page component array from `index.ts`.
- Export `meta` and optional `notes` from `index.ts`.
- Use `@open-slide/svelte/Step.svelte` for incremental reveals.
- Use `@open-slide/svelte/MorphElement.svelte` for elements that should morph between pages.
- Theme demos are `themes/<id>.demo.ts` modules that default-export an array of Svelte page components.
