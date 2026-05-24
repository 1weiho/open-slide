import { normalizeCssColor, parseCssPx, readElementRect, readElementTextStyle } from './css';
import {
  createPptxSlide,
  isRenderableNode,
  type PptxDiagnostic,
  type PptxEquationNode,
  type PptxRect,
  type PptxRichTextNode,
  type PptxSceneNode,
  type PptxShapeKind,
  type PptxShapeNode,
  type PptxSlideScene,
  type PptxStroke,
  type PptxTextRun,
  type PptxTextStyle,
} from './scene';

const PPTX_KIND_ATTR = 'data-osd-pptx-kind';
const PPTX_SHAPE_ATTR = 'data-osd-pptx-shape';
const PPTX_RASTER_REASON_ATTR = 'data-osd-pptx-reason';
const PPTX_EQUATION_FALLBACK_ATTR = 'data-osd-pptx-fallback';
const PPTX_EQUATION_INLINE_ATTR = 'data-osd-pptx-inline';
const PPTX_EQUATION_LATEX_ATTR = 'data-osd-pptx-latex';
const PPTX_EQUATION_MATHML_ATTR = 'data-osd-pptx-mathml';
const SVG_NS = 'http://www.w3.org/2000/svg';

const TEXT_CONTAINER_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'SPAN']);
const INLINE_TEXT_TAGS = new Set([
  'A',
  'ABBR',
  'B',
  'BR',
  'CITE',
  'CODE',
  'EM',
  'I',
  'KBD',
  'MARK',
  'S',
  'SMALL',
  'SPAN',
  'STRONG',
  'SUB',
  'SUP',
  'TIME',
  'U',
]);
const BORDER_SIDES = ['Top', 'Right', 'Bottom', 'Left'] as const;
const LINE_TOP_TOLERANCE_PX = 4;
const TEXT_WIDTH_CUSHION_RATIO = 0.08;
const TEXT_WIDTH_CUSHION_MAX_PX = 96;

type BorderSideName = (typeof BORDER_SIDES)[number];

type BorderSide = {
  color?: string;
  dash?: PptxStroke['dash'];
  side: BorderSideName;
  width?: number;
};

export function collectDomPptxScene(canvas: HTMLElement): PptxSlideScene {
  const canvasRect = canvas.getBoundingClientRect();
  const scene = createPptxSlide({
    height: canvasRect.height > 0 ? canvasRect.height : undefined,
    width: canvasRect.width > 0 ? canvasRect.width : undefined,
  });

  for (const child of Array.from(canvas.children)) {
    collectElement(child, canvas, scene);
  }

  return scene;
}

export function logPptxDiagnostics(slideIndex: number, diagnostics: PptxDiagnostic[]): void {
  for (const diagnostic of diagnostics) {
    const message = `[open-slide:pptx] slide ${slideIndex + 1}: ${diagnostic.message}`;
    if (diagnostic.level === 'warn') {
      console.warn(message);
    } else {
      console.info(message);
    }
  }
}

function collectElement(el: Element, canvas: HTMLElement, scene: PptxSlideScene): void {
  const style = readComputedStyle(el);
  if (isHidden(style)) {
    return;
  }

  const primitiveKind = el.getAttribute(PPTX_KIND_ATTR);
  if (primitiveKind === 'group') {
    addUnsupportedEffectDiagnostics(scene.diagnostics, style);
    for (const child of Array.from(el.children)) {
      collectElement(child, canvas, scene);
    }
    return;
  }

  const node =
    collectPrimitiveNode(el, canvas, primitiveKind, scene.diagnostics) ??
    collectFallbackNode(el, canvas, scene.diagnostics);

  if (node) {
    scene.nodes.push(node);
  }
  addUnsupportedEffectDiagnostics(scene.diagnostics, style, node?.kind);

  if (
    primitiveKind === 'text' ||
    primitiveKind === 'image' ||
    primitiveKind === 'shape' ||
    primitiveKind === 'equation' ||
    node?.kind === 'text' ||
    node?.kind === 'richText' ||
    isImageElement(el) ||
    isSvgElement(el)
  ) {
    return;
  }

  for (const child of Array.from(el.children)) {
    collectElement(child, canvas, scene);
  }
}

function collectPrimitiveNode(
  el: Element,
  canvas: HTMLElement,
  primitiveKind: string | null,
  diagnostics: PptxDiagnostic[],
): PptxSceneNode | null {
  switch (primitiveKind) {
    case 'text':
      return collectTextNode(el, canvas, diagnostics);
    case 'image':
      return collectImageNode(el, canvas);
    case 'raster':
      return collectRasterNode(el, canvas);
    case 'equation':
      return collectEquationNode(el, canvas, diagnostics);
    case 'box':
      return collectShapeNode(el, canvas);
    case 'shape':
      return collectShapeNode(el, canvas, readExplicitShape(el));
    default:
      return null;
  }
}

