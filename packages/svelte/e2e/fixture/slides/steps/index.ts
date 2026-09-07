import type { Page, SlideMeta } from '@open-slide/svelte';
import One from './01-one.svelte';
import Two from './02-two.svelte';
import Three from './03-three.svelte';

export const meta = {
  title: 'Steps Deck',
  createdAt: '2025-06-03T00:00:00.000Z',
} satisfies SlideMeta;

export default [One, Two, Three] satisfies Page[];
