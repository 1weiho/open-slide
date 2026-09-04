<script lang="ts">
import { getContext, onMount } from 'svelte';
import { STEP_CONTEXT, type StepContext } from './step-context.ts';

export let duration = 180;

const host = getContext<StepContext | undefined>(STEP_CONTEXT);
let revealed = !host || host.entryDirection !== 'forward';

onMount(() =>
  host?.register({
    initialRevealed: revealed,
    setRevealed: (next) => (revealed = next),
  }),
);
</script>

<div
  data-osd-step={revealed ? 'revealed' : 'pending'}
  style:opacity={revealed ? 1 : 0}
  style:visibility={revealed ? 'visible' : 'hidden'}
  style:transition={`opacity ${duration}ms cubic-bezier(0, 0, 0.2, 1)`}
>
  <slot></slot>
</div>
