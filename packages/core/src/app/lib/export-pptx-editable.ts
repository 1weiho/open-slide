const SLIDE_W = 1920;
const SLIDE_H = 1080;
const EMU_W = 12192000;
const EMU_H = 6858000;
const CSS_PX_EMU = EMU_W / SLIDE_W;
const CSS_PX_PT = CSS_PX_EMU / 12700;
const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const OD_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const IMAGE_REL = `${OD_REL}/image`;

type PptxGradientStop = {
  color: string;
  position: number;
};

type PptxFill =
  | string
  | {
      kind: 'linearGradient';
      angle: number;
      stops: PptxGradientStop[];
    }
  | null;

type PptxStroke = {
  color: string;
  width: number;
};

type PptxShadow = {
  color: string;
  blur: number;
  distance: number;
  angle: number;
};

type PptxBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  opacity?: number;
  shadow?: PptxShadow | null;
};

type PptxTextRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  letterSpacing?: number;
  opacity?: number;
  textTransform?: string;
};

type PptxTextStyle = Omit<PptxTextRun, 'text'>;

type PptxShapeObject = PptxBox & {
  kind: 'shape';
  radius?: number;
  fill?: PptxFill;
  stroke?: PptxStroke | null;
  shadow?: PptxShadow | null;
};

type PptxTextObject = PptxBox & {
  kind: 'text';
  paragraphs: PptxTextRun[][];
  align?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  wrap?: boolean;
};

type PptxImageObject = PptxBox & {
  kind: 'image';
  alt?: string;
  mime: string;
  data: Uint8Array;
  crop?: PptxImageCrop;
};

type PptxImageCrop = {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
};

type PptxTableCell = {
  text: string;
  fill?: PptxFill;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  align?: PptxTextObject['align'];
};

type PptxTableObject = PptxBox & {
  kind: 'table';
  rows: PptxTableCell[][];
  columnWidths?: number[];
  rowHeights?: number[];
};

type PptxObject = PptxShapeObject | PptxTextObject | PptxImageObject | PptxTableObject;

export type EditablePptxSlide = {
  background?: PptxFill;
  objects: PptxObject[];
  visualSnapshot?: PptxImageObject;
};

type MediaRef = {
  data: Uint8Array;
  ext: string;
  relId: string;
};

type ParsedColor = {
  hex: string;
  alpha: number;
};

type SlideRels = {
  rels: string[];
  media: MediaRef[];
};

type SlideBuildContext = {
  shapeId: number;
  rels: string[];
  media: MediaRef[];
};

export async function collectEditableSlide(frame: HTMLElement): Promise<EditablePptxSlide> {
  const rootRect = frame.getBoundingClientRect();
  const rootStyles = getComputedStyle(frame);
  const objects: PptxObject[] = [];
  const skipped = new WeakSet<Element>();

  for (const el of Array.from(frame.querySelectorAll<HTMLElement>('*'))) {
    if (skipped.has(el)) continue;

    const styles = getComputedStyle(el);
    const box = elementBox(el, rootRect, styles);
    if (!box) continue;

    if (shouldRasterizeElement(el, styles)) {
      const image = await rasterizeElement(el, box);
      if (image) {
        objects.push({ ...image, shadow: parseCssShadow(styles.boxShadow) });
        markDescendants(el, skipped);
      }
      continue;
    }

    if (el instanceof HTMLImageElement) {
      const image = await imageFromElement(el, box, styles);
      if (image) objects.push({ ...image, shadow: parseCssShadow(styles.boxShadow) });
      continue;
    }

    if (el instanceof HTMLTableElement) {
      const table = tableFromElement(el, box);
      if (table) {
        objects.push(table);
        markDescendants(el, skipped);
      }
      continue;
    }

    const fill = fillFromStyles(styles);
    const stroke = strokeFromStyles(styles);
    const borderShapes = stroke ? [] : borderShapesFromStyles(box, styles);
    if (fill || stroke) {
      objects.push({
        kind: 'shape',
        ...box,
        radius: maxBorderRadius(styles),
        fill,
        stroke,
        shadow: parseCssShadow(styles.boxShadow),
      });
    }
    objects.push(...borderShapes);

    const text = textFromElement(el, box, styles);
    if (text) {
      objects.push(text);
      markDescendants(el, skipped);
    }
  }

  return {
    background: fillFromStyles(rootStyles) ?? '#ffffff',
    objects,
  };
}

export async function buildEditablePptx(slides: EditablePptxSlide[]): Promise<Uint8Array> {
  const { zipSync, strToU8 } = await import('fflate');
  const files: Record<string, Uint8Array> = {};
  const slideRels: SlideRels[] = [];

  files['[Content_Types].xml'] = strToU8(editableContentTypesXml(slides.length));
  files['_rels/.rels'] = strToU8(rootRelsXml());
  files['ppt/presentation.xml'] = strToU8(presentationXml(slides.length));
  files['ppt/_rels/presentation.xml.rels'] = strToU8(presentationRelsXml(slides.length));
  files['ppt/presProps.xml'] = strToU8(presPropsXml());
  files['ppt/theme/theme1.xml'] = strToU8(themeXml());
  files['ppt/slideMasters/slideMaster1.xml'] = strToU8(slideMasterXml());
  files['ppt/slideMasters/_rels/slideMaster1.xml.rels'] = strToU8(slideMasterRelsXml());
  files['ppt/slideLayouts/slideLayout1.xml'] = strToU8(slideLayoutXml());
  files['ppt/slideLayouts/_rels/slideLayout1.xml.rels'] = strToU8(slideLayoutRelsXml());

  for (let i = 0; i < slides.length; i++) {
    const ctx: SlideBuildContext = {
      shapeId: 2,
      rels: [],
      media: [],
    };
    files[`ppt/slides/slide${i + 1}.xml`] = strToU8(editableSlideXml(slides[i], ctx));
    slideRels.push({ rels: ctx.rels, media: ctx.media });
  }

  let mediaIndex = 1;
  for (let i = 0; i < slideRels.length; i++) {
    const rels = slideRels[i];
    for (const media of rels.media) {
      files[`ppt/media/image${mediaIndex}.${media.ext}`] = media.data;
      rels.rels.push(
        `<Relationship Id="${media.relId}" Type="${IMAGE_REL}" Target="../media/image${mediaIndex}.${media.ext}"/>`,
      );
      mediaIndex++;
    }
    files[`ppt/slides/_rels/slide${i + 1}.xml.rels`] = strToU8(editableSlideRelsXml(rels.rels));
  }

  return zipSync(files);
}

