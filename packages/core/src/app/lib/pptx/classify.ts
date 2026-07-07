import { parseCssColor, transformNeedsRaster } from './units';

export type NodeKind = 'text' | 'image' | 'table' | 'shape' | 'raster' | 'container' | 'skip';

export interface NodeStyleView {
  display: string;
  visibility: string;
  filter: string;
  backdropFilter: string;
  mixBlendMode: string;
  clipPath: string;
  transform: string;
  backgroundColor: string;
  backgroundImage: string;
  borderStyle: string;
  borderTopWidth: string;
}

export interface NodeView {
  tag: string;
  isSvg: boolean;
  hasTextContent: boolean;
  childElementTags: string[];
  style: NodeStyleView;
}

export interface Classification {
  kind: NodeKind;
  recurse: boolean;
}

const NON_VISUAL = new Set(['script', 'style', 'noscript', 'template', 'head', 'meta', 'link']);

const INLINE_PHRASING = new Set([
  'a',
  'abbr',
  'b',
  'big',
  'br',
  'cite',
  'code',
  'del',
  'em',
  'i',
  'ins',
  'kbd',
  'label',
  'mark',
  'q',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'tt',
  'u',
  'var',
  'wbr',
]);

export function classifyNode(node: NodeView): Classification {
  const { tag, style } = node;

  if (NON_VISUAL.has(tag)) return leaf('skip');
  if (style.display === 'none' || style.visibility === 'hidden') return leaf('skip');

  if (needsRaster(node)) return leaf('raster');

  if (tag === 'table') return leaf('table');
  if (tag === 'img' || tag === 'video') return leaf('image');

  if (isTextLeaf(node)) return leaf('text');

  return { kind: hasVisiblePaint(style) ? 'shape' : 'container', recurse: true };
}

function leaf(kind: NodeKind): Classification {
  return { kind, recurse: false };
}

function needsRaster(node: NodeView): boolean {
  const s = node.style;
  // Graphics and un-representable geometry always rasterize.
  if (node.isSvg || node.tag === 'svg') return true;
  if (transformNeedsRaster(s.transform)) return true;
  // CSS effects with no DrawingML equivalent (filter/blur/blend/clip) only
  // rasterize when the element is a decorative graphic with no text anywhere in
  // its subtree. If it carries text, keep that text editable and drop the
  // effect rather than baking the whole subtree into an image.
  const hasUnmappableEffect =
    s.filter !== 'none' ||
    (s.backdropFilter !== 'none' && s.backdropFilter !== '') ||
    s.mixBlendMode !== 'normal' ||
    s.clipPath !== 'none';
  return hasUnmappableEffect && !node.hasTextContent;
}

function isTextLeaf(node: NodeView): boolean {
  if (!node.hasTextContent) return false;
  return node.childElementTags.every((t) => INLINE_PHRASING.has(t));
}

function hasVisiblePaint(style: NodeStyleView): boolean {
  const bg = parseCssColor(style.backgroundColor);
  if (bg && bg.alpha > 0) return true;
  if (style.backgroundImage !== 'none' && style.backgroundImage !== '') return true;
  if (style.borderStyle !== 'none' && Number.parseFloat(style.borderTopWidth) > 0) return true;
  return false;
}
