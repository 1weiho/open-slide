import type { SlideTransition } from '@open-slide/core';
import type { Component } from 'svelte';

export type Page = Component & { transition?: SlideTransition };

export type { DesignSystem, OpenSlideConfig, SlideMeta, SlideTransition } from '@open-slide/core';
export { CANVAS_HEIGHT, CANVAS_WIDTH, defaultDesign } from '@open-slide/core';
