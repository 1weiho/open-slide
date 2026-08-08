# @open-slide/svelte

The native Svelte runtime for open-slide.

Slides live in `slides/<id>/index.ts`. Each index imports Svelte page components and default-exports them as an array:

```ts
import type { Page, SlideMeta } from '@open-slide/svelte';
import Cover from './01-cover.svelte';
import Results from './02-results.svelte';

export default [Cover, Results] satisfies Page[];
export const meta = { title: 'Quarterly results' } satisfies SlideMeta;
```

Install `@open-slide/svelte`, then use `open-slide dev`, `open-slide build`, and `open-slide preview` just like the React runtime.
