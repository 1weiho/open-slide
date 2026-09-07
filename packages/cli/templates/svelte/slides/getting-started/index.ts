import type { Page, SlideMeta } from '@open-slide/svelte';
import Welcome from './01-welcome.svelte';
import Authoring from './02-authoring.svelte';

export default [Welcome, Authoring] satisfies Page[];

export const meta = {
  title: 'Getting started',
  createdAt: new Date().toISOString(),
} satisfies SlideMeta;

export const notes = [
  'Welcome to open-slide for Svelte.',
  'Each page is a normal Svelte component imported by this deck index.',
];
