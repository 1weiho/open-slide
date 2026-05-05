export const PPTX_CANVAS_WIDTH = 1920;
export const PPTX_CANVAS_HEIGHT = 1080;

export type PptxRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
};

export type PptxStroke = {
  color?: string;
  width?: number;
  opacity?: number;
};

export type PptxTextStyle = {
  color?: string;
  fontFace?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify';
  valign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  opacity?: number;
};

export type PptxTextNode = PptxRect & {
  kind: 'text';
  text: string;
  style: PptxTextStyle;
};

export type PptxShapeNode = PptxRect & {
  kind: 'shape';
  shape: 'rect' | 'roundRect' | 'ellipse' | 'line';
  fill?: string;
  stroke?: PptxStroke;
};

export type PptxImageNode = PptxRect & {
  kind: 'image';
  src: string;
  alt?: string;
  fit?: 'contain' | 'cover' | 'stretch';
};

export type PptxRasterNode = PptxRect & {
  kind: 'raster';
  dataUrl: string;
  reason: string;
};

export type PptxSceneNode = PptxTextNode | PptxShapeNode | PptxImageNode | PptxRasterNode;

export type PptxDiagnostic = {
  level: 'info' | 'warn';
  message: string;
  nodeKind?: PptxSceneNode['kind'];
};

export type PptxSlideScene = {
  width: number;
  height: number;
  nodes: PptxSceneNode[];
  diagnostics: PptxDiagnostic[];
};

export function createPptxSlide(scene: Partial<PptxSlideScene> = {}): PptxSlideScene {
  return {
    width: scene.width ?? PPTX_CANVAS_WIDTH,
    height: scene.height ?? PPTX_CANVAS_HEIGHT,
    nodes: scene.nodes ?? [],
    diagnostics: scene.diagnostics ?? [],
  };
}

export function isRenderableNode(node: PptxRect & { kind?: string }): boolean {
  return (
    Number.isFinite(node.x) &&
    Number.isFinite(node.y) &&
    Number.isFinite(node.w) &&
    Number.isFinite(node.h) &&
    node.w > 0 &&
    node.h > 0
  );
}
