import type { ComponentType } from 'react';
import type { DesignSystem } from './design.ts';

export type Page = ComponentType;

export type SlideMeta = {
  title?: string;
};

export type SlideModule = {
  default: Page[];
  meta?: SlideMeta;
  design?: DesignSystem;
  // Index-aligned with `default`. Each entry is the speaker note for the
  // page at the same position. Used by Presenter View only.
  notes?: (string | undefined)[];
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
