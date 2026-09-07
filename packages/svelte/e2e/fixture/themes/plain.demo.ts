import type { Page } from '@open-slide/svelte';
import One from './plain.demo-one.svelte';
import Two from './plain.demo-two.svelte';

export default [One, Two] satisfies Page[];
