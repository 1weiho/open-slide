import type { DesignSystem } from './design.ts';
import type { SlideTransition } from './transition.ts';

export type SlideMeta = {
  title?: string;
  theme?: string;
  createdAt?: string;
};

export type SlideModule<TPage = unknown> = {
  default: TPage[];
  meta?: SlideMeta;
  design?: DesignSystem;
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