function elementBox(
  el: HTMLElement,
  rootRect: DOMRect,
  styles: CSSStyleDeclaration,
): PptxBox | null {
  if (styles.display === 'none' || styles.visibility === 'hidden') return null;
  const opacity = parseOpacity(styles.opacity);
  if (opacity <= 0) return null;

  const rect = el.getBoundingClientRect();
  const w = clamp(rect.width, 0, SLIDE_W);
  const h = clamp(rect.height, 0, SLIDE_H);
  const rotate = rotationFromTransform(styles.transform);
  if (w < 1 || h < 1) return null;

  return {
    x: clamp(rect.left - rootRect.left, 0, SLIDE_W),
    y: clamp(rect.top - rootRect.top, 0, SLIDE_H),
    w,
    h,
    opacity: opacity < 1 ? opacity : undefined,
    rotate,
  };
}

function fillFromStyles(styles: CSSStyleDeclaration): PptxFill {
  const gradient = parseLinearGradient(styles.backgroundImage);
  if (gradient) return gradient;
  return colorWithPaint(styles.backgroundColor);
}

function strokeFromStyles(styles: CSSStyleDeclaration): PptxStroke | null {
  const sides = borderSidesFromStyles(styles);
  if (sides.some((side) => !side)) return null;
  const [top, right, bottom, left] = sides as [PptxStroke, PptxStroke, PptxStroke, PptxStroke];
  if (
    top.width !== right.width ||
    top.width !== bottom.width ||
    top.width !== left.width ||
    top.color !== right.color ||
    top.color !== bottom.color ||
    top.color !== left.color
  ) {
    return null;
  }
  return top;
}

function borderShapesFromStyles(box: PptxBox, styles: CSSStyleDeclaration): PptxShapeObject[] {
  const [top, right, bottom, left] = borderSidesFromStyles(styles);
  const shapes: PptxShapeObject[] = [];
  if (top) {
    shapes.push({
      kind: 'shape',
      x: box.x,
      y: box.y,
      w: box.w,
      h: top.width,
      fill: top.color,
      opacity: box.opacity,
    });
  }
  if (right) {
    shapes.push({
      kind: 'shape',
      x: box.x + box.w - right.width,
      y: box.y,
      w: right.width,
      h: box.h,
      fill: right.color,
      opacity: box.opacity,
    });
  }
  if (bottom) {
    shapes.push({
      kind: 'shape',
      x: box.x,
      y: box.y + box.h - bottom.width,
      w: box.w,
      h: bottom.width,
      fill: bottom.color,
      opacity: box.opacity,
    });
  }
  if (left) {
    shapes.push({
      kind: 'shape',
      x: box.x,
      y: box.y,
      w: left.width,
      h: box.h,
      fill: left.color,
      opacity: box.opacity,
    });
  }
  return shapes;
}

function borderSidesFromStyles(
  styles: CSSStyleDeclaration,
): [PptxStroke | null, PptxStroke | null, PptxStroke | null, PptxStroke | null] {
  return [
    borderSideFromStyles(styles.borderTopWidth, styles.borderTopColor),
    borderSideFromStyles(styles.borderRightWidth, styles.borderRightColor),
    borderSideFromStyles(styles.borderBottomWidth, styles.borderBottomColor),
    borderSideFromStyles(styles.borderLeftWidth, styles.borderLeftColor),
  ];
}

function borderSideFromStyles(widthValue: string, colorValue: string): PptxStroke | null {
  const width = parseCssPx(widthValue);
  if (width <= 0) return null;
  const color = colorWithPaint(colorValue);
  if (!color) return null;
  return { color, width };
}

function textFromElement(
  el: HTMLElement,
  box: PptxBox,
  styles: CSSStyleDeclaration,
): PptxTextObject | null {
  if (!isTextCandidate(el)) return null;

  const paragraphs = collectTextParagraphs(el, {
    color: colorOrFallback(styles.color, '#000000'),
    fontFamily: normalizeFontFamily(styles.fontFamily),
    fontSize: parseCssPx(styles.fontSize) || 18,
    bold: isBold(styles.fontWeight),
    italic: styles.fontStyle === 'italic' || styles.fontStyle === 'oblique',
    letterSpacing: parseCssPx(styles.letterSpacing),
    textTransform: styles.textTransform,
  });
  const hasText = paragraphs.some((paragraph) => paragraph.some((run) => run.text.trim()));
  if (!hasText) return null;

  return {
    kind: 'text',
    ...box,
    paragraphs,
    align: textAlign(styles.textAlign),
    color: colorWithPaint(styles.color) ?? undefined,
    fontFamily: normalizeFontFamily(styles.fontFamily),
    fontSize: parseCssPx(styles.fontSize) || undefined,
    wrap: shouldWrapTextBox(box, styles),
    shadow: parseCssShadow(styles.textShadow),
  };
}

function shouldWrapTextBox(box: PptxBox, styles: CSSStyleDeclaration): boolean {
  if (styles.whiteSpace === 'nowrap' || styles.whiteSpace === 'pre') return false;
  const fontSize = parseCssPx(styles.fontSize) || 16;
  const lineHeight = parseCssPx(styles.lineHeight) || fontSize * 1.2;
  return box.h > lineHeight * 1.35;
}

function isTextCandidate(el: HTMLElement): boolean {
  if (['SCRIPT', 'STYLE', 'SVG', 'CANVAS', 'IMG', 'VIDEO', 'PICTURE'].includes(el.tagName)) {
    return false;
  }
  const display = getComputedStyle(el).display;
  if (isLayoutTextContainer(display)) return false;
  if (!el.textContent?.trim()) return false;
  for (const child of Array.from(el.children)) {
    if (!isInlineTextElement(child as HTMLElement)) return false;
  }
  return true;
}

function isLayoutTextContainer(display: string): boolean {
  return /\b(flex|grid|table)\b/.test(display);
}

function isInlineTextElement(el: HTMLElement): boolean {
  const display = getComputedStyle(el).display;
  return (
    display.startsWith('inline') ||
    [
      'A',
      'ABBR',
      'B',
      'BR',
      'CODE',
      'EM',
      'I',
      'KBD',
      'MARK',
      'SMALL',
      'SPAN',
      'STRONG',
      'SUB',
      'SUP',
      'U',
    ].includes(el.tagName)
  );
}

