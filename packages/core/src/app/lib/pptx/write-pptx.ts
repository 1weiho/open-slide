import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import PptxGenJS from 'pptxgenjs';
import { createOmmlEquation, ensureMathNamespace } from './equation';
import {
  isRenderableNode,
  PPTX_CANVAS_WIDTH,
  type PptxChartNode,
  type PptxEquationNode,
  type PptxImageNode,
  type PptxRasterNode,
  type PptxRect,
  type PptxRichTextNode,
  type PptxSceneNode,
  type PptxShapeNode,
  type PptxSlideScene,
  type PptxTableNode,
  type PptxTextNode,
  type PptxTextStyle,
} from './scene';

const PPTX_WIDTH_IN = 13.333333;
const PPTX_HEIGHT_IN = 7.5;
const PX_PER_IN = PPTX_CANVAS_WIDTH / PPTX_WIDTH_IN;
const PT_PER_PX = 72 / PX_PER_IN;
const PPTX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const TEXT_LINE_WIDTH_CUSHION_RATIO = 0.12;
const TEXT_LINE_WIDTH_CUSHION_MAX_PX = 120;

type PptxPresentation = InstanceType<typeof PptxGenJS>;
type PptxSlide = ReturnType<PptxPresentation['addSlide']>;
type PptxEquationReplacement = {
  omml: string;
  token: string;
};

export type WritePptxFileRequest = {
  title?: string;
  slides: PptxSlideScene[];
  notes?: string[];
};

export function pxToIn(px: number): number {
  return px / PX_PER_IN;
}

export function pxToPt(px: number | undefined): number | undefined {
  return px === undefined ? undefined : px * PT_PER_PX;
}

export async function writePptxFile(request: WritePptxFileRequest): Promise<Blob> {
  const pptx = new PptxGenJS();
  const equationReplacements: PptxEquationReplacement[] = [];
  pptx.defineLayout({ name: 'OPEN_SLIDE_WIDE', width: PPTX_WIDTH_IN, height: PPTX_HEIGHT_IN });
  pptx.layout = 'OPEN_SLIDE_WIDE';
  pptx.author = 'open-slide';
  if (request.title) pptx.title = request.title;

  for (const [index, scene] of request.slides.entries()) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };

    for (const node of scene.nodes) {
      if (!isRenderableNode(node)) continue;
      addSceneNode(slide, node, equationReplacements);
    }

    const notes = request.notes?.[index];
    if (notes) slide.addNotes(notes);
  }

  const output = await pptx.write({ outputType: 'blob' });
  const blob = normalizePptxBlob(output);
  return equationReplacements.length > 0
    ? replaceEquationPlaceholders(blob, equationReplacements)
    : blob;
}

function addSceneNode(
  slide: PptxSlide,
  node: PptxSceneNode,
  equationReplacements: PptxEquationReplacement[],
): void {
  switch (node.kind) {
    case 'text':
      addTextNode(slide, node);
      return;
    case 'richText':
      addRichTextNode(slide, node);
      return;
    case 'equation':
      addEquationNode(slide, node, equationReplacements);
      return;
    case 'table':
      addTableNode(slide, node);
      return;
    case 'chart':
      addChartNode(slide, node);
      return;
    case 'shape':
      addShapeNode(slide, node);
      return;
    case 'image':
      addImageNode(slide, node);
      return;
    case 'raster':
      addRasterNode(slide, node);
      return;
  }
}

export function addTextNode(slide: PptxSlide, node: PptxTextNode): void {
  if (node.lineBreakPolicy === 'preserve-browser-lines' && node.lines && node.lines.length > 0) {
    for (const line of node.lines) {
      slide.addText(line.text, {
        ...positionProps(expandTextLineRect(line, node.style)),
        rotate: node.rotation,
        margin: 0,
        fit: 'none',
        breakLine: false,
        ...textStyleProps(node.style, { singleLine: true }),
      });
    }
    return;
  }

  slide.addText(node.text, {
    ...positionProps(node),
    rotate: node.rotation,
    margin: 0,
    fit: 'none',
    breakLine: false,
    ...textStyleProps(node.style),
  });
}

export function addRichTextNode(slide: PptxSlide, node: PptxRichTextNode): void {
  if (node.lineBreakPolicy === 'preserve-browser-lines' && node.lines && node.lines.length > 0) {
    for (const line of node.lines) {
      slide.addText(
        line.runs.map((run) => ({
          text: run.text,
          options: textStyleProps({ ...node.style, ...run.style }, { singleLine: true }),
        })),
        {
          ...positionProps(expandTextLineRect(line, node.style)),
          rotate: node.rotation,
          margin: 0,
          fit: 'none',
          breakLine: false,
          ...textStyleProps(node.style, { singleLine: true }),
        },
      );
    }
    return;
  }

  slide.addText(
    node.runs.map((run) => ({
      text: run.text,
      options: textStyleProps({ ...node.style, ...run.style }),
    })),
    {
      ...positionProps(node),
      rotate: node.rotation,
      margin: 0,
      fit: 'none',
      breakLine: false,
      ...textStyleProps(node.style),
    },
  );
}

