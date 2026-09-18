import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import PptxGenJS from 'pptxgenjs';
import { type FontObjectPatch, patchFonts } from './font-xml';
import { patchGroups } from './group-xml';
import { type PlannedGroup, planGroups } from './groups';
import {
  EditablePptxError,
  type PptxCell,
  type PptxColor,
  type PptxDeck,
  type PptxGradient,
  type PptxImage,
  type PptxLink,
  type PptxObject,
  type PptxPage,
  type PptxParagraph,
  type PptxRun,
  type PptxShadow,
  type PptxShape,
  type PptxStroke,
  type PptxTable,
  type PptxText,
  type PptxWriteResult,
} from './model';
import { radialFillShapes } from './radial';
import { validateDeck } from './validate';

const PX_PER_INCH = 144;
const PT_PER_PX = 0.5;
const SLIDE_WIDTH = 13 + 1 / 3;
const SLIDE_HEIGHT = 7.5;
const MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const EMU_PER_INCH = 914400;
const SVG_REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image';
const SVG_EXT_URI = '{96DAC541-7B7A-43D3-8B79-37D633B846F1}';

type Crop = NonNullable<PptxImage['crop']>;
type TextOptions = PptxGenJS.TextPropsOptions;
type TableCell = PptxGenJS.TableCell;
type GradientPatch = { id: string; gradient: PptxGradient; width: number; height: number };
type GradientRunPatch = { gradient: PptxGradient; width: number; height: number };
type GradientParagraphPatch = Array<GradientRunPatch | undefined>;
type TextGradientPatch = { id: string; paragraphs: GradientParagraphPatch[] };
type TableGradientPatch = { id: string; cells: GradientParagraphPatch[][][] };
type TextPart = { props: PptxGenJS.TextProps; gradient?: GradientRunPatch };
type EffectPatch = { id: string; shadow?: PptxShadow; blur?: number };
type StrokePatch = { id: string; stroke: PptxStroke };
type SvgPatch = { id: string; data: string };
type PagePatch = {
  crops: Crop[];
  fonts: FontObjectPatch[];
  groups: PlannedGroup[];
  expanded: Map<string, string[]>;
  gradients: GradientPatch[];
  textGradients: TextGradientPatch[];
  tableGradients: TableGradientPatch[];
  effects: EffectPatch[];
  strokes: StrokePatch[];
  svgs: SvgPatch[];
};

function pxToInches(value: number): number {
  return value / PX_PER_INCH;
}

function pxToPoints(value: number): number {
  return value * PT_PER_PX;
}

function pxToEmu(value: number): number {
  return Math.round(pxToInches(value) * EMU_PER_INCH);
}

function fixedAngle(value: number): number {
  const normalized = ((value % 360) + 360) % 360;
  return Math.round(normalized * 60000);
}

function xmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&apos;';
    }
  });
}

function objectNameMatches(xml: string, id: string): boolean {
  const name = /<p:cNvPr\b[^>]*\bname="([^"]*)"/.exec(xml)?.[1];
  return name === xmlEscape(id);
}

function colorXml(value: PptxColor): string {
  return `<a:srgbClr val="${hexColor(value)}"><a:alpha val="${Math.round(value.opacity * 100000)}"/></a:srgbClr>`;
}

function shadowXml(value: PptxShadow): string {
  const distance = Math.hypot(value.x, value.y);
  const direction = Math.atan2(value.y, value.x) * (180 / Math.PI);
  const attributes = value.inset
    ? ''
    : ' sx="100000" sy="100000" kx="0" ky="0" algn="bl" rotWithShape="1"';
  const type = value.inset ? 'inner' : 'outer';
  return `<a:${type}Shdw${attributes} blurRad="${pxToEmu(value.blur)}" dist="${pxToEmu(distance)}" dir="${fixedAngle(direction)}">${colorXml(value)}</a:${type}Shdw>`;
}

function effectsXml(effect: EffectPatch): string | undefined {
  const children: string[] = [];
  if (effect.blur !== undefined && effect.blur > 0)
    children.push(`<a:blur rad="${pxToEmu(effect.blur)}" grow="1"/>`);
  if (effect.shadow) children.push(shadowXml(effect.shadow));
  return children.length > 0 ? `<a:effectLst>${children.join('')}</a:effectLst>` : undefined;
}

function pathPoints(object: PptxShape): NonNullable<PptxGenJS.ShapeProps['points']> {
  return (object.path ?? []).map((command, index) => {
    switch (command.type) {
      case 'move':
        return { x: pxToInches(command.x), y: pxToInches(command.y), moveTo: true };
      case 'line':
        return {
          x: pxToInches(command.x),
          y: pxToInches(command.y),
          moveTo: index === 0,
        };
      case 'cubic':
        return {
          x: pxToInches(command.x),
          y: pxToInches(command.y),
          curve: {
            type: 'cubic' as const,
            x1: pxToInches(command.x1),
            y1: pxToInches(command.y1),
            x2: pxToInches(command.x2),
            y2: pxToInches(command.y2),
          },
        };
      case 'close':
        return { close: true };
      default:
        throw new Error('Unsupported custom path command.');
    }
  });
}