function collectTextParagraphs(el: HTMLElement, inherited: PptxTextStyle): PptxTextRun[][] {
  const paragraphs: PptxTextRun[][] = [[]];

  const pushBreak = () => {
    if (paragraphs[paragraphs.length - 1]?.length) paragraphs.push([]);
  };

  const walk = (node: Node, style: PptxTextStyle) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = applyTextTransform(collapseText(node.textContent ?? ''), style.textTransform);
      if (text) paragraphs[paragraphs.length - 1].push({ ...style, text });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === 'BR') {
      pushBreak();
      return;
    }

    const computed = getComputedStyle(node);
    const opacity = (style.opacity ?? 1) * parseOpacity(computed.opacity);
    const next: PptxTextStyle = {
      ...style,
      color: colorWithPaint(computed.color) ?? style.color,
      fontFamily: normalizeFontFamily(computed.fontFamily) ?? style.fontFamily,
      fontSize: parseCssPx(computed.fontSize) || style.fontSize,
      bold:
        node.tagName === 'B' ||
        node.tagName === 'STRONG' ||
        isBold(computed.fontWeight) ||
        style.bold,
      italic:
        node.tagName === 'I' ||
        node.tagName === 'EM' ||
        computed.fontStyle === 'italic' ||
        computed.fontStyle === 'oblique' ||
        style.italic,
      letterSpacing: parseCssPx(computed.letterSpacing) || style.letterSpacing,
      opacity: opacity < 1 ? opacity : style.opacity,
      textTransform:
        computed.textTransform && computed.textTransform !== 'none'
          ? computed.textTransform
          : style.textTransform,
    };
    for (const child of Array.from(node.childNodes)) walk(child, next);
  };

  for (const child of Array.from(el.childNodes)) walk(child, inherited);
  return paragraphs.filter((paragraph) => paragraph.length > 0);
}

function shouldRasterizeElement(el: HTMLElement, styles: CSSStyleDeclaration): boolean {
  if (
    el instanceof HTMLCanvasElement ||
    el instanceof SVGElement ||
    el instanceof HTMLVideoElement
  ) {
    return true;
  }
  if (hasNonIdentityFilter(styles.filter)) return true;
  if (hasNonIdentityFilter(styles.backdropFilter)) return true;
  if (isTextlessDecorativeElement(el) && hasUnsupportedVisualStyle(styles)) return true;
  return Boolean(styles.mixBlendMode && styles.mixBlendMode !== 'normal');
}

function isTextlessDecorativeElement(el: HTMLElement): boolean {
  return !el.textContent?.trim();
}

function hasUnsupportedVisualStyle(styles: CSSStyleDeclaration): boolean {
  if (hasUnsupportedBackgroundImage(styles.backgroundImage)) return true;
  const maskImage =
    styles.maskImage ||
    (styles as CSSStyleDeclaration & { webkitMaskImage?: string }).webkitMaskImage;
  if (maskImage && maskImage !== 'none') return true;
  if (hasNonIdentityClipPath(styles.clipPath)) return true;
  return false;
}

function hasNonIdentityFilter(value?: string | null): boolean {
  if (!value || value === 'none') return false;
  const normalized = value.replace(/\s+/g, '').toLowerCase();
  return !/^(?:blur\\(0(?:\\.0+)?px\\)|opacity\\(1\\)|opacity\\(100%\\)|brightness\\(1\\)|brightness\\(100%\\)|contrast\\(1\\)|contrast\\(100%\\)|saturate\\(1\\)|saturate\\(100%\\)|grayscale\\(0\\)|grayscale\\(0%\\)|sepia\\(0\\)|sepia\\(0%\\)|hue-rotate\\(0(?:\\.0+)?deg\\))+$/.test(
    normalized,
  );
}

function hasNonIdentityClipPath(value?: string | null): boolean {
  if (!value || value === 'none') return false;
  const normalized = value.replace(/\s+/g, '').toLowerCase();
  return !/^inset\\(0(?:px|%)?(?:0(?:px|%)?){0,3}\\)$/.test(normalized);
}

function hasUnsupportedBackgroundImage(value?: string | null): boolean {
  if (!value || value === 'none') return false;
  if (/radial-gradient|conic-gradient|repeating-/i.test(value)) return true;
  const layers = splitTopLevel(value);
  if (layers.length > 1) return true;
  return !parseLinearGradient(value);
}

async function rasterizeElement(el: HTMLElement, box: PptxBox): Promise<PptxImageObject | null> {
  try {
    if (el instanceof HTMLCanvasElement) {
      const blob = await new Promise<Blob | null>((resolve) => el.toBlob(resolve, 'image/png'));
      if (!blob) return null;
      return {
        kind: 'image',
        ...box,
        mime: 'image/png',
        data: new Uint8Array(await blob.arrayBuffer()),
      };
    }

    const { toBlob } = await import('html-to-image');
    const blob = await toBlob(el, {
      width: Math.max(1, Math.round(box.w)),
      height: Math.max(1, Math.round(box.h)),
      pixelRatio: 2,
      backgroundColor: undefined,
      cacheBust: true,
    });
    if (!blob) return null;
    return {
      kind: 'image',
      ...box,
      mime: 'image/png',
      data: new Uint8Array(await blob.arrayBuffer()),
    };
  } catch {
    return null;
  }
}

async function imageFromElement(
  img: HTMLImageElement,
  box: PptxBox,
  styles: CSSStyleDeclaration,
): Promise<PptxImageObject | null> {
  const src = img.currentSrc || img.src;
  if (!src) return null;

  const image = await readImage(src);
  if (!image) return null;
  const fitted = fitImageBox(img, box, styles);

  return {
    kind: 'image',
    ...fitted.box,
    alt: img.alt || undefined,
    mime: image.mime,
    data: image.data,
    crop: fitted.crop,
  };
}

function fitImageBox(
  img: HTMLImageElement,
  box: PptxBox,
  styles: CSSStyleDeclaration,
): { box: PptxBox; crop?: PptxImageCrop } {
  const naturalW = img.naturalWidth || img.width || 0;
  const naturalH = img.naturalHeight || img.height || 0;
  if (naturalW <= 0 || naturalH <= 0 || box.w <= 0 || box.h <= 0) return { box };

  const fit = styles.objectFit || 'fill';
  if (fit === 'cover') {
    const scale = Math.max(box.w / naturalW, box.h / naturalH);
    const visibleW = Math.min(naturalW, box.w / scale);
    const visibleH = Math.min(naturalH, box.h / scale);
    const overflowX = Math.max(0, naturalW - visibleW);
    const overflowY = Math.max(0, naturalH - visibleH);
    const position = parseObjectPosition(styles.objectPosition);
    return {
      box,
      crop: normalizeCrop({
        left: (overflowX * position.x) / naturalW,
        right: (overflowX * (1 - position.x)) / naturalW,
        top: (overflowY * position.y) / naturalH,
        bottom: (overflowY * (1 - position.y)) / naturalH,
      }),
    };
  }

  if (fit === 'contain' || fit === 'scale-down') {
    const containScale = Math.min(box.w / naturalW, box.h / naturalH);
    const scale = fit === 'scale-down' ? Math.min(1, containScale) : containScale;
    const w = naturalW * scale;
    const h = naturalH * scale;
    const position = parseObjectPosition(styles.objectPosition);
    return {
      box: {
        ...box,
        x: box.x + (box.w - w) * position.x,
        y: box.y + (box.h - h) * position.y,
        w,
        h,
      },
    };
  }

  return { box };
}

