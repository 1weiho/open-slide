const SLIDE_W = 1920;
const SLIDE_H = 1080;
const EMU_W = 12192000;
const EMU_H = 6858000;
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

type PptxBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type PptxTextRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  letterSpacing?: number;
};

type PptxTextStyle = Omit<PptxTextRun, 'text'>;

type PptxShapeObject = PptxBox & {
  kind: 'shape';
  radius?: number;
  fill?: PptxFill;
  stroke?: PptxStroke | null;
};

type PptxTextObject = PptxBox & {
  kind: 'text';
  paragraphs: PptxTextRun[][];
  align?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  fontFamily?: string;
  fontSize?: number;
};

type PptxImageObject = PptxBox & {
  kind: 'image';
  alt?: string;
  mime: string;
  data: Uint8Array;
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
};

type MediaRef = {
  data: Uint8Array;
  ext: string;
  relId: string;
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
        objects.push(image);
        markDescendants(el, skipped);
      }
      continue;
    }

    if (el instanceof HTMLImageElement) {
      const image = await imageFromElement(el, box);
      if (image) objects.push(image);
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
    if (fill || stroke) {
      objects.push({
        kind: 'shape',
        ...box,
        radius: maxBorderRadius(styles),
        fill,
        stroke,
      });
    }

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
  if (Number(styles.opacity) <= 0) return null;

  const rect = el.getBoundingClientRect();
  const w = clamp(rect.width, 0, SLIDE_W);
  const h = clamp(rect.height, 0, SLIDE_H);
  if (w < 1 || h < 1) return null;

  return {
    x: clamp(rect.left - rootRect.left, 0, SLIDE_W),
    y: clamp(rect.top - rootRect.top, 0, SLIDE_H),
    w,
    h,
  };
}

function fillFromStyles(styles: CSSStyleDeclaration): PptxFill {
  const gradient = parseLinearGradient(styles.backgroundImage);
  if (gradient) return gradient;
  return normalizeColor(styles.backgroundColor);
}

function strokeFromStyles(styles: CSSStyleDeclaration): PptxStroke | null {
  const width = Math.max(
    parseCssPx(styles.borderTopWidth),
    parseCssPx(styles.borderRightWidth),
    parseCssPx(styles.borderBottomWidth),
    parseCssPx(styles.borderLeftWidth),
  );
  if (width <= 0) return null;
  const color =
    normalizeColor(styles.borderTopColor) ??
    normalizeColor(styles.borderRightColor) ??
    normalizeColor(styles.borderBottomColor) ??
    normalizeColor(styles.borderLeftColor);
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
    color: normalizeColor(styles.color) ?? '#000000',
    fontFamily: normalizeFontFamily(styles.fontFamily),
    fontSize: parseCssPx(styles.fontSize) || 18,
    bold: isBold(styles.fontWeight),
    italic: styles.fontStyle === 'italic' || styles.fontStyle === 'oblique',
    letterSpacing: parseCssPx(styles.letterSpacing),
  });
  const hasText = paragraphs.some((paragraph) => paragraph.some((run) => run.text.trim()));
  if (!hasText) return null;

  return {
    kind: 'text',
    ...box,
    paragraphs,
    align: textAlign(styles.textAlign),
    color: normalizeColor(styles.color) ?? undefined,
    fontFamily: normalizeFontFamily(styles.fontFamily),
    fontSize: parseCssPx(styles.fontSize) || undefined,
  };
}

function isTextCandidate(el: HTMLElement): boolean {
  if (['SCRIPT', 'STYLE', 'SVG', 'CANVAS', 'IMG', 'VIDEO', 'PICTURE'].includes(el.tagName)) {
    return false;
  }
  if (!el.textContent?.trim()) return false;
  for (const child of Array.from(el.children)) {
    if (!isInlineTextElement(child as HTMLElement)) return false;
  }
  return true;
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
      const text = collapseText(node.textContent ?? '');
      if (text) paragraphs[paragraphs.length - 1].push({ ...style, text });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === 'BR') {
      pushBreak();
      return;
    }

    const computed = getComputedStyle(node);
    const next: PptxTextStyle = {
      ...style,
      color: normalizeColor(computed.color) ?? style.color,
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
  if (styles.filter && styles.filter !== 'none') return true;
  return Boolean(styles.mixBlendMode && styles.mixBlendMode !== 'normal');
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
): Promise<PptxImageObject | null> {
  const src = img.currentSrc || img.src;
  if (!src) return null;

  const image = await readImage(src);
  if (!image) return null;

  return {
    kind: 'image',
    ...box,
    alt: img.alt || undefined,
    mime: image.mime,
    data: image.data,
  };
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
        color: normalizeColor(styles.color) ?? undefined,
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
    ? `<p:bg><p:bgPr>${fillXml(slide.background)}</p:bgPr></p:bg>`
    : '';
  const objects = slide.objects.map((object) => objectXml(object, ctx)).join('');
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
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Shape ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${xfrmXml(shape)}<a:prstGeom prst="${geom}"><a:avLst/></a:prstGeom>${fillXml(shape.fill ?? null)}${lineXml(shape.stroke ?? null)}</p:spPr></p:sp>`;
}

function textXml(text: PptxTextObject, ctx: SlideBuildContext): string {
  const id = ctx.shapeId++;
  const paragraphs = text.paragraphs.map((paragraph) => paragraphXml(paragraph, text)).join('');
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Text ${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr>${xfrmXml(text)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0"/><a:lstStyle/>${paragraphs}</p:txBody></p:sp>`;
}

function paragraphXml(paragraph: PptxTextRun[], text: PptxTextObject): string {
  const align =
    text.align && text.align !== 'left' ? ` algn="${pptxTextAlignValue(text.align)}"` : '';
  const runs = paragraph.map((run) => runXml(run, text)).join('');
  return `<a:p><a:pPr${align}/>${runs}</a:p>`;
}

