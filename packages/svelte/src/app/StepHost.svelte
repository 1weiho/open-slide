<script lang="ts">
import {
  createStepRegistry,
  type EntryDirection,
  type StepAggregate,
  type StepController,
} from '@open-slide/shared';
import { type Component, onDestroy, setContext } from 'svelte';
import { STEP_CONTEXT } from '../components/step-context.ts';

export let entryDirection: EntryDirection = 'forward';
export let component: Component;
export let onController: (controller: StepController, mounted: boolean) => void;
export let onAggregate: (controller: StepController, aggregate: StepAggregate) => void = () => {};

const registry = createStepRegistry((aggregate) => onAggregate(registry.controller, aggregate));
setContext(STEP_CONTEXT, { entryDirection, register: registry.register });
$: onController(registry.controller, true);
onDestroy(() => onController(registry.controller, false));
</script>

<svelte:component this={component} />