function gradientXml(value: PptxGradient, width: number, height: number): string {
  const stops = value.stops
    .map((stop) => `<a:gs pos="${Math.round(stop.offset * 100000)}">${colorXml(stop.color)}</a:gs>`)
    .join('');
  if (value.kind === 'linear') {
    const angle = (value.angle ?? 180) - 90;
    return `<a:gradFill flip="none" rotWithShape="1"><a:gsLst>${stops}</a:gsLst><a:lin ang="${fixedAngle(angle)}" scaled="1"/></a:gradFill>`;
  }
  const centerX = value.center?.x ?? 0.5;
  const centerY = value.center?.y ?? 0.5;
  const outer = Math.hypot(width, height);
  const outerLeft = (width - outer) / 2;
  const outerTop = (height - outer) / 2;
  const outerRight = outerLeft + outer;
  const outerBottom = outerTop + outer;
  const left = Math.round(((centerX * width - outerLeft) / outer) * 100000);
  const top = Math.round(((centerY * height - outerTop) / outer) * 100000);
  const right = Math.round(((outerRight - centerX * width) / outer) * 100000);
  const bottom = Math.round(((outerBottom - centerY * height) / outer) * 100000);
  return `<a:gradFill flip="none" rotWithShape="1"><a:gsLst>${stops}</a:gsLst><a:path path="circle"><a:fillToRect l="${left}" t="${top}" r="${right}" b="${bottom}"/></a:path></a:gradFill>`;
}

