import type { PptxExportDecision } from './decision';

export const PPTX_CANVAS_WIDTH = 1920;
export const PPTX_CANVAS_HEIGHT = 1080;

export type PptxRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
};

export type PptxNodeSource = {
  tagName?: string;
  id?: string;
  className?: string;
};

export type PptxNodeMetadata = {
  decision?: PptxExportDecision;
  source?: PptxNodeSource;
};

export type PptxStroke = {
  color?: string;
  dash?: 'dash' | 'solid';
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
  charSpacing?: number;
  opacity?: number;
  fontFallbackWarning?: string;
};

export type PptxShapeKind = 'rect' | 'roundRect' | 'ellipse' | 'line';
export type PptxChartType = 'bar' | 'line' | 'pie' | 'doughnut';

export type PptxTextLine = PptxRect & {
  text: string;
};

export type PptxTextNode = PptxRect &
  PptxNodeMetadata & {
    kind: 'text';
    text: string;
    style: PptxTextStyle;
    lines?: PptxTextLine[];
    lineBreakPolicy?: 'preserve-browser-lines' | 'powerpoint-wrap';
  };

export type PptxTextRun = {
  text: string;
  style?: PptxTextStyle;
};

export type PptxRichTextNode = PptxRect &
  PptxNodeMetadata & {
    kind: 'richText';
    runs: PptxTextRun[];
    style: PptxTextStyle;
    lineBreakPolicy?: 'preserve-browser-lines' | 'powerpoint-wrap';
  };

export type PptxEquationNode = PptxRect &
  PptxNodeMetadata & {
    kind: 'equation';
    fallbackText?: string;
    inline?: boolean;
    latex?: string;
    mathml?: string;
    style: PptxTextStyle;
  };

export type PptxTableNode = PptxRect &
  PptxNodeMetadata & {
    kind: 'table';
    columns: string[];
    rows: string[][];
    style: PptxTextStyle;
  };

export type PptxChartSeries = {
  color?: string;
  name: string;
  values: number[];
};

export type PptxChartNode = PptxRect &
  PptxNodeMetadata & {
    kind: 'chart';
    chartType: PptxChartType;
    labels: string[];
    series: PptxChartSeries[];
    style: PptxTextStyle;
    title?: string;
  };

export type PptxShapeNode = PptxRect &
  PptxNodeMetadata & {
    kind: 'shape';
    shape: PptxShapeKind;
    fill?: string;
    stroke?: PptxStroke;
  };

export type PptxImageNode = PptxRect &
  PptxNodeMetadata & {
    kind: 'image';
    src: string;
    alt?: string;
    fit?: 'contain' | 'cover' | 'stretch';
  };

export type PptxRasterNode = PptxRect &
  PptxNodeMetadata & {
    kind: 'raster';
    dataUrl: string;
    reason: string;
  };

export type PptxSceneNode =
  | PptxTextNode
  | PptxRichTextNode
  | PptxEquationNode
  | PptxTableNode
  | PptxChartNode
  | PptxShapeNode
  | PptxImageNode
  | PptxRasterNode;

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

export function isRenderableNode(node: PptxRect & { kind?: string; shape?: string }): boolean {
  const isLine = (node as PptxRect & { shape?: string }).shape === 'line';
  return (
    Number.isFinite(node.x) &&
    Number.isFinite(node.y) &&
    Number.isFinite(node.w) &&
    Number.isFinite(node.h) &&
    (isLine ? node.w >= 0 && node.h >= 0 && (node.w > 0 || node.h > 0) : node.w > 0 && node.h > 0)
  );
}
