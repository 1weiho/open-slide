import type { ComponentType } from 'react';

export type SlidePage = ComponentType;

export type DeckMeta = {
  title?: string;
  theme?: 'light' | 'dark';
};

export type DeckModule = {
  default: SlidePage[];
  meta?: DeckMeta;
};

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;
