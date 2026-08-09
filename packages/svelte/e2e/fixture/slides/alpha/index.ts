import type { Page, SlideMeta } from '@open-slide/svelte';
import One from './01-one.svelte';
import Two from './02-two.svelte';
import Three from './03-three.svelte';

export const meta = {
  title: 'Alpha Deck',
  createdAt: '2026-01-03T00:00:00.000Z',
} satisfies SlideMeta;

export const notes: (string | undefined)[] = ['Alpha speaker note', undefined, 'Alpha final note'];

export default [One, Two, Three] satisfies Page[];
