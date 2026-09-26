export type PptxColor = { color: string; opacity: number };
export type PptxRect = { x: number; y: number; w: number; h: number };
export type PptxLink = { url: string } | { slide: number };

export type PptxFontResolution = {
  source?: string;
  requested: string[];
  language: string | null;
  resolved: string;
  script: 'latin' | 'eastAsian' | 'other';
  coverage: 'supported' | 'missing' | 'unknown';
  substituted: boolean;
  reasons: string[];
  layout: { status: 'preserved' | 'safe' | 'unsafe' | 'unknown'; advanceDeltaPx: number };
};

export type PptxDiagnostic = {
  severity: 'error' | 'warning';
  code: string;
  page: number;
  source: string;
  message: string;
  suggestion: string;
  originalText?: string;
};

export type PptxRun = {
  text: string;
  fontFace: string;
  latinFontFace?: string;
  eastAsianFontFace?: string;
  fontResolutions?: PptxFontResolution[];
  fontSize: number;
  color: PptxColor;
  gradient?: PptxGradient;
  gradientBounds?: { w: number; h: number };
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  letterSpacing: number;
  lang: string;
  link?: PptxLink;
};

export type PptxParagraph = {
  runs: PptxRun[];
  align: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  spaceBefore: number;
  spaceAfter: number;
  list?: {
    kind: 'bullet' | 'number';
    start: number;
    level: number;
    indent: number;
    hanging: number;
  };
};

export type PptxStroke = PptxColor & {
  width: number;
  dash?: 'solid' | 'dash' | 'dot';
  cap?: 'flat' | 'round' | 'square';
  join?: 'round' | 'miter' | 'bevel';
};

export type PptxGradient = {
  kind: 'linear' | 'radial';
  stops: { offset: number; color: PptxColor }[];
  angle?: number;
  center?: { x: number; y: number };
  radius?: { x: number; y: number };
};

export type PptxShadow = PptxColor & {
  x: number;
  y: number;
  blur: number;
  inset?: boolean;
};

export type PptxPathCommand =
  | { type: 'move' | 'line'; x: number; y: number }
  | { type: 'cubic'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: 'close' };

type PptxObjectBase = PptxRect & {
  id: string;
  source: string;
  sourceId?: string;
  order: number;
  rotation?: number;
  shadow?: PptxShadow;
  blur?: number;
  link?: PptxLink;
};

export type PptxText = PptxObjectBase & {
  kind: 'text';
  wrap?: boolean;
  paragraphs: PptxParagraph[];
};

export type PptxShape = PptxObjectBase & {
  kind: 'shape';
  geometry: 'rect' | 'roundRect' | 'ellipse' | 'line' | 'path';
  path?: PptxPathCommand[];
  gradient?: PptxGradient;
  radius?: number;
  fill?: PptxColor;
  stroke?: PptxStroke;
  startArrow?: boolean;
  endArrow?: boolean;
  flipH?: boolean;
  flipV?: boolean;
};

export type PptxCell = {
  paragraphs: PptxParagraph[];
  fill?: PptxColor;
  borders: [PptxStroke, PptxStroke, PptxStroke, PptxStroke];
  padding: [number, number, number, number];
  valign: 'top' | 'middle' | 'bottom';
};

export type PptxTable = PptxObjectBase & {
  kind: 'table';
  rows: PptxCell[][];
  columnWidths: number[];
  rowHeights: number[];
};

export type PptxImage = PptxObjectBase & {
  kind: 'image';
  data: string;
  mime: string;
  assetId: string;
  svgData?: string;
  opacity?: number;
  crop?: { left: number; top: number; right: number; bottom: number };
};

export type PptxObject = PptxText | PptxShape | PptxTable | PptxImage;

export type PptxGroup = {
  id: string;
  source: string;
  kind: 'source' | 'explicit';
  members: string[];
};

export type PptxPage = {
  index: number;
  id: string;
  background: PptxColor;
  objects: PptxObject[];
  groups?: PptxGroup[];
  notes?: string;
  diagnostics: PptxDiagnostic[];
};

export type PptxDeck = {
  version: 1 | 2;
  id: string;
  title: string;
  width: number;
  height: number;
  pages: PptxPage[];
};

export type EditablePptxProgress = {
  phase: 'preparing' | 'processing' | 'generating' | 'generated';
  current: number;
  total: number;
  percent: number;
};

export type EditablePptxReport = {
  version: 1;
  slideId: string;
  writer: string;
  pages: { index: number; objects: number; text: number; tables: number; images: number }[];
  diagnostics: PptxDiagnostic[];
  elapsedMs: number;
  quality?: EditablePptxQuality;
};

export type PptxWrittenPage = {
  index: number;
  nativeLeafObjects: number;
  writerExtraObjects: number;
  groupContainers: number;
};

export type PptxWriteResult = {
  blob: Blob;
  pages: PptxWrittenPage[];
  diagnostics: PptxDiagnostic[];
};

export type EditablePptxQualityCounts = {
  logicalSources: number;
  irLeafObjects: number;
  nativeLeafObjects: number;
  writerExtraObjects: number;
  groupContainers: number;
  text: number;
  tables: number;
  shapes: number;
  sourceImages: number;
  vectorApproximationSources: number;
  skippedGroups: number;
  fontSubstitutionSources: number;
};

export type EditablePptxQuality = {
  version: 1;
  pages: (EditablePptxQualityCounts & { index: number })[];
  totals: EditablePptxQualityCounts;
  fonts: (PptxFontResolution & {
    page: number;
    source: string;
    latinFontFace?: string;
    eastAsianFontFace?: string;
  })[];
  recipientFonts: 'unknown';
  windows: 'not-verified';
};

export type EditablePptxOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: EditablePptxProgress) => void;
  pageIndices?: number[];
  pageTimeoutMs?: number;
  timeoutMs?: number;
};

export class EditablePptxError extends Error {
  constructor(
    message: string,
    public readonly diagnostics: PptxDiagnostic[],
  ) {
    super(message);
    this.name = 'EditablePptxError';
  }
}