function collectFallbackNode(
  el: Element,
  canvas: HTMLElement,
  diagnostics: PptxDiagnostic[],
): PptxSceneNode | null {
  if (isImageElement(el)) {
    return collectImageNode(el, canvas);
  }

  if (isSvgElement(el)) {
    return collectSvgImageNode(el, canvas);
  }

  if (isTextElement(el)) {
    return collectTextNode(el, canvas, diagnostics);
  }

  return collectShapeNode(el, canvas);
}

function collectTextNode(
  el: Element,
  canvas: HTMLElement,
  diagnostics: PptxDiagnostic[],
): PptxSceneNode | null {
  const rect = readElementRect(el, canvas);
  const text = readElementText(el);
  if (!rect || !text) {
    return null;
  }
  const style = readElementTextStyle(el);
  addFontFallbackDiagnostic(diagnostics, style, 'text');
  const adjustedRect = expandTextRect(rect, canvas, style.align);

  if (hasInlineFormatting(el)) {
    const runs = collectInlineTextRuns(el, style);
    if (runs.length > 0) {
      const node = {
        ...adjustedRect,
        kind: 'richText',
        lineBreakPolicy: lineBreakPolicyForText(el, text, style),
        runs,
        style,
      } satisfies PptxRichTextNode;

      return isRenderableNode(node) ? node : null;
    }
  }

  const node = {
    ...adjustedRect,
    kind: 'text',
    lineBreakPolicy: lineBreakPolicyForText(el, text, style),
    style,
    text,
  } satisfies PptxSceneNode;

  return isRenderableNode(node) ? node : null;
}

function collectImageNode(el: Element, canvas: HTMLElement): PptxSceneNode | null {
  const rect = readElementRect(el, canvas);
  const src = readImageSrc(el);
  if (!rect || !src) {
    return null;
  }

  const alt = readStringProperty(el, 'alt') ?? el.getAttribute('alt') ?? undefined;
  const node = {
    ...rect,
    ...(alt ? { alt } : {}),
    kind: 'image',
    src,
  } satisfies PptxSceneNode;

  return isRenderableNode(node) ? node : null;
}

function collectRasterNode(el: Element, canvas: HTMLElement): PptxSceneNode | null {
  const rect = readElementRect(el, canvas);
  const dataUrl = readImageSrc(el);
  if (!rect || !dataUrl) {
    return null;
  }

  const reason = el.getAttribute(PPTX_RASTER_REASON_ATTR) ?? 'explicit raster layer';
  const node = {
    ...rect,
    dataUrl,
    decision: { kind: 'raster', reason },
    kind: 'raster',
    reason,
  } satisfies PptxSceneNode;

  return isRenderableNode(node) ? node : null;
}

function collectEquationNode(
  el: Element,
  canvas: HTMLElement,
  diagnostics: PptxDiagnostic[],
): PptxSceneNode | null {
  const rect = readElementRect(el, canvas);
  if (!rect) {
    return null;
  }

  const latex = el.getAttribute(PPTX_EQUATION_LATEX_ATTR) ?? undefined;
  const mathml = el.getAttribute(PPTX_EQUATION_MATHML_ATTR) ?? undefined;
  const fallbackText =
    el.getAttribute(PPTX_EQUATION_FALLBACK_ATTR) ?? readElementText(el) ?? latex ?? mathml;
  const reason = 'Equation exported as editable fallback text; native OfficeMath is not implemented';
  diagnostics.push({ level: 'warn', message: reason, nodeKind: 'equation' });

  const node = {
    ...rect,
    decision: { kind: 'native-reduced', reason },
    fallbackText,
    inline: el.getAttribute(PPTX_EQUATION_INLINE_ATTR) === 'true',
    kind: 'equation',
    ...(latex ? { latex } : {}),
    ...(mathml ? { mathml } : {}),
    style: readElementTextStyle(el),
  } satisfies PptxEquationNode;

  return isRenderableNode(node) ? node : null;
}

function collectSvgImageNode(el: Element, canvas: HTMLElement): PptxSceneNode | null {
  const rect = readElementRect(el, canvas);
  if (!rect) {
    return null;
  }

  const node = {
    ...rect,
    alt: el.getAttribute('aria-label') ?? undefined,
    fit: 'stretch',
    kind: 'image',
    src: svgToDataUrl(el, rect.w, rect.h),
  } satisfies PptxSceneNode;

  return isRenderableNode(node) ? node : null;
}