function parseObjectPosition(value?: string | null): { x: number; y: number } {
  const parts = value?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return { x: 0.5, y: 0.5 };
  if (parts.length === 1) {
    const only = objectPositionPart(parts[0], 'x');
    return { x: only.axis === 'y' ? 0.5 : only.value, y: only.axis === 'y' ? only.value : 0.5 };
  }

  let x = 0.5;
  let y = 0.5;
  for (const part of parts) {
    const parsed = objectPositionPart(part, x === 0.5 ? 'x' : 'y');
    if (parsed.axis === 'x') x = parsed.value;
    else y = parsed.value;
  }
  return { x, y };
}

function objectPositionPart(
  part: string,
  fallbackAxis: 'x' | 'y',
): { axis: 'x' | 'y'; value: number } {
  const lower = part.toLowerCase();
  if (lower === 'left') return { axis: 'x', value: 0 };
  if (lower === 'right') return { axis: 'x', value: 1 };
  if (lower === 'top') return { axis: 'y', value: 0 };
  if (lower === 'bottom') return { axis: 'y', value: 1 };
  if (lower === 'center') return { axis: fallbackAxis, value: 0.5 };
  if (lower.endsWith('%')) {
    return { axis: fallbackAxis, value: clamp(Number.parseFloat(lower) / 100, 0, 1) };
  }
  return { axis: fallbackAxis, value: 0.5 };
}

function normalizeCrop(crop: Required<PptxImageCrop>): PptxImageCrop | undefined {
  const normalized = {
    left: clamp(crop.left, 0, 1),
    right: clamp(crop.right, 0, 1),
    top: clamp(crop.top, 0, 1),
    bottom: clamp(crop.bottom, 0, 1),
  };
  if (normalized.left + normalized.right >= 0.999) {
    normalized.left = 0;
    normalized.right = 0;
  }
  if (normalized.top + normalized.bottom >= 0.999) {
    normalized.top = 0;
    normalized.bottom = 0;
  }
  return normalized.left || normalized.right || normalized.top || normalized.bottom
    ? normalized
    : undefined;
}

function tableFromElement(table: HTMLTableElement, box: PptxBox): PptxTableObject | null {
  const domRows = Array.from(table.rows);
  if (domRows.length === 0) return null;

  const rows = domRows.map((row) =>
    Array.from(row.cells).map((cell) => {
      const styles = getComputedStyle(cell);
      return {
        text: collapseText(cell.innerText || cell.textContent || '').trim(),
        fill: fillFromStyles(styles),
        color: colorWithPaint(styles.color) ?? undefined,
        fontFamily: normalizeFontFamily(styles.fontFamily),
        fontSize: parseCssPx(styles.fontSize) || undefined,
        bold: isBold(styles.fontWeight),
        italic: styles.fontStyle === 'italic' || styles.fontStyle === 'oblique',
        align: textAlign(styles.textAlign),
      };
    }),
  );
  if (!rows.some((row) => row.length > 0)) return null;

  const firstRow = domRows[0];
  const columnWidths = firstRow
    ? Array.from(firstRow.cells).map((cell) => cell.getBoundingClientRect().width)
    : undefined;
  const rowHeights = domRows.map((row) => row.getBoundingClientRect().height);

  return { kind: 'table', ...box, rows, columnWidths, rowHeights };
}

async function readImage(src: string): Promise<{ mime: string; data: Uint8Array } | null> {
  if (src.startsWith('data:')) return readDataUrl(src);
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    return {
      mime: res.headers.get('content-type')?.split(';')[0] || mimeFromUrl(src),
      data: new Uint8Array(await res.arrayBuffer()),
    };
  } catch {
    return null;
  }
}

function readDataUrl(src: string): { mime: string; data: Uint8Array } | null {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/i.exec(src);
  if (!match) return null;
  const mime = match[1] || 'image/png';
  const payload = decodeURIComponent(match[3] ?? '');
  if (match[2]) {
    const binary = atob(payload);
    return {
      mime,
      data: Uint8Array.from(binary, (char) => char.charCodeAt(0)),
    };
  }
  return { mime, data: new TextEncoder().encode(payload) };
}

function editableSlideXml(slide: EditablePptxSlide, ctx: SlideBuildContext): string {
  const background = slide.background
    ? `<p:bg><p:bgPr>${fillXml(slide.background)}<a:effectLst/></p:bgPr></p:bg>`
    : '';
  const objects = [...slide.objects, ...(slide.visualSnapshot ? [slide.visualSnapshot] : [])]
    .map((object) => objectXml(object, ctx))
    .join('');
  return `${XML_DECL}<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${OD_REL}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld>${background}<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${objects}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

function objectXml(object: PptxObject, ctx: SlideBuildContext): string {
  if (object.kind === 'text') return textXml(object, ctx);
  if (object.kind === 'image') return pictureXml(object, ctx);
  if (object.kind === 'table') return tableXml(object, ctx);
  return shapeXml(object, ctx);
}

function shapeXml(shape: PptxShapeObject, ctx: SlideBuildContext): string {
  const id = ctx.shapeId++;
  const geom = shape.radius && shape.radius > 0 ? 'roundRect' : 'rect';
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Shape ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${xfrmXml(shape)}<a:prstGeom prst="${geom}"><a:avLst/></a:prstGeom>${fillXml(shape.fill ?? null, shape.opacity)}${lineXml(shape.stroke ?? null, shape.opacity)}${effectXml(shape.shadow ?? null, shape.opacity)}</p:spPr></p:sp>`;
}

