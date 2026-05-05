import { normalizeCssColor, parseCssPx, readElementRect, readElementTextStyle } from './css';
import {
  createPptxSlide,
  isRenderableNode,
  type PptxDiagnostic,
  type PptxSceneNode,
  type PptxShapeNode,
  type PptxSlideScene,
} from './scene';

const PPTX_KIND_ATTR = 'data-osd-pptx-kind';

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
  const node = collectPrimitiveNode(el, canvas, primitiveKind) ?? collectFallbackNode(el, canvas);

  if (node) {
    scene.nodes.push(node);
  }
  addUnsupportedEffectDiagnostics(scene.diagnostics, style, node?.kind);

  if (primitiveKind) {
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
): PptxSceneNode | null {
  switch (primitiveKind) {
    case 'text':
      return collectTextNode(el, canvas);
    case 'image':
      return collectImageNode(el, canvas);
    case 'box':
    case 'shape':
      return collectShapeNode(el, canvas);
    default:
      return null;
  }
}

function collectFallbackNode(el: Element, canvas: HTMLElement): PptxSceneNode | null {
  if (isImageElement(el)) {
    return collectImageNode(el, canvas);
  }

  if (isTextLeaf(el)) {
    return collectTextNode(el, canvas);
  }

  return collectShapeNode(el, canvas);
}

function collectTextNode(el: Element, canvas: HTMLElement): PptxSceneNode | null {
  const rect = readElementRect(el, canvas);
  const text = normalizeText(el.textContent ?? '');
  if (!rect || !text) {
    return null;
  }

  const node = {
    ...rect,
    kind: 'text',
    style: readElementTextStyle(el),
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

function collectShapeNode(el: Element, canvas: HTMLElement): PptxSceneNode | null {
  const rect = readElementRect(el, canvas);
  if (!rect) {
    return null;
  }

  const style = readComputedStyle(el);
  const fill = normalizeCssColor(style?.backgroundColor ?? '');
  const stroke = readStroke(style);
  const radius = parseCssPx(style?.borderRadius ?? '') ?? 0;

  if (!fill && !stroke && radius <= 0) {
    return null;
  }

  const node = {
    ...rect,
    ...(fill ? { fill } : {}),
    ...(stroke ? { stroke } : {}),
    kind: 'shape',
    shape: radius > 0 ? 'roundRect' : 'rect',
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

function isTextLeaf(el: Element): boolean {
  return el.children.length === 0 && normalizeText(el.textContent ?? '').length > 0;
}

function readImageSrc(el: Element): string | undefined {
  return (
    readStringProperty(el, 'currentSrc') ??
    readStringProperty(el, 'src') ??
    el.getAttribute('src') ??
    undefined
  );
}

function readStroke(style: CSSStyleDeclaration | null): PptxShapeNode['stroke'] | undefined {
  if (!style || style.borderStyle === 'none') {
    return undefined;
  }

  const width = readBorderWidth(style);
  const color = normalizeCssColor(style.borderColor);
  if (!width && !color) {
    return undefined;
  }

  return {
    ...(color ? { color } : {}),
    ...(width ? { width } : {}),
  };
}

function readBorderWidth(style: CSSStyleDeclaration): number | undefined {
  const widths = [
    style.borderTopWidth,
    style.borderRightWidth,
    style.borderBottomWidth,
    style.borderLeftWidth,
  ]
    .map((width) => parseCssPx(width))
    .filter((width): width is number => width !== undefined && width > 0);

  return widths[0];
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

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