function runXml(run: PptxTextRun, text: PptxTextObject): string {
  const color = normalizeColor(run.color ?? text.color ?? '#000000') ?? '000000';
  const fontSize = Math.max(1, Math.round((run.fontSize ?? text.fontSize ?? 18) * 100));
  const attrs = [
    `sz="${fontSize}"`,
    run.bold ? 'b="1"' : '',
    run.italic ? 'i="1"' : '',
    run.letterSpacing ? `spc="${Math.round(run.letterSpacing * 100)}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const fontFamily = run.fontFamily ?? text.fontFamily;
  const latin = fontFamily ? `<a:latin typeface="${escapeXml(fontFamily)}"/>` : '';
  return `<a:r><a:rPr ${attrs}><a:solidFill><a:srgbClr val="${color}"/></a:solidFill>${latin}</a:rPr><a:t>${escapeXml(run.text)}</a:t></a:r>`;
}

function pictureXml(image: PptxImageObject, ctx: SlideBuildContext): string {
  const id = ctx.shapeId++;
  const relId = `rId${ctx.media.length + 2}`;
  ctx.media.push({ data: image.data, ext: imageExt(image.mime), relId });
  const name = escapeXml(image.alt || `Picture ${id}`);
  return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="${name}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${xfrmXml(image)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
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
  const color = normalizeColor(cell.color ?? '#000000') ?? '000000';
  const fontSize = Math.max(1, Math.round((cell.fontSize ?? 18) * 100));
  const attrs = [`sz="${fontSize}"`, cell.bold ? 'b="1"' : '', cell.italic ? 'i="1"' : '']
    .filter(Boolean)
    .join(' ');
  const latin = cell.fontFamily ? `<a:latin typeface="${escapeXml(cell.fontFamily)}"/>` : '';
  return `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:pPr${align}/><a:r><a:rPr ${attrs}><a:solidFill><a:srgbClr val="${color}"/></a:solidFill>${latin}</a:rPr><a:t>${escapeXml(cell.text)}</a:t></a:r></a:p></a:txBody><a:tcPr>${fillXml(cell.fill ?? null)}</a:tcPr></a:tc>`;
}

function pptxTextAlignValue(align: NonNullable<PptxTextObject['align']>): string {
  return align === 'justify' ? 'just' : align;
}

function xfrmXml(box: PptxBox): string {
  return `<a:xfrm><a:off x="${pxToEmuX(box.x)}" y="${pxToEmuY(box.y)}"/><a:ext cx="${pxToEmuX(box.w)}" cy="${pxToEmuY(box.h)}"/></a:xfrm>`;
}

function graphicFrameXfrmXml(box: PptxBox): string {
  return `<p:xfrm><a:off x="${pxToEmuX(box.x)}" y="${pxToEmuY(box.y)}"/><a:ext cx="${pxToEmuX(box.w)}" cy="${pxToEmuY(box.h)}"/></p:xfrm>`;
}

function fillXml(fill: PptxFill): string {
  if (!fill) return '<a:noFill/>';
  if (typeof fill === 'string') {
    const color = normalizeColor(fill);
    return color ? `<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>` : '<a:noFill/>';
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
      return `<a:gs pos="${pos}"><a:srgbClr val="${normalizeColor(stop.color) ?? 'FFFFFF'}"/></a:gs>`;
    })
    .join('');
  return `<a:gradFill rotWithShape="1"><a:gsLst>${gs}</a:gsLst><a:lin ang="${Math.round(fill.angle * 60000)}" scaled="0"/></a:gradFill>`;
}

function lineXml(stroke: PptxStroke | null): string {
  if (!stroke) return '<a:ln><a:noFill/></a:ln>';
  return `<a:ln w="${Math.round(stroke.width * 12700)}"><a:solidFill><a:srgbClr val="${normalizeColor(stroke.color) ?? '000000'}"/></a:solidFill><a:prstDash val="solid"/></a:ln>`;
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
  const color = normalizeColor(colorMatch[1]);
  if (!color) return null;
  const posMatch = /(-?\d+(?:\.\d+)?)%/.exec(colorMatch[2] ?? '');
  const position = posMatch
    ? clamp(Number.parseFloat(posMatch[1]) / 100, 0, 1)
    : count <= 1
      ? 0
      : index / (count - 1);
  return { color, position };
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

function normalizeColor(value?: string | null): string | null {
  if (!value) return null;
  const color = value.trim();
  if (!color || color === 'transparent') return null;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) return hex.replace(/./g, (char) => char + char).toUpperCase();
    if (hex.length === 4) {
      if (hex[3] === '0') return null;
      return hex
        .slice(0, 3)
        .replace(/./g, (char) => char + char)
        .toUpperCase();
    }
    if (hex.length === 6) return hex.toUpperCase();
    if (hex.length === 8) return hex.slice(6) === '00' ? null : hex.slice(0, 6).toUpperCase();
  }

  const rgb = /^rgba?\((.+)\)$/i.exec(color);
  if (rgb) {
    const parts = rgb[1].split(',').map((part) => part.trim());
    const alpha = parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);
    if (alpha <= 0) return null;
    return parts
      .slice(0, 3)
      .map((part) =>
        clamp(Math.round(Number.parseFloat(part)), 0, 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
      .toUpperCase();
  }

  return null;
}

function textAlign(value: string): PptxTextObject['align'] {
  if (value === 'center' || value === 'right' || value === 'justify') return value;
  return 'left';
}

function normalizeFontFamily(value: string): string | undefined {
  return value
    .split(',')[0]
    ?.trim()
    .replace(/^['"]|['"]$/g, '');
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
