<script lang="ts">
import { type Component, setContext } from 'svelte';
import { PAGE_CONTEXT } from '../components/page-context.ts';

export let component: Component;
export let index: number;
export let total: number;

setContext(PAGE_CONTEXT, { index, total });
</script>

<svelte:component this={component} />