function textXml(text: PptxTextObject, ctx: SlideBuildContext): string {
  const id = ctx.shapeId++;
  const paragraphs = text.paragraphs.map((paragraph) => paragraphXml(paragraph, text)).join('');
  const wrap = text.wrap === false ? 'none' : 'square';
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Text ${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr>${xfrmXml(text)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln>${effectXml(text.shadow ?? null, text.opacity)}</p:spPr><p:txBody><a:bodyPr wrap="${wrap}" lIns="0" tIns="0" rIns="0" bIns="0"/><a:lstStyle/>${paragraphs}</p:txBody></p:sp>`;
}

function paragraphXml(paragraph: PptxTextRun[], text: PptxTextObject): string {
  const align =
    text.align && text.align !== 'left' ? ` algn="${pptxTextAlignValue(text.align)}"` : '';
  const runs = paragraph.map((run) => runXml(run, text)).join('');
  return `<a:p><a:pPr${align}/>${runs}</a:p>`;
}

function runXml(run: PptxTextRun, text: PptxTextObject): string {
  const fontSize = cssPxToTextPoint(run.fontSize ?? text.fontSize ?? 18);
  const attrs = [
    `sz="${fontSize}"`,
    run.bold ? 'b="1"' : '',
    run.italic ? 'i="1"' : '',
    run.letterSpacing ? `spc="${Math.round(run.letterSpacing * CSS_PX_PT * 100)}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const fontFamily = run.fontFamily ?? text.fontFamily;
  const font = fontXml(fontFamily, run.text);
  return `<a:r><a:rPr ${attrs}><a:solidFill>${colorXml(
    run.color ?? text.color ?? '#000000',
    combinedOpacity(text.opacity, run.opacity),
    '#000000',
  )}</a:solidFill>${font}</a:rPr><a:t>${escapeXml(run.text)}</a:t></a:r>`;
}

function pictureXml(image: PptxImageObject, ctx: SlideBuildContext): string {
  const id = ctx.shapeId++;
  const relId = `rId${ctx.media.length + 2}`;
  ctx.media.push({ data: image.data, ext: imageExt(image.mime), relId });
  const name = escapeXml(image.alt || `Picture ${id}`);
  const opacity = image.opacity === undefined ? 1 : clamp(image.opacity, 0, 1);
  const blipAlpha = opacity < 1 ? `<a:alphaModFix amt="${Math.round(opacity * 100000)}"/>` : '';
  const blip = blipAlpha
    ? `<a:blip r:embed="${relId}">${blipAlpha}</a:blip>`
    : `<a:blip r:embed="${relId}"/>`;
  return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="${name}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill>${blip}${sourceRectXml(image.crop)}<a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${xfrmXml(image)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${effectXml(image.shadow ?? null, image.opacity)}</p:spPr></p:pic>`;
}

function tableXml(table: PptxTableObject, ctx: SlideBuildContext): string {
  const id = ctx.shapeId++;
  const colCount = Math.max(...table.rows.map((row) => row.length));
  if (colCount <= 0) return '';
  const columnWidth = table.w / colCount;
  const rowHeight = table.h / Math.max(1, table.rows.length);
  const grid = Array.from({ length: colCount }, (_, i) => {
    const width = table.columnWidths?.[i] ?? columnWidth;
    return `<a:gridCol w="${pxToEmuX(width)}"/>`;
  }).join('');
  const rows = table.rows
    .map((row, rowIndex) => {
      const height = table.rowHeights?.[rowIndex] ?? rowHeight;
      const cells = Array.from({ length: colCount }, (_, cellIndex) =>
        tableCellXml(row[cellIndex] ?? { text: '' }),
      ).join('');
      return `<a:tr h="${pxToEmuY(height)}">${cells}</a:tr>`;
    })
    .join('');

  return `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="Table ${id}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>${graphicFrameXfrmXml(table)}<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="0" bandRow="0"/><a:tblGrid>${grid}</a:tblGrid>${rows}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
}

function tableCellXml(cell: PptxTableCell): string {
  const align =
    cell.align && cell.align !== 'left' ? ` algn="${pptxTextAlignValue(cell.align)}"` : '';
  const fontSize = cssPxToTextPoint(cell.fontSize ?? 18);
  const attrs = [`sz="${fontSize}"`, cell.bold ? 'b="1"' : '', cell.italic ? 'i="1"' : '']
    .filter(Boolean)
    .join(' ');
  const font = fontXml(cell.fontFamily, cell.text);
  return `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:pPr${align}/><a:r><a:rPr ${attrs}><a:solidFill>${colorXml(cell.color ?? '#000000', 1, '#000000')}</a:solidFill>${font}</a:rPr><a:t>${escapeXml(cell.text)}</a:t></a:r></a:p></a:txBody><a:tcPr>${fillXml(cell.fill ?? null)}</a:tcPr></a:tc>`;
}

function pptxTextAlignValue(align: NonNullable<PptxTextObject['align']>): string {
  if (align === 'center') return 'ctr';
  if (align === 'right') return 'r';
  if (align === 'justify') return 'just';
  return 'l';
}

function xfrmXml(box: PptxBox): string {
  const rotate = box.rotate ? ` rot="${angleToOoxml(box.rotate)}"` : '';
  return `<a:xfrm${rotate}><a:off x="${pxToEmuX(box.x)}" y="${pxToEmuY(box.y)}"/><a:ext cx="${pxToEmuX(box.w)}" cy="${pxToEmuY(box.h)}"/></a:xfrm>`;
}

function graphicFrameXfrmXml(box: PptxBox): string {
  return `<p:xfrm><a:off x="${pxToEmuX(box.x)}" y="${pxToEmuY(box.y)}"/><a:ext cx="${pxToEmuX(box.w)}" cy="${pxToEmuY(box.h)}"/></p:xfrm>`;
}

function fillXml(fill: PptxFill, opacity?: number): string {
  if (!fill) return '<a:noFill/>';
  if (typeof fill === 'string') {
    const color = parseColor(fill);
    return color ? `<a:solidFill>${colorXml(fill, opacity)}</a:solidFill>` : '<a:noFill/>';
  }

  const stops = fill.stops.length
    ? fill.stops
    : [
        { color: '#ffffff', position: 0 },
        { color: '#ffffff', position: 1 },
      ];
  const gs = stops
    .map((stop) => {
      const pos = clamp(Math.round(stop.position * 100000), 0, 100000);
      return `<a:gs pos="${pos}">${colorXml(stop.color, opacity)}</a:gs>`;
    })
    .join('');
  return `<a:gradFill rotWithShape="1"><a:gsLst>${gs}</a:gsLst><a:lin ang="${Math.round(fill.angle * 60000)}" scaled="0"/></a:gradFill>`;
}

function lineXml(stroke: PptxStroke | null, opacity?: number): string {
  if (!stroke) return '<a:ln><a:noFill/></a:ln>';
  return `<a:ln w="${Math.round(stroke.width * CSS_PX_EMU)}"><a:solidFill>${colorXml(stroke.color, opacity, '000000')}</a:solidFill><a:prstDash val="solid"/></a:ln>`;
}

function sourceRectXml(crop?: PptxImageCrop): string {
  if (!crop) return '';
  const attrs = [
    crop.left ? `l="${Math.round(clamp(crop.left, 0, 1) * 100000)}"` : '',
    crop.right ? `r="${Math.round(clamp(crop.right, 0, 1) * 100000)}"` : '',
    crop.top ? `t="${Math.round(clamp(crop.top, 0, 1) * 100000)}"` : '',
    crop.bottom ? `b="${Math.round(clamp(crop.bottom, 0, 1) * 100000)}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return attrs ? `<a:srcRect ${attrs}/>` : '';
}

function fontXml(fontFamily: string | undefined, text: string): string {
  const latin = fontFamily ? `<a:latin typeface="${escapeXml(fontFamily)}"/>` : '';
  const eastAsian = eastAsianFontFamily(fontFamily, text);
  const ea = eastAsian ? `<a:ea typeface="${escapeXml(eastAsian)}"/>` : '';
  return `${latin}${ea}`;
}

function eastAsianFontFamily(fontFamily: string | undefined, text: string): string | undefined {
  if (!hasEastAsianText(text)) return undefined;
  if (fontFamily && isEastAsianFontFamily(fontFamily)) return fontFamily;
  return 'PingFang SC';
}

function hasEastAsianText(text: string): boolean {
  return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(text);
}

function isEastAsianFontFamily(fontFamily: string): boolean {
  return /pingfang|hiragino|noto sans cjk|source han|microsoft yahei|yahei|simsun|simhei|heiti|songti|kaiti|malgun|meiryo|yu gothic/i.test(
    fontFamily,
  );
}

function effectXml(shadow: PptxShadow | null, opacity?: number): string {
  if (!shadow) return '';
  return `<a:effectLst><a:outerShdw blurRad="${Math.round(shadow.blur * CSS_PX_EMU)}" dist="${Math.round(shadow.distance * CSS_PX_EMU)}" dir="${angleToOoxml(shadow.angle)}" algn="ctr" rotWithShape="0">${colorXml(shadow.color, opacity, '000000')}</a:outerShdw></a:effectLst>`;
}

function editableContentTypesXml(n: number): string {
  const slideOverrides = Array.from(
    { length: n },
    (_, i) =>
      `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
  ).join('');
  return `${XML_DECL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/><Default Extension="svg" ContentType="image/svg+xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${slideOverrides}</Types>`;
}

function editableSlideRelsXml(imageRels: string[]): string {
  return `${XML_DECL}<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OD_REL}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>${imageRels.join('')}</Relationships>`;
}

function rootRelsXml(): string {
  return `${XML_DECL}<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OD_REL}/officeDocument" Target="ppt/presentation.xml"/></Relationships>`;
}

function presentationXml(n: number): string {
  const sldIds = Array.from(
    { length: n },
    (_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 3}"/>`,
  ).join('');
  return `${XML_DECL}<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${OD_REL}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${sldIds}</p:sldIdLst><p:sldSz cx="${EMU_W}" cy="${EMU_H}"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`;
}

function presentationRelsXml(n: number): string {
  const rels = [
    `<Relationship Id="rId1" Type="${OD_REL}/slideMaster" Target="slideMasters/slideMaster1.xml"/>`,
    `<Relationship Id="rId2" Type="${OD_REL}/presProps" Target="presProps.xml"/>`,
  ];
  for (let i = 0; i < n; i++) {
    rels.push(
      `<Relationship Id="rId${i + 3}" Type="${OD_REL}/slide" Target="slides/slide${i + 1}.xml"/>`,
    );
  }
  return `${XML_DECL}<Relationships xmlns="${REL_NS}">${rels.join('')}</Relationships>`;
}

function presPropsXml(): string {
  return `${XML_DECL}<p:presentationPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${OD_REL}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>`;
}

function slideMasterXml(): string {
  return `${XML_DECL}<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${OD_REL}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`;
}

function slideMasterRelsXml(): string {
  return `${XML_DECL}<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OD_REL}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="${OD_REL}/theme" Target="../theme/theme1.xml"/></Relationships>`;
}

function slideLayoutXml(): string {
  return `${XML_DECL}<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${OD_REL}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
}

function slideLayoutRelsXml(): string {
  return `${XML_DECL}<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OD_REL}/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`;
}

function themeXml(): string {
  return `${XML_DECL}<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:lumMod val="110000"/><a:satMod val="105000"/><a:tint val="67000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="103000"/><a:tint val="73000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="109000"/><a:tint val="81000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:satMod val="103000"/><a:lumMod val="102000"/><a:tint val="94000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:satMod val="110000"/><a:lumMod val="100000"/><a:shade val="100000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="99000"/><a:satMod val="120000"/><a:shade val="78000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/><a:satMod val="170000"/></a:schemeClr></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="93000"/><a:satMod val="150000"/><a:shade val="98000"/><a:lumMod val="102000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:tint val="98000"/><a:satMod val="130000"/><a:shade val="90000"/><a:lumMod val="103000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="63000"/><a:satMod val="120000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;
}

function parseLinearGradient(value: string): PptxFill {
  if (!value?.includes('linear-gradient(')) return null;
  const start = value.indexOf('linear-gradient(');
  const inner = contentInFunction(value.slice(start), 'linear-gradient');
  if (!inner) return null;
  const parts = splitTopLevel(inner);
  if (parts.length < 2) return null;

  let angle = 180;
  let stops = parts;
  const first = parts[0].trim();
  if (first.endsWith('deg')) {
    angle = Number.parseFloat(first);
    stops = parts.slice(1);
  } else if (first.startsWith('to ')) {
    angle = directionToAngle(first);
    stops = parts.slice(1);
  }

  const parsed = stops.map((stop, index) => parseGradientStop(stop, index, stops.length));
  const valid = parsed.filter((stop): stop is PptxGradientStop => Boolean(stop));
  if (valid.length < 2) return null;
  return { kind: 'linearGradient', angle, stops: valid };
}

function parseGradientStop(input: string, index: number, count: number): PptxGradientStop | null {
  const colorMatch = /(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)\s*(.*)$/i.exec(
    input.trim(),
  );
  if (!colorMatch) return null;
  const color = parseColor(colorMatch[1]);
  if (!color) return null;
  const posMatch = /(-?\d+(?:\.\d+)?)%/.exec(colorMatch[2] ?? '');
  const position = posMatch
    ? clamp(Number.parseFloat(posMatch[1]) / 100, 0, 1)
    : count <= 1
      ? 0
      : index / (count - 1);
  return { color: colorMatch[1], position };
}

function contentInFunction(value: string, fn: string): string | null {
  const prefix = `${fn}(`;
  if (!value.startsWith(prefix)) return null;
  let depth = 0;
  for (let i = fn.length; i < value.length; i++) {
    const char = value[i];
    if (char === '(') depth++;
    if (char === ')') {
      depth--;
      if (depth === 0) return value.slice(prefix.length, i);
    }
  }
  return null;
}

function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      parts.push(input.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(input.slice(start).trim());
  return parts.filter(Boolean);
}

function directionToAngle(direction: string): number {
  if (direction.includes('right')) return 90;
  if (direction.includes('left')) return 270;
  if (direction.includes('top')) return 0;
  return 180;
}

function parseColor(value?: string | null): ParsedColor | null {
  if (!value) return null;
  const color = value.trim();
  const lower = color.toLowerCase();
  if (!color) return null;
  if (lower === 'transparent') return { hex: '000000', alpha: 0 };
  if (lower === 'black') return { hex: '000000', alpha: 1 };
  if (lower === 'white') return { hex: 'FFFFFF', alpha: 1 };
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return { hex: hex.replace(/./g, (char) => char + char).toUpperCase(), alpha: 1 };
    }
    if (hex.length === 4) {
      const alpha = Number.parseInt(hex[3], 16) / 15;
      return {
        hex: hex
          .slice(0, 3)
          .replace(/./g, (char) => char + char)
          .toUpperCase(),
        alpha,
      };
    }
    if (hex.length === 6) return { hex: hex.toUpperCase(), alpha: 1 };
    if (hex.length === 8) {
      const alpha = Number.parseInt(hex.slice(6), 16) / 255;
      return { hex: hex.slice(0, 6).toUpperCase(), alpha };
    }
  }

  const rgb = /^rgba?\((.+)\)$/i.exec(color);
  if (rgb) {
    const parsed = parseColorParts(rgb[1]);
    if (!parsed) return null;
    return {
      hex: parsed.channels.map((part) => byteToHex(parseRgbChannel(part))).join(''),
      alpha: parsed.alpha,
    };
  }

  const srgb = /^color\(\s*srgb\s+(.+)\)$/i.exec(color);
  if (srgb) {
    const parsed = parseColorParts(srgb[1]);
    if (!parsed) return null;
    return {
      hex: parsed.channels.map((part) => byteToHex(parseSrgbChannel(part))).join(''),
      alpha: parsed.alpha,
    };
  }

  const oklch = /^oklch\((.+)\)$/i.exec(color);
  if (oklch) return parseOklch(oklch[1]);

  return null;
}

function colorXml(value: string, opacity = 1, fallback = 'FFFFFF'): string {
  const color = parseColor(value) ?? parseColor(fallback) ?? { hex: fallback, alpha: 1 };
  const alpha = clamp(color.alpha * opacity, 0, 1);
  const alphaXml = alpha < 1 ? `<a:alpha val="${Math.round(alpha * 100000)}"/>` : '';
  return alphaXml
    ? `<a:srgbClr val="${color.hex}">${alphaXml}</a:srgbClr>`
    : `<a:srgbClr val="${color.hex}"/>`;
}

function colorWithPaint(value?: string | null): string | null {
  const color = parseColor(value);
  if (!color || color.alpha <= 0) return null;
  return value?.trim() ?? null;
}

function colorOrFallback(value: string, fallback: string): string {
  return colorWithPaint(value) ?? fallback;
}

function parseOpacity(value?: string | null): number {
  const opacity = Number.parseFloat(value ?? '');
  return Number.isFinite(opacity) ? clamp(opacity, 0, 1) : 1;
}

function combinedOpacity(...values: (number | undefined)[]): number {
  let opacity = 1;
  for (const value of values) {
    if (value === undefined || !Number.isFinite(value)) continue;
    opacity *= clamp(value, 0, 1);
  }
  return opacity;
}

function rotationFromTransform(value?: string | null): number | undefined {
  if (!value || value === 'none') return undefined;

  const matrix = /^matrix\((.+)\)$/i.exec(value);
  if (matrix) {
    const parts = matrix[1].split(',').map((part) => Number.parseFloat(part.trim()));
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      const angle = (Math.atan2(parts[1], parts[0]) * 180) / Math.PI;
      return normalizedVisibleAngle(angle);
    }
  }

  const matrix3d = /^matrix3d\((.+)\)$/i.exec(value);
  if (matrix3d) {
    const parts = matrix3d[1].split(',').map((part) => Number.parseFloat(part.trim()));
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      const angle = (Math.atan2(parts[1], parts[0]) * 180) / Math.PI;
      return normalizedVisibleAngle(angle);
    }
  }

  return undefined;
}