function collectShapeNode(
  el: Element,
  canvas: HTMLElement,
  explicitShape?: PptxShapeKind,
): PptxSceneNode | null {
  const rect = readElementRect(el, canvas);
  if (!rect) {
    return null;
  }

  const style = readComputedStyle(el);
  const fill = normalizeCssColor(style?.backgroundColor ?? '');
  const borderSides = readBorderSides(style);
  const stroke = readUniformStroke(borderSides);
  const radius = parseCssPx(style?.borderRadius ?? '') ?? 0;

  if (!explicitShape && !fill && borderSides.length === 1 && radius <= 0) {
    return lineNodeForBorderSide(rect, borderSides[0]);
  }

  if (!explicitShape && !fill && !stroke && radius <= 0) {
    return null;
  }

  const shape = explicitShape ?? (radius > 0 ? 'roundRect' : 'rect');
  const node = {
    ...rect,
    ...(fill ? { fill } : {}),
    ...(stroke ? { stroke } : {}),
    kind: 'shape',
    shape,
  } satisfies PptxShapeNode;

  return isRenderableNode(node) ? node : null;
}

function isHidden(style: CSSStyleDeclaration | null): boolean {
  if (!style) {
    return false;
  }

  return (
    style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || '1') <= 0
  );
}

function isImageElement(el: Element): boolean {
  return el.tagName.toLowerCase() === 'img';
}

function isSvgElement(el: Element): boolean {
  return el.tagName.toLowerCase() === 'svg';
}

function isTextElement(el: Element): boolean {
  const text = readElementText(el);
  if (!text) {
    return false;
  }

  if (el.children.length === 0) {
    return true;
  }

  const tagName = el.tagName.toUpperCase();
  if (!TEXT_CONTAINER_TAGS.has(tagName)) {
    return false;
  }

  return Array.from(el.children).every((child) =>
    INLINE_TEXT_TAGS.has(child.tagName.toUpperCase()),
  );
}

function hasInlineFormatting(el: Element): boolean {
  return Array.from(el.children).some((child) => {
    const tagName = child.tagName.toUpperCase();
    return tagName !== 'BR' && INLINE_TEXT_TAGS.has(tagName) && readElementText(child).length > 0;
  });
}

function lineBreakPolicyForText(
  el: Element,
  text: string,
  style: PptxTextStyle,
): 'preserve-browser-lines' | 'powerpoint-wrap' {
  const tagName = el.tagName.toUpperCase();
  const isHeading = /^H[1-6]$/.test(tagName);
  const isLarge = (style.fontSize ?? 0) >= 56;
  return text.includes('\n') || isHeading || isLarge ? 'preserve-browser-lines' : 'powerpoint-wrap';
}

function readImageSrc(el: Element): string | undefined {
  return (
    readStringProperty(el, 'currentSrc') ??
    readStringProperty(el, 'src') ??
    el.getAttribute('src') ??
    undefined
  );
}

function readExplicitShape(el: Element): PptxShapeKind | undefined {
  const value = el.getAttribute(PPTX_SHAPE_ATTR);
  if (value === 'rect' || value === 'roundRect' || value === 'ellipse' || value === 'line') {
    return value;
  }
  return undefined;
}

function readBorderSides(style: CSSStyleDeclaration | null): BorderSide[] {
  if (!style) {
    return [];
  }

  const sides: BorderSide[] = [];
  for (const side of BORDER_SIDES) {
    const borderStyle = readStyleProperty(style, `border${side}Style`);
    const width = parseCssPx(readStyleProperty(style, `border${side}Width`) ?? '');
    const color = normalizeCssColor(readStyleProperty(style, `border${side}Color`) ?? '');
    if (!borderStyle || borderStyle === 'none' || borderStyle === 'hidden' || !width || !color) {
      continue;
    }

    sides.push({
      color,
      dash: borderStyle === 'dashed' ? 'dash' : 'solid',
      side,
      width,
    });
  }
  return sides;
}

function readUniformStroke(borderSides: BorderSide[]): PptxShapeNode['stroke'] | undefined {
  if (borderSides.length !== BORDER_SIDES.length) {
    return undefined;
  }

  const [first] = borderSides;
  if (!first) {
    return undefined;
  }

  return {
    ...(first.color ? { color: first.color } : {}),
    ...(first.dash ? { dash: first.dash } : {}),
    ...(first.width ? { width: first.width } : {}),
  };
}