function hexColor(value: PptxColor): string {
  const raw = value.color.trim().replace(/^#/, '');
  if (raw.length === 3)
    return raw
      .split('')
      .map((part) => part + part)
      .join('')
      .toUpperCase();
  return raw.toUpperCase();
}

function transparency(value: PptxColor): number {
  return Math.max(0, Math.min(100, (1 - value.opacity) * 100));
}

function fill(value: PptxColor | undefined): PptxGenJS.ShapeFillProps | undefined {
  if (!value || value.opacity <= 0) return undefined;
  return { color: hexColor(value), transparency: transparency(value) };
}

function line(value: PptxStroke | undefined): PptxGenJS.ShapeLineProps {
  if (!value || value.width <= 0 || value.opacity <= 0) return { type: 'none' };
  return {
    type: 'solid',
    color: hexColor(value),
    transparency: transparency(value),
    width: pxToPoints(value.width),
    dashType: value.dash === 'dot' ? 'sysDot' : value.dash === 'dash' ? 'dash' : 'solid',
  };
}

function hyperlink(value: PptxLink | undefined): PptxGenJS.HyperlinkProps | undefined {
  if (!value) return undefined;
  return 'url' in value ? { url: value.url } : { slide: value.slide };
}

function position(object: PptxObject): PptxGenJS.PositionProps {
  return {
    x: pxToInches(object.x),
    y: pxToInches(object.y),
    w: pxToInches(object.w),
    h: pxToInches(object.h),
  };
}

function gradientRunPatch(
  run: PptxRun,
  fallbackWidth: number,
  fallbackHeight: number,
): GradientRunPatch | undefined {
  if (!run.gradient || !run.text) return undefined;
  return {
    gradient: run.gradient,
    width: run.gradientBounds?.w ?? fallbackWidth,
    height: run.gradientBounds?.h ?? fallbackHeight,
  };
}

function runOptions(
  run: PptxRun,
  paragraph: PptxParagraph,
  first: boolean,
  breakLine: boolean,
  objectLink?: PptxLink,
): TextOptions {
  const options: TextOptions = {
    fontFace: run.fontFace,
    fontSize: pxToPoints(run.fontSize),
    color: hexColor(run.color),
    transparency: transparency(run.color),
    bold: run.bold,
    italic: run.italic,
    underline: run.underline ? { style: 'sng' } : undefined,
    strike: run.strike,
    charSpacing: pxToPoints(run.letterSpacing),
    lang: run.lang,
    hyperlink: hyperlink(run.link ?? objectLink),
    align: first ? paragraph.align : undefined,
    lineSpacing: first ? pxToPoints(paragraph.lineHeight) : undefined,
    paraSpaceBefore: first ? pxToPoints(paragraph.spaceBefore) : undefined,
    paraSpaceAfter: first ? pxToPoints(paragraph.spaceAfter) : undefined,
    breakLine,
  };
  if (first && paragraph.list) {
    const indent = pxToPoints(paragraph.list.indent);
    options.indentLevel = paragraph.list.level;
    options.bullet =
      paragraph.list.kind === 'bullet'
        ? { characterCode: '2022', indent }
        : {
            type: 'number',
            numberType: 'arabicPeriod',
            numberStartAt: paragraph.list.start,
            indent,
          };
  }
  return options;
}

function paragraphRuns(
  paragraph: PptxParagraph,
  isLastParagraph: boolean,
  objectLink?: PptxLink,
  fallbackWidth = 1,
  fallbackHeight = 1,
): TextPart[] {
  const runs =
    paragraph.runs.length > 0
      ? paragraph.runs
      : [
          {
            text: '',
            fontFace: 'Arial',
            fontSize: 18,
            color: { color: '000000', opacity: 1 },
            bold: false,
            italic: false,
            underline: false,
            strike: false,
            letterSpacing: 0,
            lang: 'en-US',
          } satisfies PptxRun,
        ];
  return runs.flatMap((run, runIndex) => {
    const lines = run.text.split(/\r\n|\r|\n/);
    return lines.map((text, lineIndex) => {
      const props = {
        text,
        options: {
          ...runOptions(
            { ...run, text },
            paragraph,
            runIndex === 0 && lineIndex === 0,
            isLastParagraph && runIndex === runs.length - 1
              ? false
              : runIndex === runs.length - 1 && lineIndex === lines.length - 1,
            objectLink,
          ),
          softBreakBefore: lineIndex > 0,
        },
      } satisfies PptxGenJS.TextProps;
      return { props, gradient: gradientRunPatch(run, fallbackWidth, fallbackHeight) };
    });
  });
}

function textOptions(object: PptxText): TextOptions {
  const firstRun = object.paragraphs.flatMap((paragraph) => paragraph.runs)[0];
  return {
    ...position(object),
    isTextBox: true,
    objectName: object.id,
    margin: 0,
    valign: 'top',
    wrap: object.wrap ?? true,
    fit: 'none',
    rotate: object.rotation,
    fontFace: firstRun?.fontFace,
    fontSize: firstRun ? pxToPoints(firstRun.fontSize) : undefined,
    color: firstRun ? hexColor(firstRun.color) : undefined,
  };
}

function writeText(slide: PptxGenJS.Slide, object: PptxText, patch: PagePatch): void {
  const paragraphs = object.paragraphs.map((paragraph, index) =>
    paragraphRuns(
      paragraph,
      index === object.paragraphs.length - 1,
      object.link,
      object.w,
      object.h,
    ),
  );
  slide.addText(
    paragraphs.flat().map(({ props }) => props),
    textOptions(object),
  );
  const gradients = paragraphs.map((parts) =>
    parts.filter((part) => Boolean(part.props.text)).map((part) => part.gradient),
  );
  if (gradients.some((runs) => runs.some(Boolean)))
    patch.textGradients.push({ id: object.id, paragraphs: gradients });
}

function shapeType(pptx: PptxGenJS, geometry: PptxShape['geometry']): PptxGenJS.SHAPE_NAME {
  switch (geometry) {
    case 'rect':
      return pptx.ShapeType.rect;
    case 'roundRect':
      return pptx.ShapeType.roundRect;
    case 'ellipse':
      return pptx.ShapeType.ellipse;
    case 'line':
      return pptx.ShapeType.line;
    case 'path':
      return 'custGeom' as PptxGenJS.SHAPE_NAME;
  }
}

function writeShape(pptx: PptxGenJS, slide: PptxGenJS.Slide, object: PptxShape): void {
  const options: PptxGenJS.ShapeProps = {
    ...position(object),
    objectName: object.id,
    rotate: object.rotation,
    flipH: object.flipH,
    flipV: object.flipV,
    fill:
      object.geometry === 'line'
        ? undefined
        : fill(object.gradient?.stops[0]?.color ?? object.fill),
    line: line(object.stroke),
    hyperlink: hyperlink(object.link),
  };
  if (object.geometry === 'path') options.points = pathPoints(object);
  if (object.geometry === 'roundRect' && object.radius) {
    options.rectRadius = pxToInches(Math.min(object.radius, Math.min(object.w, object.h) / 2));
  }
  if (object.geometry === 'line') {
    options.line = {
      ...line(object.stroke),
      beginArrowType: object.startArrow ? 'triangle' : 'none',
      endArrowType: object.endArrow ? 'triangle' : 'none',
    };
  }
  slide.addShape(shapeType(pptx, object.geometry), options);
}

function imageData(image: PptxImage): string {
  const data = image.data.trim();
  return data.toLowerCase().startsWith('data:') ? data : `data:${image.mime};base64,${data}`;
}

function writeImage(slide: PptxGenJS.Slide, object: PptxImage): void {
  slide.addImage({
    ...position(object),
    data: imageData(object),
    objectName: object.id,
    hyperlink: hyperlink(object.link),
    rotate: object.rotation,
    transparency:
      object.opacity === undefined
        ? undefined
        : Math.max(0, Math.min(100, (1 - object.opacity) * 100)),
  });
}

function cellText(
  cell: PptxCell,
  fallbackWidth: number,
  fallbackHeight: number,
): { text: TableCell[]; gradients: GradientParagraphPatch[] } {
  const paragraphs = cell.paragraphs.map((paragraph, index) =>
    paragraphRuns(
      paragraph,
      index === cell.paragraphs.length - 1,
      undefined,
      fallbackWidth,
      fallbackHeight,
    ),
  );
  return {
    text: paragraphs.flat().map(({ props }) => ({
      text: props.text ?? '',
      options: props.options,
    })),
    gradients: paragraphs.map((parts) =>
      parts.filter((part) => Boolean(part.props.text)).map((part) => part.gradient),
    ),
  };
}

function writeTable(slide: PptxGenJS.Slide, object: PptxTable, patch: PagePatch): void {
  const gradients: GradientParagraphPatch[][][] = [];
  const rows: PptxGenJS.TableRow[] = object.rows.map((row, rowIndex) => {
    gradients[rowIndex] = [];
    return row.map((cell, columnIndex) => {
      const content = cellText(
        cell,
        object.columnWidths[columnIndex] ?? object.w,
        object.rowHeights[rowIndex] ?? object.h,
      );
      gradients[rowIndex][columnIndex] = content.gradients;
      const firstRun = cell.paragraphs.flatMap((paragraph) => paragraph.runs)[0];
      const border = cell.borders.map((stroke) => ({
        type:
          stroke.width > 0 && stroke.opacity > 0
            ? stroke.dash === 'dash'
              ? 'dash'
              : 'solid'
            : 'none',
        color: hexColor(stroke),
        pt: pxToPoints(stroke.width),
      })) as PptxGenJS.BorderProps[];
      return {
        text: content.text,
        options: {
          margin: cell.padding.map(pxToInches) as [number, number, number, number],
          valign: cell.valign,
          fill: fill(cell.fill),
          border: border as PptxGenJS.BorderProps[] &
            [
              PptxGenJS.BorderProps,
              PptxGenJS.BorderProps,
              PptxGenJS.BorderProps,
              PptxGenJS.BorderProps,
            ],
          fontFace: firstRun?.fontFace,
          fontSize: firstRun ? pxToPoints(firstRun.fontSize) : undefined,
          color: firstRun ? hexColor(firstRun.color) : undefined,
        },
      };
    });
  });
  slide.addTable(rows, {
    ...position(object),
    objectName: object.id,
    autoPage: false,
    colW: object.columnWidths.map(pxToInches),
    rowH: object.rowHeights.map(pxToInches),
  });
  if (
    gradients.some((row) => row.some((cell) => cell.some((paragraph) => paragraph.some(Boolean))))
  )
    patch.tableGradients.push({ id: object.id, cells: gradients });
}

function writePage(
  pptx: PptxGenJS,
  page: PptxPage,
  patch: PagePatch,
  usedNames: Set<string>,
): void {
  const slide = pptx.addSlide();
  const background = fill(page.background);
  if (background) slide.background = background;
  const nextRadialName = (base: string): string => {
    let index = 0;
    let name = `${base}-radial-${index}`;
    while (usedNames.has(name)) {
      index += 1;
      name = `${base}-radial-${index}`;
    }
    usedNames.add(name);
    return name;
  };
  const objects = [...page.objects]
    .sort((left, right) => left.order - right.order)
    .flatMap((object): PptxObject[] =>
      (() => {
        const leaves =
          object.kind === 'shape' && object.gradient?.kind === 'radial'
            ? radialFillShapes(object).map((layer) => ({
                ...object,
                ...layer,
                id: nextRadialName(object.id),
              }))
            : [object];
        patch.expanded.set(
          object.id,
          leaves.map((leaf) => leaf.id),
        );
        return leaves;
      })(),
    );
  for (const object of objects) {
    const runs =
      object.kind === 'text'
        ? object.paragraphs.flatMap((paragraph) => paragraph.runs)
        : object.kind === 'table'
          ? object.rows.flatMap((row) =>
              row.flatMap((cell) => cell.paragraphs.flatMap((paragraph) => paragraph.runs)),
            )
          : [];
    if (runs.some((run) => run.latinFontFace || run.eastAsianFontFace || run.lang === 'und')) {
      patch.fonts.push({
        id: object.id,
        runs: runs.flatMap((run) =>
          run.text
            .split(/\r\n|\r|\n/)
            .filter(Boolean)
            .map(() => ({
              latin: run.latinFontFace,
              eastAsian: run.eastAsianFontFace,
              lang: run.lang,
            })),
        ),
      });
    }
    switch (object.kind) {
      case 'text':
        writeText(slide, object, patch);
        if (object.shadow || object.blur !== undefined)
          patch.effects.push({ id: object.id, shadow: object.shadow, blur: object.blur });
        break;
      case 'shape':
        writeShape(pptx, slide, object);
        if (object.gradient)
          patch.gradients.push({
            id: object.id,
            gradient: object.gradient,
            width: object.w,
            height: object.h,
          });
        if (object.stroke && (object.stroke.cap !== undefined || object.stroke.join !== undefined))
          patch.strokes.push({ id: object.id, stroke: object.stroke });
        if (object.shadow || object.blur !== undefined)
          patch.effects.push({ id: object.id, shadow: object.shadow, blur: object.blur });
        break;
      case 'table':
        writeTable(slide, object, patch);
        break;
      case 'image':
        writeImage(slide, object);
        patch.crops.push(object.crop ?? { left: 0, top: 0, right: 0, bottom: 0 });
        if (object.svgData) patch.svgs.push({ id: object.id, data: object.svgData });
        if (object.shadow || object.blur !== undefined)
          patch.effects.push({ id: object.id, shadow: object.shadow, blur: object.blur });
        break;
    }
  }
  if (page.notes) slide.addNotes(page.notes);
}

function asBlob(value: string | ArrayBuffer | Blob | Uint8Array): Promise<Blob> {
  if (value instanceof Blob) return Promise.resolve(value);
  if (typeof value === 'string')
    return Promise.reject(new Error('PptxGenJS returned an unexpected string output.'));
  return Promise.resolve(new Blob([value as BlobPart], { type: MIME }));
}

function cropXml(crop: Crop): string {
  return `<a:srcRect l="${Math.round(crop.left * 100000)}" t="${Math.round(crop.top * 100000)}" r="${Math.round(crop.right * 100000)}" b="${Math.round(crop.bottom * 100000)}"/>`;
}

function patchSlideImages(xml: string, crops: Crop[]): string {
  let index = 0;
  return xml.replace(/<p:pic>[\s\S]*?<\/p:pic>/g, (picture) => {
    const crop = crops[index++];
    if (!crop || (crop.left === 0 && crop.top === 0 && crop.right === 0 && crop.bottom === 0))
      return picture;
    const source = cropXml(crop);
    if (/<a:srcRect\b/.test(picture)) return picture.replace(/<a:srcRect\b[^>]*\/>/, source);
    return picture.replace('<a:stretch', `${source}<a:stretch`);
  });
}

function normalizeParagraphProperties(xml: string): string {
  return xml.replace(/<a:p\b[^>]*>[\s\S]*?<\/a:p>/g, (paragraph) => {
    let kept = false;
    return paragraph.replace(/<a:pPr\b[^>]*(?:\/>|>[\s\S]*?<\/a:pPr>)/g, (properties) => {
      if (kept) return '';
      kept = true;
      return properties;
    });
  });
}

function patchShapeProperties(
  block: string,
  gradient: GradientPatch | undefined,
  effects: EffectPatch | undefined,
): string {
  const replacementGradient = gradient
    ? gradientXml(gradient.gradient, gradient.width, gradient.height)
    : undefined;
  const replacementEffects = effects ? effectsXml(effects) : undefined;
  if (!replacementGradient && !replacementEffects) return block;
  const properties = /<p:spPr\b[^>]*>[\s\S]*?<\/p:spPr>/.exec(block);
  if (!properties) return block;
  let source = properties[0];
  if (replacementGradient) {
    source = source.replace(
      /<a:noFill\s*\/>|<a:solidFill\b[^>]*>[\s\S]*?<\/a:solidFill>/,
      replacementGradient,
    );
  }
  if (replacementEffects) {
    const effectPattern = /<a:effectLst\b[^>]*(?:\/>|>[\s\S]*?<\/a:effectLst>)/;
    source = effectPattern.test(source)
      ? source.replace(effectPattern, replacementEffects)
      : source.replace('</p:spPr>', `${replacementEffects}</p:spPr>`);
  }
  return block.replace(properties[0], source);
}

function patchPictureProperties(block: string, effects: EffectPatch | undefined): string {
  const replacementEffects = effects ? effectsXml(effects) : undefined;
  if (!replacementEffects) return block;
  const properties = /<p:spPr\b[^>]*>[\s\S]*?<\/p:spPr>/.exec(block);
  if (!properties) return block;
  const source = properties[0];
  const effectPattern = /<a:effectLst\b[^>]*(?:\/>|>[\s\S]*?<\/a:effectLst>)/;
  const patched = effectPattern.test(source)
    ? source.replace(effectPattern, replacementEffects)
    : source.replace('</p:spPr>', `${replacementEffects}</p:spPr>`);
  return block.replace(source, patched);
}

function patchNamedShape(
  xml: string,
  id: string,
  gradient: GradientPatch | undefined,
  effects: EffectPatch | undefined,
): { xml: string; found: boolean } {
  let found = false;
  const patched = xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (block) => {
    if (!objectNameMatches(block, id)) return block;
    found = true;
    return patchShapeProperties(block, gradient, effects);
  });
  return { xml: patched, found };
}