function parseCssShadow(value?: string | null): PptxShadow | null {
  if (!value || value === 'none') return null;
  const layer = splitTopLevel(value)[0]?.trim();
  if (!layer || layer === 'none' || /\binset\b/i.test(layer)) return null;

  const color = firstCssColorToken(layer);
  const colorValue = color?.value ?? 'rgba(0, 0, 0, 0.35)';
  const lengthSource = color
    ? `${layer.slice(0, color.index)} ${layer.slice(color.index + color.value.length)}`
    : layer;
  const lengths = lengthSource
    .split(/\s+/)
    .filter((part) => /^-?\d/.test(part))
    .map(parseCssPx);
  if (lengths.length < 2) return null;

  const [offsetX, offsetY, blur = 0] = lengths;
  return {
    color: colorValue,
    blur: Math.max(0, blur),
    distance: Math.hypot(offsetX, offsetY),
    angle: shadowAngle(offsetX, offsetY),
  };
}

function firstCssColorToken(input: string): { value: string; index: number } | null {
  const pattern = /#[0-9a-f]{3,8}\b|(?:rgba?|color)\([^)]+\)|\b[a-z]+\b/gi;
  for (const match of input.matchAll(pattern)) {
    if (parseColor(match[0])) return { value: match[0], index: match.index ?? 0 };
  }
  return null;
}

