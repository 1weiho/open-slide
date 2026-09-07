import type { Page, SlideMeta } from '@open-slide/svelte';
import Welcome from './01-welcome.svelte';
import Architecture from './02-architecture.svelte';

export default [Welcome, Architecture] satisfies Page[];

export const meta = {
  title: 'Svelte runtime',
  createdAt: '2026-08-08T00:00:00.000Z',
} satisfies SlideMeta;

export const notes = [
  'This deck runs entirely through the native Svelte package.',
  'Core owns shared contracts and discovery; each runtime owns rendering.',
];
