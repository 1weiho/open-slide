import type { GradientStop, Radii, Rgba } from './css';

export type Rect = { x: number; y: number; w: number; h: number };

export type ImageFormat = 'png' | 'jpeg' | 'gif' | 'svg';

export type SceneImage = {
  id: number;
  bytes: Uint8Array;
  format: ImageFormat;
  /** Vector companion embedded next to the PNG fallback via svgBlip. */
  svg?: Uint8Array;
};

/** Fractions (0..1) of the source image trimmed from each edge. */
export type Crop = { l: number; t: number; r: number; b: number };

export type Fill =
  | { kind: 'solid'; color: Rgba }
  | { kind: 'gradient'; angleDeg: number; stops: GradientStop[] }
  | { kind: 'image'; imageId: number; crop: Crop | null; alpha: number };

export type Outline = { width: number; color: Rgba; dash: 'solid' | 'dash' | 'dot' };

export type ShadowEffect = {
  blur: number;
  dist: number;
  dirDeg: number;
  color: Rgba;
  spread: number;
  inner: boolean;
};

export type Geometry =
  | { kind: 'rect' }
  | { kind: 'roundRect'; radius: number }
  | { kind: 'ellipse' }
  | { kind: 'custom'; radii: Radii };

type NodeBase = {
  name: string;
  box: Rect;
  rotationDeg: number;
  flipV: boolean;
};

export type ShapeNode = NodeBase & {
  kind: 'shape';
  geometry: Geometry;
  fill: Fill | null;
  outline: Outline | null;
  shadow: ShadowEffect | null;
};

export type PictureNode = NodeBase & {
  kind: 'picture';
  imageId: number;
  crop: Crop | null;
  alpha: number;
  geometry: Geometry;
  outline: Outline | null;
  shadow: ShadowEffect | null;
};

export type TextShadow = { blur: number; dist: number; dirDeg: number; color: Rgba };

export type RunStyle = {
  font: string;
  sizePx: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  color: Rgba;
  letterSpacingPx: number;
  baselineShift: 'super' | 'sub' | null;
  shadow: TextShadow | null;
  outline: { width: number; color: Rgba } | null;
};

export type Run = { text: string; style: RunStyle };

export type TextLine = { runs: Run[]; sizePx: number };

export type Bullet =
  | { kind: 'char'; char: string; color: Rgba; font: string | null }
  | { kind: 'number'; scheme: string; startAt: number; color: Rgba };

export type Paragraph = {
  lineSpacingPx: number;
  lines: TextLine[];
  align: 'l' | 'ctr' | 'r' | 'just';
  bullet: Bullet | null;
  marginLeftPx: number;
  indentPx: number;
  endSizePx: number;
};

export type TextNode = NodeBase & {
  kind: 'text';
  paragraphs: Paragraph[];
  /** Uniform scale carried by the world transform; font metrics are pre-multiplied. */
};

export type SceneNode = ShapeNode | PictureNode | TextNode;

export type SlideScene = {
  background: Fill | null;
  nodes: SceneNode[];
  notes: string | null;
};

export type DeckScene = {
  slides: SlideScene[];
  images: SceneImage[];
};