export function addEquationNode(
  slide: PptxSlide,
  node: PptxEquationNode,
  equationReplacements: PptxEquationReplacement[] = [],
): void {
  const omml = createOmmlEquation(node);
  const token = omml ? `OSD_PPTX_EQUATION_${equationReplacements.length}` : null;
  if (token && omml) {
    equationReplacements.push({ omml, token });
  }

  slide.addText(token ?? node.fallbackText ?? node.latex ?? node.mathml ?? '', {
    ...positionProps(node),
    rotate: node.rotation,
    margin: 0,
    fit: 'none',
    breakLine: false,
    ...textStyleProps(node.style),
  });
}

export function addTableNode(slide: PptxSlide, node: PptxTableNode): void {
  const header = node.columns.map((column) => ({
    text: column,
    options: { bold: true, fill: { color: 'FFFAF0' }, margin: 0.04 },
  }));
  const rows = node.rows.map((row) =>
    row.map((cell) => ({
      options: { fill: { color: 'FFFAF0' }, margin: 0.04 },
      text: cell,
    })),
  );

  slide.addTable([header, ...rows], {
    ...positionProps(node),
    border: { type: 'none' },
    color: node.style.color,
    fill: { color: 'FFFAF0' },
    fontFace: node.style.fontFace,
    fontSize: pxToPt(node.style.fontSize),
    margin: 0.04,
  });
}

export function addChartNode(slide: PptxSlide, node: PptxChartNode): void {
  slide.addChart(
    chartTypeForNode(node),
    node.series.map((series) => ({
      labels: node.labels,
      name: series.name,
      values: series.values,
    })),
    {
      ...positionProps(node),
      altText: node.title,
      catAxisLabelFontFace: node.style.fontFace,
      catAxisLabelFontSize: pxToPt(node.style.fontSize),
      chartColors: node.series.map((series) => series.color).filter(isString),
      showLegend: node.series.length > 1,
      showTitle: Boolean(node.title),
      showValue: false,
      title: node.title,
      titleColor: node.style.color,
      titleFontFace: node.style.fontFace,
      titleFontSize: pxToPt(node.style.fontSize),
      valAxisLabelFontFace: node.style.fontFace,
      valAxisLabelFontSize: pxToPt(node.style.fontSize),
    },
  );
}

function textStyleProps(style: PptxTextStyle, options: { singleLine?: boolean } = {}) {
  return {
    color: style.color,
    fontFace: style.fontFace,
    fontSize: pxToPt(style.fontSize),
    bold: style.bold,
    italic: style.italic,
    underline: style.underline ? { style: 'sng' as const } : undefined,
    align: style.align,
    valign: style.valign,
    transparency: opacityToTransparency(style.opacity),
    charSpacing: pxToPt(style.charSpacing),
    lineSpacing: options.singleLine ? undefined : pxToPt(style.lineHeight),
  };
}

export function addShapeNode(slide: PptxSlide, node: PptxShapeNode): void {
  slide.addShape(shapeNameForNode(node), {
    ...positionProps(node),
    rotate: node.rotation,
    rectRadius: rectRadiusForNode(node),
    fill: node.fill ? { color: node.fill } : { color: 'FFFFFF', transparency: 100 },
    line: node.stroke
      ? {
          color: node.stroke.color,
          dashType: node.stroke.dash,
          width: pxToPt(node.stroke.width),
          transparency: opacityToTransparency(node.stroke.opacity),
        }
      : { color: 'FFFFFF', transparency: 100 },
  });
}

function rectRadiusForNode(node: PptxShapeNode): number | undefined {
  if (node.shape !== 'roundRect' || !node.radius) {
    return undefined;
  }

  const shortestSide = Math.min(node.w, node.h);
  if (shortestSide <= 0) {
    return undefined;
  }

  return Math.min(1, Math.max(0, node.radius / shortestSide));
}

export function addImageNode(slide: PptxSlide, node: PptxImageNode): void {
  slide.addImage({
    ...imageSourceProps(node.src),
    ...positionProps(node),
    rotate: node.rotation,
    altText: node.alt,
    sizing: imageSizingProps(node),
  });
}

export function addRasterNode(slide: PptxSlide, node: PptxRasterNode): void {
  slide.addImage({
    data: node.dataUrl,
    ...positionProps(node),
    rotate: node.rotation,
  });
}