function patchRunGradient(xml: string, patch: GradientRunPatch, source: string): string {
  const properties = /<a:rPr\b[^>]*>[\s\S]*?<\/a:rPr>/.exec(xml);
  if (!properties) throw new Error(`The text run ${source} has no run properties.`);
  const fillPattern = /<a:solidFill\b[^>]*(?:\/>|>[\s\S]*?<\/a:solidFill>)/;
  if (!fillPattern.test(properties[0]))
    throw new Error(`The text run ${source} has no solid fill to replace.`);
  const replacement = properties[0].replace(
    fillPattern,
    gradientXml(patch.gradient, patch.width, patch.height),
  );
  return xml.replace(properties[0], replacement);
}

function patchParagraphGradients(
  xml: string,
  gradients: GradientParagraphPatch[],
  source: string,
): string {
  const paragraphPattern = /<a:p\b[^>]*>[\s\S]*?<\/a:p>/g;
  const paragraphs = [...xml.matchAll(paragraphPattern)];
  if (paragraphs.length !== gradients.length)
    throw new Error(
      `The text gradient mapping for ${source} expected ${gradients.length} paragraphs but found ${paragraphs.length}.`,
    );
  let paragraphIndex = 0;
  return xml.replace(paragraphPattern, (paragraph) => {
    const expected = gradients[paragraphIndex++];
    const runPattern = /<a:r\b[^>]*>[\s\S]*?<\/a:r>/g;
    const runs = [...paragraph.matchAll(runPattern)];
    if (runs.length !== expected.length)
      throw new Error(
        `The text gradient mapping for ${source}/paragraph[${paragraphIndex - 1}] expected ${expected.length} runs but found ${runs.length}.`,
      );
    let runIndex = 0;
    return paragraph.replace(runPattern, (run) => {
      const patch = expected[runIndex++];
      return patch
        ? patchRunGradient(
            run,
            patch,
            `${source}/paragraph[${paragraphIndex - 1}]/run[${runIndex - 1}]`,
          )
        : run;
    });
  });
}

