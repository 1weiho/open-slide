export type { OpenSlideBuildConfig, OpenSlideConfig } from './config.ts';
export type {
  DesignFonts,
  DesignPalette,
  DesignSystem,
  DesignTypeScale,
} from './design.ts';
export { cssVarsToString, defaultDesign, designToCssVars } from './design.ts';
export type { Locale, Plural } from './locale/types.ts';
export type {
  MorphTransition,
  SlideTransition,
  TransitionPhase,
} from './transition.ts';
export { resolveTransition } from './transition.ts';
export type { Folder, FolderIcon, FoldersManifest, SlideMeta, SlideModule } from './types.ts';
export { CANVAS_HEIGHT, CANVAS_WIDTH } from './types.ts';