function shadowAngle(offsetX: number, offsetY: number): number {
  if (offsetX === 0 && offsetY === 0) return 0;
  return normalizeDegrees((Math.atan2(offsetY, offsetX) * 180) / Math.PI);
}

function angleToOoxml(angle: number): number {
  return Math.round(normalizeDegrees(angle) * 60000);
}

function normalizedVisibleAngle(angle: number): number | undefined {
  const normalized = normalizeDegrees(angle);
  return Math.abs(normalized) < 0.001 ? undefined : normalized;
}

function normalizeDegrees(angle: number): number {
  const normalized = ((angle % 360) + 360) % 360;
  return Math.abs(normalized - 360) < 0.001 ? 0 : normalized;
}

function parseColorParts(input: string): { channels: string[]; alpha: number } | null {
  const [channelInput = '', alphaInput] = input.split('/').map((part) => part.trim());
  const commaParts = channelInput.includes(',')
    ? channelInput.split(',').map((part) => part.trim())
    : channelInput.split(/\s+/).filter(Boolean);
  if (commaParts.length < 3) return null;

  return {
    channels: commaParts.slice(0, 3),
    alpha: parseAlpha(alphaInput ?? commaParts[3]),
  };
}

function parseOklch(input: string): ParsedColor | null {
  const [channelInput = '', alphaInput] = input.split('/').map((part) => part.trim());
  const [lightnessInput, chromaInput, hueInput] = channelInput.split(/\s+/).filter(Boolean);
  if (!lightnessInput || !chromaInput || !hueInput) return null;

  const lightness = parseOklchLightness(lightnessInput);
  const chroma = parseOklchChroma(chromaInput);
  const hue = parseHue(hueInput);
  if (!Number.isFinite(lightness) || !Number.isFinite(chroma) || !Number.isFinite(hue)) {
    return null;
  }

  return {
    hex: oklchToSrgbHex(lightness, chroma, hue),
    alpha: parseAlpha(alphaInput),
  };
}