function patchNamedText(xml: string, patch: TextGradientPatch): { xml: string; found: boolean } {
  let found = false;
  const patched = xml.replace(/<p:sp\b[^>]*>[\s\S]*?<\/p:sp>/g, (block) => {
    if (!objectNameMatches(block, patch.id)) return block;
    found = true;
    return patchParagraphGradients(block, patch.paragraphs, `text ${patch.id}`);
  });
  return { xml: patched, found };
}

function patchNamedTable(xml: string, patch: TableGradientPatch): { xml: string; found: boolean } {
  let found = false;
  const patched = xml.replace(/<p:graphicFrame\b[^>]*>[\s\S]*?<\/p:graphicFrame>/g, (block) => {
    if (!objectNameMatches(block, patch.id)) return block;
    found = true;
    const rowPattern = /<a:tr\b[^>]*>[\s\S]*?<\/a:tr>/g;
    const rows = [...block.matchAll(rowPattern)];
    if (rows.length !== patch.cells.length)
      throw new Error(
        `The table gradient mapping for ${patch.id} expected ${patch.cells.length} rows but found ${rows.length}.`,
      );
    let rowIndex = 0;
    return block.replace(rowPattern, (row) => {
      const expectedRow = patch.cells[rowIndex];
      const cellPattern = /<a:tc\b[^>]*>[\s\S]*?<\/a:tc>/g;
      const cells = [...row.matchAll(cellPattern)];
      if (cells.length !== expectedRow.length)
        throw new Error(
          `The table gradient mapping for ${patch.id}/row[${rowIndex}] expected ${expectedRow.length} cells but found ${cells.length}.`,
        );
      let cellIndex = 0;
      const patchedRow = row.replace(cellPattern, (cell) => {
        const result = patchParagraphGradients(
          cell,
          expectedRow[cellIndex],
          `table ${patch.id}/row[${rowIndex}]/cell[${cellIndex}]`,
        );
        cellIndex++;
        return result;
      });
      rowIndex++;
      return patchedRow;
    });
  });
  return { xml: patched, found };
}

