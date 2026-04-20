import type { ComponentType } from 'react';

export type Page = ComponentType;

export type SlideMeta = {
  title?: string;
  theme?: 'light' | 'dark';
};

export type SlideModule = {
  default: Page[];
  meta?: SlideMeta;
};

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;
