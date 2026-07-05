export type { ImagePlaceholderProps } from './app/components/image-placeholder.tsx';
export { ImagePlaceholder } from './app/components/image-placeholder.tsx';
export type { unstable_SharedElementProps } from './app/components/shared-element.tsx';
export { unstable_SharedElement } from './app/components/shared-element.tsx';
export type {
  DesignFonts,
  DesignPalette,
  DesignSystem,
  DesignTypeScale,
} from './app/lib/design.ts';
export { cssVarsToString, defaultDesign, designToCssVars } from './app/lib/design.ts';
export { useSlidePageNumber } from './app/lib/page-context.tsx';
export type { Page, SlideMeta, SlideModule } from './app/lib/sdk.ts';
export { CANVAS_HEIGHT, CANVAS_WIDTH } from './app/lib/sdk.ts';
export type { StepProps, StepsProps } from './app/lib/step-context.tsx';
export { Step, Steps } from './app/lib/step-context.tsx';
export type {
  SharedElementTransition,
  SlideTransition,
  TransitionPhase,
} from './app/lib/transition.ts';
export type { OpenSlideConfig } from './config.ts';
export type { Locale, Plural } from './locale/types.ts';
