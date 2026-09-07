import type { Page, SlideMeta } from '@open-slide/svelte';
import Main from './01-main.svelte';

export const meta = {
  title: 'Beta Deck',
  createdAt: '2025-01-03T00:00:00.000Z',
} satisfies SlideMeta;

export default [Main] satisfies Page[];
