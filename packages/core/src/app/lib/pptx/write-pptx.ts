import PptxGenJS from 'pptxgenjs';
import {
  isRenderableNode,
  PPTX_CANVAS_WIDTH,
  type PptxImageNode,
  type PptxRasterNode,
  type PptxSceneNode,
  type PptxShapeNode,
  type PptxSlideScene,
  type PptxTextNode,
} from './scene';

const PPTX_WIDTH_IN = 13.333333;
const PPTX_HEIGHT_IN = 7.5;
const PX_PER_IN = PPTX_CANVAS_WIDTH / PPTX_WIDTH_IN;
const PPTX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

type PptxPresentation = InstanceType<typeof PptxGenJS>;
type PptxSlide = ReturnType<PptxPresentation['addSlide']>;

export type WritePptxFileRequest = {
  title?: string;
  slides: PptxSlideScene[];
  notes?: string[];
};

export function pxToIn(px: number): number {
  return px / PX_PER_IN;
}

export async function writePptxFile(request: WritePptxFileRequest): Promise<Blob> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'OPEN_SLIDE_WIDE', width: PPTX_WIDTH_IN, height: PPTX_HEIGHT_IN });
  pptx.layout = 'OPEN_SLIDE_WIDE';
  pptx.author = 'open-slide';
  if (request.title) pptx.title = request.title;

  for (const [index, scene] of request.slides.entries()) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };

    for (const node of scene.nodes) {
      if (!isRenderableNode(node)) continue;
      addSceneNode(slide, node);
    }

    const notes = request.notes?.[index];
    if (notes) slide.addNotes(notes);
  }

  const output = await pptx.write({ outputType: 'blob' });
  return normalizePptxBlob(output);
}

function addSceneNode(slide: PptxSlide, node: PptxSceneNode): void {
  switch (node.kind) {
    case 'text':
      addTextNode(slide, node);
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
  slide.addText(node.text, {
    ...positionProps(node),
    rotate: node.rotation,
    margin: 0,
    fit: 'shrink',
    breakLine: false,
    color: node.style.color,
    fontFace: node.style.fontFace,
    fontSize: node.style.fontSize,
    bold: node.style.bold,
    italic: node.style.italic,
    underline: node.style.underline ? { style: 'sng' } : undefined,
    align: node.style.align,
    valign: node.style.valign,
    transparency: opacityToTransparency(node.style.opacity),
    lineSpacingMultiple: node.style.lineHeight,
  });
}

export function addShapeNode(slide: PptxSlide, node: PptxShapeNode): void {
  slide.addShape(shapeNameForNode(node), {
    ...positionProps(node),
    rotate: node.rotation,
    fill: node.fill ? { color: node.fill } : { color: 'FFFFFF', transparency: 100 },
    line: node.stroke
      ? {
          color: node.stroke.color,
          width: node.stroke.width,
          transparency: opacityToTransparency(node.stroke.opacity),
        }
      : { color: 'FFFFFF', transparency: 100 },
  });
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

function positionProps(node: PptxSceneNode) {
  return {
    x: pxToIn(node.x),
    y: pxToIn(node.y),
    w: pxToIn(node.w),
    h: pxToIn(node.h),
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
