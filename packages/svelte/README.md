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

## Authoring helpers

Step reveals use native Svelte components:

```svelte
<script lang="ts">
  import Step from '@open-slide/svelte/Step.svelte';
  import Steps from '@open-slide/svelte/Steps.svelte';
</script>

<Steps>
  <Step>First reveal</Step>
  <Step>Second reveal</Step>
</Steps>
```

`@open-slide/svelte/MorphElement.svelte` marks an element for matching slide transitions, and `@open-slide/svelte/ImagePlaceholder.svelte` provides an agent-friendly image placeholder. `getSlidePageNumber()` returns the current zero-based page index and total from within a rendered page.

Theme demos use a TypeScript module so one theme can expose multiple Svelte pages:

```ts
import type { Page } from '@open-slide/svelte';
import Cover from './plain.demo-cover.svelte';
import Content from './plain.demo-content.svelte';

export default [Cover, Content] satisfies Page[];
```

Save that module as `themes/plain.demo.ts` beside `themes/plain.md`.