function positionProps(node: PptxRect) {
  return {
    x: pxToIn(node.x),
    y: pxToIn(node.y),
    w: pxToIn(node.w),
    h: pxToIn(node.h),
  };
}

function expandTextLineRect(line: PptxRect, style: PptxTextStyle): PptxRect {
  const cushion = Math.min(TEXT_LINE_WIDTH_CUSHION_MAX_PX, line.w * TEXT_LINE_WIDTH_CUSHION_RATIO);
  return {
    ...line,
    h: Math.max(line.h, style.lineHeight ?? (style.fontSize ? style.fontSize * 1.2 : line.h)),
    w: line.w + cushion,
  };
}

function shapeNameForNode(node: PptxShapeNode) {
  switch (node.shape) {
    case 'rect':
      return 'rect';
    case 'roundRect':
      return 'roundRect';
    case 'ellipse':
      return 'ellipse';
    case 'line':
      return 'line';
  }
}

function chartTypeForNode(node: PptxChartNode) {
  switch (node.chartType) {
    case 'bar':
      return 'bar';
    case 'line':
      return 'line';
    case 'pie':
      return 'pie';
    case 'doughnut':
      return 'doughnut';
  }
}

function imageSourceProps(src: string): { data: string } | { path: string } {
  return src.startsWith('data:') ? { data: src } : { path: src };
}

function imageSizingProps(node: PptxImageNode) {
  if (!node.fit || node.fit === 'stretch') return undefined;

  return {
    type: node.fit,
    x: pxToIn(node.x),
    y: pxToIn(node.y),
    w: pxToIn(node.w),
    h: pxToIn(node.h),
  };
}

function isString(value: string | undefined): value is string {
  return typeof value === 'string' && value.length > 0;
}

async function replaceEquationPlaceholders(
  blob: Blob,
  replacements: PptxEquationReplacement[],
): Promise<Blob> {
  const zip = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  const replacementMap = new Map(
    replacements.map((replacement) => [replacement.token, replacement]),
  );

  for (const path of Object.keys(zip)) {
    if (!path.startsWith('ppt/slides/slide') || !path.endsWith('.xml')) {
      continue;
    }

    let xml = strFromU8(zip[path]);
    let changed = false;
    for (const replacement of replacementMap.values()) {
      if (!xml.includes(replacement.token)) {
        continue;
      }

      xml = replaceEquationParagraph(xml, replacement);
      changed = true;
    }

    if (changed) {
      zip[path] = strToU8(ensureMathNamespace(xml));
    }
  }

  const bytes = zipSync(zip);
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  return new Blob([arrayBuffer], { type: PPTX_MIME_TYPE });
}

function replaceEquationParagraph(xml: string, replacement: PptxEquationReplacement): string {
  const escapedToken = escapeRegExp(replacement.token);
  const paragraphRe = new RegExp(
    `<a:p>(?:(?!</a:p>)[\\s\\S])*?<a:t>${escapedToken}</a:t>(?:(?!</a:p>)[\\s\\S])*?</a:p>`,
  );
  return xml.replace(paragraphRe, (paragraph) => {
    const defaultRunProperties = extractDefaultRunProperties(paragraph);
    const paragraphProperties = defaultRunProperties
      ? `<a:pPr>${defaultRunProperties}</a:pPr>`
      : '';
    return `<a:p>${paragraphProperties}<a14:m>${replacement.omml}</a14:m></a:p>`;
  });
}

function extractDefaultRunProperties(paragraph: string): string | null {
  const runProperties = paragraph.match(/<a:rPr(?<attrs>[^>]*)>(?<content>[\s\S]*?)<\/a:rPr>/);
  if (runProperties?.groups) {
    return `<a:defRPr${runProperties.groups.attrs}>${runProperties.groups.content}</a:defRPr>`;
  }

  const emptyRunProperties = paragraph.match(/<a:rPr(?<attrs>[^>]*)\/>/);
  return emptyRunProperties?.groups ? `<a:defRPr${emptyRunProperties.groups.attrs}/>` : null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function opacityToTransparency(opacity: number | undefined): number | undefined {
  if (opacity === undefined) return undefined;
  return Math.round((1 - Math.min(Math.max(opacity, 0), 1)) * 100);
}

function normalizePptxBlob(output: string | ArrayBuffer | Blob | Uint8Array): Blob {
  if (output instanceof Blob) {
    return output.type === PPTX_MIME_TYPE ? output : output.slice(0, output.size, PPTX_MIME_TYPE);
  }

  if (output instanceof Uint8Array) {
    return new Blob([new Uint8Array(output)], { type: PPTX_MIME_TYPE });
  }

  return new Blob([output], { type: PPTX_MIME_TYPE });
}
