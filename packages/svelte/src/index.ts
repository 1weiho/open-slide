import type { SlideTransition } from '@open-slide/shared';
import type { Component } from 'svelte';

export type Page = Component & { transition?: SlideTransition };

export type { DesignSystem, OpenSlideConfig, SlideMeta, SlideTransition } from '@open-slide/shared';
export { CANVAS_HEIGHT, CANVAS_WIDTH, defaultDesign } from '@open-slide/shared';
export { getSlidePageNumber } from './components/page-context.ts';