function patchTextGradients(xml: string, patches: TextGradientPatch[]): string {
  let source = xml;
  for (const patch of patches) {
    const result = patchNamedText(source, patch);
    if (!result.found)
      throw new Error(`The native text object ${patch.id} was not found in its slide.`);
    source = result.xml;
  }
  return source;
}

function patchTableGradients(xml: string, patches: TableGradientPatch[]): string {
  let source = xml;
  for (const patch of patches) {
    const result = patchNamedTable(source, patch);
    if (!result.found)
      throw new Error(`The native table object ${patch.id} was not found in its slide.`);
    source = result.xml;
  }
  return source;
}

function patchNamedPicture(xml: string, id: string, effects: EffectPatch | undefined): string {
  return xml.replace(/<p:pic>[\s\S]*?<\/p:pic>/g, (block) =>
    objectNameMatches(block, id) ? patchPictureProperties(block, effects) : block,
  );
}

function decodeBase64(payload: string): Uint8Array {
  const compact = payload.replace(/\s/g, '');
  if (!compact || compact.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact))
    throw new Error('The SVG asset is not valid base64 data.');
  const padding = compact.endsWith('==') ? 2 : compact.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array((compact.length / 4) * 3 - padding);
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (const character of compact) {
    if (character === '=') break;
    const code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.indexOf(
      character,
    );
    buffer = (buffer << 6) | code;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      if (index < bytes.length) bytes[index++] = (buffer >> bits) & 0xff;
    }
  }
  return bytes;
}

function svgBytes(data: string): Uint8Array {
  const comma = data.indexOf(',');
  if (comma < 0) throw new Error('The SVG asset must be a base64 data URL.');
  const header = data.slice(0, comma).toLowerCase();
  if (!header.startsWith('data:image/svg+xml;') || !header.split(';').includes('base64'))
    throw new Error('The SVG asset must use the image/svg+xml base64 data URL format.');
  return decodeBase64(data.slice(comma + 1));
}

