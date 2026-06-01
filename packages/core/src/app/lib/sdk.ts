import type { ComponentType } from 'react';
import type { DesignSystem } from './design.ts';
import type { SlideTransition } from './transition.ts';

export type Page = ComponentType & { transition?: SlideTransition };

export type SlideAspect = '16:9' | '4:3';

export type SlideMeta = {
  title?: string;
  theme?: string;
  /** ISO 8601 timestamp. Set once at scaffold time; used to sort the slide list. */
  createdAt?: string;
  /** Canvas aspect ratio. Defaults to '16:9' when omitted. */
  aspect?: SlideAspect;
};

export type SlideModule = {
  default: Page[];
  meta?: SlideMeta;
  design?: DesignSystem;
  // Index-aligned with `default`.
  notes?: (string | undefined)[];
  transition?: SlideTransition;
};

export type FolderIcon = { type: 'emoji'; value: string } | { type: 'color'; value: string };

export type Folder = {
  id: string;
  name: string;
  icon: FolderIcon;
};

export type FoldersManifest = {
  folders: Folder[];
  assignments: Record<string, string>;
};

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;
export const CANVAS_WIDTH_4_3 = 1440;

export const DEFAULT_ASPECT: SlideAspect = '16:9';

export function getCanvasDims(aspect: SlideAspect | undefined): { width: number; height: number } {
  return aspect === '4:3'
    ? { width: CANVAS_WIDTH_4_3, height: CANVAS_HEIGHT }
    : { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
}