function parseOklchLightness(value: string): number {
  if (value.endsWith('%')) return Number.parseFloat(value) / 100;
  return Number.parseFloat(value);
}

function parseOklchChroma(value: string): number {
  if (value.endsWith('%')) return Number.parseFloat(value) / 100;
  return Number.parseFloat(value);
}

function parseHue(value: string): number {
  if (value.endsWith('turn')) return Number.parseFloat(value) * 360;
  if (value.endsWith('rad')) return (Number.parseFloat(value) * 180) / Math.PI;
  if (value.endsWith('grad')) return Number.parseFloat(value) * 0.9;
  return Number.parseFloat(value);
}

function oklchToSrgbHex(lightness: number, chroma: number, hue: number): string {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [r, g, blue].map((channel) => byteToHex(linearSrgbToByte(channel))).join('');
}

function linearSrgbToByte(value: number): number {
  const channel = clamp(value, 0, 1);
  const encoded = channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
  return encoded * 255;
}

function parseRgbChannel(value: string): number {
  const channel = value.endsWith('%')
    ? (Number.parseFloat(value) / 100) * 255
    : Number.parseFloat(value);
  return Number.isFinite(channel) ? channel : 0;
}

function parseSrgbChannel(value: string): number {
  const channel = value.endsWith('%')
    ? (Number.parseFloat(value) / 100) * 255
    : Number.parseFloat(value) * 255;
  return Number.isFinite(channel) ? channel : 0;
}

function parseAlpha(value?: string): number {
  if (!value) return 1;
  const alpha = value.endsWith('%') ? Number.parseFloat(value) / 100 : Number.parseFloat(value);
  return Number.isFinite(alpha) ? clamp(alpha, 0, 1) : 1;
}

function byteToHex(value: number): string {
  const byte = Number.isFinite(value) ? value : 0;
  return clamp(Math.round(byte), 0, 255).toString(16).padStart(2, '0').toUpperCase();
}

function textAlign(value: string): PptxTextObject['align'] {
  if (value === 'center' || value === 'right' || value === 'justify') return value;
  return 'left';
}

function normalizeFontFamily(value: string): string | undefined {
  const families = value
    .split(',')
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
  for (const family of families) {
    const mapped = mapPowerPointFontFamily(family);
    if (mapped) return mapped;
  }
  return families[0];
}

function mapPowerPointFontFamily(family: string): string | undefined {
  const normalized = family.toLowerCase();
  if (
    normalized.includes('sf mono') ||
    normalized === 'ui-monospace' ||
    normalized === 'monospace' ||
    normalized.includes('consolas')
  ) {
    return 'Menlo';
  }
  if (
    normalized === 'sf pro display' ||
    normalized === 'sf pro text' ||
    normalized === '-apple-system' ||
    normalized === 'blinkmacsystemfont' ||
    normalized === 'system-ui' ||
    normalized === 'sans-serif'
  ) {
    return 'Arial';
  }
  if (normalized === 'serif') return 'Times New Roman';
  return family;
}

function isBold(weight: string): boolean {
  const numeric = Number.parseInt(weight, 10);
  return Number.isFinite(numeric) ? numeric >= 600 : weight === 'bold' || weight === 'bolder';
}

function maxBorderRadius(styles: CSSStyleDeclaration): number {
  return Math.max(
    parseCssPx(styles.borderTopLeftRadius),
    parseCssPx(styles.borderTopRightRadius),
    parseCssPx(styles.borderBottomRightRadius),
    parseCssPx(styles.borderBottomLeftRadius),
  );
}

function parseCssPx(value: string): number {
  if (!value || value === 'normal' || value === 'medium' || value === 'none') return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function collapseText(value: string): string {
  return value.replace(/\s+/g, ' ');
}

function applyTextTransform(text: string, transform?: string): string {
  if (!transform || transform === 'none') return text;
  if (transform === 'uppercase') return text.toLocaleUpperCase();
  if (transform === 'lowercase') return text.toLocaleLowerCase();
  if (transform === 'capitalize') {
    return text.replace(/\p{L}[\p{L}\p{N}'-]*/gu, (word) => {
      const [first = '', ...rest] = Array.from(word);
      return `${first.toLocaleUpperCase()}${rest.join('').toLocaleLowerCase()}`;
    });
  }
  return text;
}

function markDescendants(el: Element, skipped: WeakSet<Element>): void {
  for (const child of Array.from(el.querySelectorAll('*'))) skipped.add(child);
}

function imageExt(mime: string): string {
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('svg')) return 'svg';
  return 'png';
}

function mimeFromUrl(url: string): string {
  const clean = url.split(/[?#]/)[0]?.toLowerCase() ?? '';
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
  if (clean.endsWith('.gif')) return 'image/gif';
  if (clean.endsWith('.svg')) return 'image/svg+xml';
  return 'image/png';
}

function pxToEmuX(px: number): number {
  return Math.round((px / SLIDE_W) * EMU_W);
}

function pxToEmuY(px: number): number {
  return Math.round((px / SLIDE_H) * EMU_H);
}

function cssPxToTextPoint(px: number): number {
  return Math.max(1, Math.round(px * CSS_PX_PT * 100));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