function svgBlipExtension(relId: string): string {
  return `<a:extLst><a:ext uri="${SVG_EXT_URI}"><asvg:svgBlip xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main" r:embed="${relId}"/></a:ext></a:extLst>`;
}

function patchSvgBlip(picture: string, relId: string): { xml: string; found: boolean } {
  const extension = svgBlipExtension(relId);
  const paired = /<a:blip\b([^>]*)>([\s\S]*?)<\/a:blip>/.exec(picture);
  if (paired) {
    if (/<asvg:svgBlip\b/.test(paired[2])) return { xml: picture, found: true };
    return {
      xml: picture.replace(paired[0], `<a:blip${paired[1]}>${paired[2]}${extension}</a:blip>`),
      found: true,
    };
  }
  const selfClosing = /<a:blip\b([^>]*)\s*\/>/.exec(picture);
  if (!selfClosing) return { xml: picture, found: false };
  return {
    xml: picture.replace(selfClosing[0], `<a:blip${selfClosing[1]}>${extension}</a:blip>`),
    found: true,
  };
}

function nextRelationshipId(xml: string): string {
  let next = 0;
  for (const match of xml.matchAll(/\bId="rId(\d+)"/g))
    next = Math.max(next, Number.parseInt(match[1], 10));
  return `rId${next + 1}`;
}

function ensureSvgContentType(xml: string): string {
  if (/<Default\b[^>]*\bExtension="svg"/i.test(xml)) return xml;
  return xml.replace('</Types>', '<Default Extension="svg" ContentType="image/svg+xml"/></Types>');
}

function patchGradients(xml: string, gradients: GradientPatch[]): string {
  let source = xml;
  for (const patch of gradients) {
    const result = patchNamedShape(source, patch.id, patch, undefined);
    if (!result.found) throw new Error(`The native shape ${patch.id} was not found in its slide.`);
    source = result.xml;
  }
  return source;
}

function patchEffects(xml: string, effects: EffectPatch[]): string {
  let source = xml;
  for (const effect of effects) {
    if (!effectsXml(effect)) continue;
    const shape = patchNamedShape(source, effect.id, undefined, effect);
    if (shape.found) {
      source = shape.xml;
      continue;
    }
    const before = source;
    source = patchNamedPicture(source, effect.id, effect);
    if (source === before)
      throw new Error(`The native object ${effect.id} was not found in its slide.`);
  }
  return source;
}

function patchStrokeLine(block: string, stroke: PptxStroke): string {
  if (stroke.cap === undefined && stroke.join === undefined) return block;
  const line = /<a:ln\b([^>]*)(?:\/>|>([\s\S]*?)<\/a:ln>)/.exec(block);
  if (!line) return block;
  const attributes = line[1].replace(/\s+cap="[^"]*"/, '');
  const cap = stroke.cap
    ? ` cap="${stroke.cap === 'round' ? 'rnd' : stroke.cap === 'square' ? 'sq' : 'flat'}"`
    : '';
  const children = (line[2] ?? '').replace(/<a:(?:round|miter|bevel)\b[^>]*\/>/g, '');
  const join = stroke.join
    ? stroke.join === 'round'
      ? '<a:round/>'
      : stroke.join === 'bevel'
        ? '<a:bevel/>'
        : '<a:miter lim="800000"/>'
    : '';
  const replacement = `<a:ln${attributes}${cap}>${children}${join}</a:ln>`;
  return block.replace(line[0], replacement);
}

function patchStrokes(xml: string, strokes: StrokePatch[]): string {
  let source = xml;
  for (const patch of strokes) {
    let found = false;
    source = source.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (block) => {
      if (!objectNameMatches(block, patch.id)) return block;
      found = true;
      return patchStrokeLine(block, patch.stroke);
    });
    if (!found) throw new Error(`The native shape ${patch.id} was not found in its slide.`);
  }
  return source;
}

function patchSvg(
  files: Record<string, Uint8Array>,
  slideIndex: number,
  svg: SvgPatch,
  svgIndex: number,
): void {
  const slidePath = `ppt/slides/slide${slideIndex + 1}.xml`;
  const relsPath = `ppt/slides/_rels/slide${slideIndex + 1}.xml.rels`;
  const slideFile = files[slidePath];
  const relsFile = files[relsPath];
  if (!slideFile || !relsFile)
    throw new Error(`The slide ${slideIndex + 1} package relationships are incomplete.`);
  const filename = `open-slide-${slideIndex + 1}-${svgIndex + 1}.svg`;
  const mediaPath = `ppt/media/${filename}`;
  const rels = strFromU8(relsFile);
  const relId = nextRelationshipId(rels);
  let found = false;
  const slide = strFromU8(slideFile).replace(/<p:pic>[\s\S]*?<\/p:pic>/g, (picture) => {
    if (!objectNameMatches(picture, svg.id)) return picture;
    const patched = patchSvgBlip(picture, relId);
    found = patched.found;
    return patched.xml;
  });
  if (!found) throw new Error(`The native image ${svg.id} was not found in its slide.`);
  files[slidePath] = strToU8(slide);
  files[relsPath] = strToU8(
    rels.replace(
      '</Relationships>',
      `<Relationship Id="${relId}" Type="${SVG_REL_TYPE}" Target="../media/${filename}"/></Relationships>`,
    ),
  );
  files[mediaPath] = svgBytes(svg.data);
}