function lineNodeForBorderSide(rect: PptxRect, border: BorderSide): PptxShapeNode {
  const stroke = {
    ...(border.color ? { color: border.color } : {}),
    ...(border.dash ? { dash: border.dash } : {}),
    ...(border.width ? { width: border.width } : {}),
  };

  switch (border.side) {
    case 'Top':
      return { h: 0, kind: 'shape', shape: 'line', stroke, w: rect.w, x: rect.x, y: rect.y };
    case 'Right':
      return {
        h: rect.h,
        kind: 'shape',
        shape: 'line',
        stroke,
        w: 0,
        x: rect.x + rect.w,
        y: rect.y,
      };
    case 'Bottom':
      return {
        h: 0,
        kind: 'shape',
        shape: 'line',
        stroke,
        w: rect.w,
        x: rect.x,
        y: rect.y + rect.h,
      };
    case 'Left':
      return { h: rect.h, kind: 'shape', shape: 'line', stroke, w: 0, x: rect.x, y: rect.y };
  }
}

function expandTextRect(
  rect: PptxRect,
  canvas: HTMLElement,
  align: PptxTextStyle['align'],
): PptxRect {
  const canvasRect = canvas.getBoundingClientRect();
  const maxWidth = Math.max(0, canvasRect.width - rect.x);
  const cushion = Math.min(TEXT_WIDTH_CUSHION_MAX_PX, rect.w * TEXT_WIDTH_CUSHION_RATIO);
  const extra = Math.max(0, Math.min(cushion, maxWidth - rect.w));

  if (extra <= 0) {
    return rect;
  }

  if (align === 'right') {
    const leftExtra = Math.min(extra, rect.x);
    return { ...rect, w: rect.w + leftExtra, x: rect.x - leftExtra };
  }

  if (align === 'center') {
    const leftExtra = Math.min(extra / 2, rect.x);
    const rightExtra = Math.min(extra - leftExtra, canvasRect.width - (rect.x + rect.w));
    return { ...rect, w: rect.w + leftExtra + rightExtra, x: rect.x - leftExtra };
  }

  return { ...rect, w: rect.w + extra };
}

function addUnsupportedEffectDiagnostics(
  diagnostics: PptxDiagnostic[],
  style: CSSStyleDeclaration | null,
  nodeKind?: PptxSceneNode['kind'],
): void {
  if (!style) {
    return;
  }

  const effects = [
    ['filter', style.filter],
    ['backdrop-filter', readStyleProperty(style, 'backdropFilter')],
    ['box-shadow', style.boxShadow],
    ['text-shadow', style.textShadow],
  ].filter(([, value]) => value && value !== 'none');

  for (const [name, value] of effects) {
    diagnostics.push({
      level: 'warn',
      message: `Unsupported CSS ${name} is not exported as an editable PPTX effect: ${value}`,
      ...(nodeKind ? { nodeKind } : {}),
    });
  }
}

function addFontFallbackDiagnostic(
  diagnostics: PptxDiagnostic[],
  style: PptxTextStyle,
  nodeKind: PptxSceneNode['kind'],
): void {
  if (!style.fontFallbackWarning) {
    return;
  }

  diagnostics.push({
    level: 'warn',
    message: style.fontFallbackWarning,
    nodeKind,
  });
}

function readComputedStyle(el: Element): CSSStyleDeclaration | null {
  return typeof globalThis.getComputedStyle === 'function' ? globalThis.getComputedStyle(el) : null;
}

function readStringProperty(el: Element, property: string): string | undefined {
  const value = (el as unknown as Record<string, unknown>)[property];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readStyleProperty(style: CSSStyleDeclaration, property: string): string | undefined {
  const value = (style as unknown as Record<string, unknown>)[property];
  return typeof value === 'string' ? value : undefined;
}

function readElementText(el: Element): string {
  return (
    readRenderedText(el) ??
    normalizeText(readStringProperty(el, 'innerText') ?? el.textContent ?? '')
  );
}

function collectInlineTextRuns(el: Element, inheritedStyle: PptxTextStyle): PptxTextRun[] {
  const runs: PptxTextRun[] = [];

  const visit = (node: Node | Element, style: PptxTextStyle) => {
    if (isTextNodeLike(node)) {
      addTextRun(runs, normalizeRunText(node.data), style);
      return;
    }

    if (!isElementNodeLike(node)) {
      return;
    }

    const element = node as Element;
    if (element.tagName.toUpperCase() === 'BR') {
      addTextRun(runs, '\n', style);
      return;
    }

    const elementStyle = { ...style, ...readElementTextStyle(element) };
    const childNodes = readChildNodes(element);
    if (childNodes.length === 0) {
      addTextRun(runs, normalizeRunText(element.textContent ?? ''), elementStyle);
      return;
    }

    for (const child of childNodes) {
      visit(child, elementStyle);
    }
  };

  for (const child of readChildNodes(el)) {
    visit(child, inheritedStyle);
  }

  return runs.filter((run) => run.text.length > 0);
}

function addTextRun(runs: PptxTextRun[], text: string, style: PptxTextStyle): void {
  if (!text) {
    return;
  }

  const previous = runs.at(-1);
  if (previous && textStylesEqual(previous.style ?? {}, style)) {
    previous.text += text;
    return;
  }

  runs.push({ text, style });
}

function textStylesEqual(a: PptxTextStyle, b: PptxTextStyle): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function normalizeRunText(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t\f\v]+/g, ' ');
}

