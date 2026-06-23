export type Rect = { x: number; y: number; w: number; h: number };

export type Run = {
  text: string;
  color?: string; // hex with leading '#'
  bold?: boolean;
  italic?: boolean;
  mono?: boolean;
};

export type IRGroup = {
  kind: 'Group';
  id: string; // pg<pageIdx>-<componentName>-<n>
  name: string; // componentName (or 'Anon')
  rect: Rect;
  children: IRItem[];
};

export type IRCurvePath = {
  kind: 'CurvePath';
  id: string;
  // Points in slide-canvas px (0..1920, 0..1080).
  points: { x: number; y: number }[];
  closed: boolean;
  // Bounding rect derived from points; pptx-build uses it for <a:xfrm>.
  rect: Rect;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
  endArrow?: boolean;
  domLeafId?: string;
  classification?: LeafClassification;
};

export type IRShape = {
  kind: 'Shape';
  id: string;
  shape: 'rect' | 'roundRect' | 'ellipse' | 'line';
  rect: Rect;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
  rectRadius?: number;
  endArrow?: boolean;
  flipH?: boolean;
  flipV?: boolean;
  domLeafId?: string;
  fallbackImageDataUrl?: string;
  classification?: LeafClassification;
};

export type IRRichText = {
  kind: 'RichText';
  id: string;
  rect: Rect;
  runs: Run[];
  fontSize: number;
  fontFamily?: 'mono' | 'body' | 'display';
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  domLeafId?: string;
  fallbackImageDataUrl?: string;
  classification?: LeafClassification;
};

export type IRImage = {
  kind: 'Image';
  id: string;
  rect: Rect;
  src: string; // data: URL or filesystem path
  alt?: string;
  domLeafId?: string;
  fallbackImageDataUrl?: string;
  classification?: LeafClassification;
  // Set on synthetic Images born from Plan H1's primitive-screenshot fallback.
  // Plan K's post-release gate uses this to re-render the same primitive
  // in isolation and pixel-diff against the embedded PNG.
  srcPrimId?: string;
};

export type IRDecorBox = {
  kind: 'Decor';
  id: string;
  rect: Rect;
  background?: string;
  borderColor?: string;
  borderWidth: number;
  borderRadii: [number, number, number, number]; // tl, tr, br, bl
  boxShadow?: { offsetX: number; offsetY: number; blur: number; color: string };
  domLeafId?: string;
  fallbackImageDataUrl?: string;
  classification?: LeafClassification;
};

export type IRItem = IRGroup | IRShape | IRCurvePath | IRRichText | IRImage | IRDecorBox;

export type IRPage = {
  pageId: string;
  pageIndex: number;
  pageName: string;
  size: { w: 1920; h: 1080 };
  items: IRItem[]; // tree (groups can nest)
  // When a page wraps content in a full-bleed div with its own background
  // colour (e.g. dark-theme override of the deck-level palette.bg), that
  // decor is too large to emit as a shape (it would paint over everything)
  // but its colour needs to surface somewhere. The wrapper colour gets
  // captured here so pptx-build can apply it as the slide background.
  bgOverride?: string;
};

// Canonical leaf classes recognised by classifier. See spec §6.1.
// Plan A only tags leaves; later plans route emission based on kind.
export type NativeKind =
  | 'TextRun'
  | 'Image'
  | 'Box'
  | 'Line'
  | 'Table'
  | 'SvgIcon'
  | 'ImageFallback';

export type LeafClassification = {
  kind: NativeKind;
  // Strings that explain WHY this kind was chosen, used by fidelity report.
  // For Plan A this is informational only. Later plans use the same strings
  // as fallback reasons when the kind is something we cannot emit.
  reasons: string[];
};