function uniqueShapeIds(xml: string): string {
  const ids = [...xml.matchAll(/<p:cNvPr\b[^>]*\bid="(\d+)"/g)].map((match) => match[1]);
  if (new Set(ids).size === ids.length) return xml;
  // PptxGenJS tables use a separate ID counter. Do not guess ambiguous connector targets.
  if (/<a:(?:stCxn|endCxn)\b/.test(xml))
    throw new Error('Duplicate shape IDs have ambiguous connector references.');
  let nextId = 1;
  return xml.replace(
    /(<p:cNvPr\b[^>]*\bid=")(\d+)(")/g,
    (_match, before, _id, after) => `${before}${nextId++}${after}`,
  );
}

async function patchPackage(blob: Blob, patches: PagePatch[]): Promise<Blob> {
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  let changed = false;
  patches.forEach((patch, index) => {
    const path = `ppt/slides/slide${index + 1}.xml`;
    const file = files[path];
    if (!file) throw new Error(`The writer omitted slide ${index + 1}.`);
    const source = strFromU8(file);
    let patched = normalizeParagraphProperties(source);
    patched = patchSlideImages(patched, patch.crops);
    patched = patchGradients(patched, patch.gradients);
    patched = patchTextGradients(patched, patch.textGradients);
    patched = patchTableGradients(patched, patch.tableGradients);
    patched = patchStrokes(patched, patch.strokes);
    patched = patchEffects(patched, patch.effects);
    patched = patchFonts(patched, patch.fonts);
    if (patched !== source) {
      files[path] = strToU8(patched);
      changed = true;
    }
    patch.svgs.forEach((svg, svgIndex) => {
      patchSvg(files, index, svg, svgIndex);
      changed = true;
    });
    if (patch.groups.length) {
      files[path] = strToU8(patchGroups(strFromU8(files[path]), patch.groups, patch.expanded));
      changed = true;
    }
    const complete = strFromU8(files[path]);
    const unique = uniqueShapeIds(complete);
    if (unique !== complete) {
      files[path] = strToU8(unique);
      changed = true;
    }
  });
  if (patches.some((patch) => patch.svgs.length > 0)) {
    const contentTypesPath = '[Content_Types].xml';
    const contentTypes = files[contentTypesPath];
    if (!contentTypes) throw new Error('The PPTX package has no content types part.');
    const source = strFromU8(contentTypes);
    const patched = ensureSvgContentType(source);
    if (patched !== source) {
      files[contentTypesPath] = strToU8(patched);
      changed = true;
    }
  }
  if (!changed) return blob;
  const packed = zipSync(files, { level: 6 });
  return new Blob([packed], { type: MIME });
}

export async function writePptxWithReport(deck: PptxDeck): Promise<PptxWriteResult> {
  const diagnostics = validateDeck(deck);
  const errors = diagnostics.filter((entry) => entry.severity === 'error');
  if (errors.length > 0)
    throw new EditablePptxError('The deck cannot be written as editable PowerPoint.', diagnostics);

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = deck.title;
  pptx.subject = deck.id;
  pptx.author = 'OpenSlide';
  pptx.company = 'OpenSlide';
  const patches: PagePatch[] = [];
  const usedNames = new Set<string>([
    deck.id,
    ...deck.pages.flatMap((page) => [
      page.id,
      ...page.objects.map((object) => object.id),
      ...(page.groups ?? []).map((group) => group.id),
    ]),
  ]);
  deck.pages.forEach((page, index) => {
    const patch: PagePatch = {
      crops: [],
      fonts: [],
      groups: planGroups(page).groups,
      expanded: new Map(),
      gradients: [],
      textGradients: [],
      tableGradients: [],
      effects: [],
      strokes: [],
      svgs: [],
    };
    writePage(pptx, page, patch, usedNames);
    patches[index] = patch;
  });
  const output = await pptx.write({ outputType: 'blob', compression: true });
  const blob = await patchPackage(await asBlob(output), patches);
  return {
    blob,
    pages: patches.map((patch, index) => {
      const nativeLeafObjects = [...patch.expanded.values()].reduce(
        (sum, ids) => sum + ids.length,
        0,
      );
      return {
        index: deck.pages[index].index,
        nativeLeafObjects,
        writerExtraObjects: nativeLeafObjects - deck.pages[index].objects.length,
        groupContainers: patch.groups.length,
      };
    }),
    diagnostics,
  };
}

export async function writePptx(deck: PptxDeck): Promise<Blob> {
  return (await writePptxWithReport(deck)).blob;
}

export const PPTX_CANVAS = {
  width: SLIDE_WIDTH,
  height: SLIDE_HEIGHT,
  pxPerInch: PX_PER_INCH,
  ptPerPx: PT_PER_PX,
} as const;
