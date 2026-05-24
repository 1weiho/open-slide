export type { ImagePlaceholderProps } from './app/components/image-placeholder.tsx';
export { ImagePlaceholder } from './app/components/image-placeholder.tsx';
export type {
  PptxBoxProps,
  PptxGroupProps,
  PptxImageProps,
  PptxPrimitiveKind,
  PptxRasterLayerProps,
  PptxShapeKind,
  PptxShapeProps,
  PptxTextProps,
} from './app/components/pptx/index.tsx';
export {
  PptxBox,
  PptxGroup,
  PptxImage,
  PptxRasterLayer,
  PptxShape,
  PptxText,
} from './app/components/pptx/index.tsx';
export type {
  DesignFonts,
  DesignPalette,
  DesignSystem,
  DesignTypeScale,
} from './app/lib/design.ts';
export { cssVarsToString, defaultDesign, designToCssVars } from './app/lib/design.ts';
export type { Page, SlideMeta, SlideModule } from './app/lib/sdk.ts';
export { CANVAS_HEIGHT, CANVAS_WIDTH } from './app/lib/sdk.ts';
export type { OpenSlideConfig } from './config.ts';
export type { Locale, Plural } from './locale/types.ts';
