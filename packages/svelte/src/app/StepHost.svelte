<script lang="ts">
import {
  createStepRegistry,
  type EntryDirection,
  type SlideTransition,
  type StepAggregate,
  type StepController,
} from '@open-slide/shared';
import { type Component, onDestroy, onMount, setContext } from 'svelte';
import { PAGE_CONTEXT } from '../components/page-context.ts';
import { STEP_CONTEXT } from '../components/step-context.ts';

export let entryDirection: EntryDirection = 'forward';
export let component: Component;
export let pageTransition: SlideTransition | undefined = undefined;
export let controlledRevealed: number | undefined = undefined;
export let pageIndex = 0;
export let pageCount = 1;
export let onController: (controller: StepController, mounted: boolean) => void;
export let onAggregate: (controller: StepController, aggregate: StepAggregate) => void = () => {};

const registry = createStepRegistry((aggregate) => onAggregate(registry.controller, aggregate));
let host: HTMLDivElement;
setContext(STEP_CONTEXT, { entryDirection, register: registry.register });
setContext(PAGE_CONTEXT, { index: pageIndex, total: pageCount });
$: onController(registry.controller, true);
$: if (controlledRevealed !== undefined) registry.setRevealed(controlledRevealed);
onMount(() => {
  const phase = pageTransition?.enter;
  if (!phase) return;
  host.animate(phase.keyframes, {
    duration: phase.duration ?? pageTransition?.duration,
    easing: phase.easing ?? pageTransition?.easing,
    delay: phase.delay,
    fill: 'both',
  });
});
onDestroy(() => onController(registry.controller, false));
</script>

<div class="os-page-host" bind:this={host}><svelte:component this={component} /></div>

<style>
  .os-page-host {
    width: 100%;
    height: 100%;
  }
</style>