function readChildNodes(el: Element): Array<Node | Element> {
  const childNodes = (el as unknown as { childNodes?: ArrayLike<Node | Element> }).childNodes;
  if (childNodes && childNodes.length > 0) {
    return Array.from(childNodes);
  }
  return Array.from(el.children);
}

function isTextNodeLike(node: Node | Element): node is Text {
  return typeof (node as unknown as { data?: unknown }).data === 'string';
}

function isElementLike(node: Node | Element): boolean {
  return typeof (node as unknown as { tagName?: unknown }).tagName === 'string';
}

function isElementNodeLike(node: Node | Element): boolean {
  return typeof Element !== 'undefined' ? node instanceof Element : isElementLike(node);
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function readRenderedText(el: Element): string | null {
  if (!canMeasureTextRanges(el)) {
    return null;
  }

  const segments = collectTextSegments(el);
  if (segments.length === 0) {
    return null;
  }

  const lines: string[] = [];
  let currentLine = '';
  let currentTop: number | null = null;

  for (const segment of segments) {
    if (segment.kind === 'break') {
      if (currentLine) lines.push(currentLine);
      currentLine = '';
      currentTop = null;
      continue;
    }

    if (
      currentTop !== null &&
      Math.abs(segment.top - currentTop) > LINE_TOP_TOLERANCE_PX &&
      currentLine
    ) {
      lines.push(currentLine);
      currentLine = '';
    }

    currentTop = segment.top;
    currentLine = currentLine ? `${currentLine} ${segment.text}` : segment.text;
  }

  if (currentLine) lines.push(currentLine);
  const text = lines.join('\n');
  return text ? normalizeText(text) : null;
}

type TextSegment = { kind: 'word'; text: string; top: number } | { kind: 'break' };

function collectTextSegments(root: Element): TextSegment[] {
  const segments: TextSegment[] = [];
  const range = document.createRange();

  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      collectTextNodeSegments(node as Text, range, segments);
      return;
    }

    if (!(node instanceof Element)) {
      return;
    }

    if (node.tagName.toUpperCase() === 'BR') {
      segments.push({ kind: 'break' });
      return;
    }

    for (const child of Array.from(node.childNodes)) {
      visit(child);
    }
  };

  visit(root);
  range.detach();
  return segments;
}

function collectTextNodeSegments(node: Text, range: Range, segments: TextSegment[]): void {
  const text = node.data;
  const wordRe = /\S+/g;

  for (let match = wordRe.exec(text); match !== null; match = wordRe.exec(text)) {
    const word = match[0];
    range.setStart(node, match.index);
    range.setEnd(node, match.index + word.length);

    const rect = firstUsableRect(range);
    if (!rect) {
      continue;
    }

    segments.push({ kind: 'word', text: word, top: rect.top });
  }
}

function firstUsableRect(range: Range): DOMRect | null {
  for (const rect of Array.from(range.getClientRects())) {
    if (rect.width > 0 || rect.height > 0) {
      return rect;
    }
  }

  return null;
}

function canMeasureTextRanges(el: Element): boolean {
  return (
    typeof document !== 'undefined' &&
    typeof document.createRange === 'function' &&
    typeof Node !== 'undefined' &&
    typeof Text !== 'undefined' &&
    typeof Element !== 'undefined' &&
    typeof el.childNodes !== 'undefined'
  );
}

function svgToDataUrl(el: Element, width: number, height: number): string {
  const clone = el.cloneNode(true) as SVGElement;
  clone.setAttribute('xmlns', SVG_NS);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  const serialized = new XMLSerializer().serializeToString(clone);
  const bytes = new TextEncoder().encode(serialized);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}
