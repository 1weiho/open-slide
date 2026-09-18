import { normalizeImageAsset } from './assets';
import { borderPaths } from './border-path';
import { checkAbort } from './capture';
import { backgroundShapes, type Decoration, roundPath, splitCss } from './effects';
import { ellipsisLimit, type TextLimit } from './ellipsis';
import { createGlyphProbe } from './font-probe';
import { createFontResolver, type FontResolver } from './fonts';
import { clipShape } from './geometry';
import { extractGroups } from './groups';
import type {
  PptxCell,
  PptxDiagnostic,
  PptxLink,
  PptxObject,
  PptxPage,
  PptxParagraph,
  PptxRun,
} from './model';
import { comparePaintKeys, paintKeys } from './paint';
import { materializePseudoElements } from './pseudo';
import { radialFillShapes } from './radial';
import { shadowShapes } from './shadow';
import {
  borders,
  color,
  correctedLetterSpacing,
  opacity,
  px,
  relativeRect,
  resetFontCache,
  runStyle,
  sourcePath,
  visible,
} from './style';
import { svgShapes } from './svg';
import { textFill } from './text-fill';
import { firstTextBaseline, officeTextTop } from './typography';

const inlineDisplays = new Set(['inline', 'contents']);
const omittedTags = new Set(['style', 'script', 'noscript', 'template', 'link', 'meta']);

function linkOf(element: Element): PptxLink | undefined {
  const anchor = element.closest('a[href]');
  if (!anchor) return;
  const value = anchor.getAttribute('href');
  if (!value) return;
  try {
    return { url: new URL(value, document.baseURI).href };
  } catch {
    // Preserve malformed input so the validator can report its page and source.
    return { url: value };
  }
}

function textValue(node: Text): string {
  if (!node.parentElement) return '';
  const style = getComputedStyle(node.parentElement);
  let text = node.data;
  if (!['pre', 'pre-wrap', 'break-spaces'].includes(style.whiteSpace)) {
    text =
      style.whiteSpace === 'pre-line'
        ? text.replace(/[\t\r ]+/g, ' ')
        : text.replace(/[\t\r\n ]+/g, ' ');
  }
  if (style.textTransform === 'uppercase') text = text.toLocaleUpperCase();
  if (style.textTransform === 'lowercase') text = text.toLocaleLowerCase();
  return text;
}

function runsIn(
  nodes: Node[],
  root: Element,
  preserveLines = false,
  limit?: TextLimit,
  resolve?: FontResolver,
): PptxRun[] {
  const runs: PptxRun[] = [];
  let previousRect: DOMRect | undefined;
  let finished = false;
  const measuredText = (node: Text): string => {
    if (!node.parentElement) return '';
    const style = getComputedStyle(node.parentElement);
    const collapsesSpace = !['pre', 'pre-wrap', 'break-spaces'].includes(style.whiteSpace);
    const range = document.createRange();
    let result = '';
    let offset = 0;
    const data = limit?.node === node ? node.data.slice(0, limit.offset) : node.data;
    for (const character of data) {
      range.setStart(node, offset);
      offset += character.length;
      range.setEnd(node, offset);
      const rect = range.getBoundingClientRect();
      if (!rect.width && collapsesSpace && /[\t\r\n ]/.test(character)) continue;
      if (character === '\n' && !collapsesSpace) {
        result += '\n';
        previousRect = undefined;
        continue;
      }
      if (rect.width && rect.height) {
        if (
          previousRect &&
          rect.top - previousRect.top > Math.min(rect.height, previousRect.height) * 0.5
        )
          result += '\n';
        previousRect = rect;
      }
      result += collapsesSpace && /[\t\r\n ]/.test(character) ? ' ' : character;
    }
    if (style.textTransform === 'uppercase') result = result.toLocaleUpperCase();
    if (style.textTransform === 'lowercase') result = result.toLocaleLowerCase();
    return result;
  };
  const collect = (node: Node) => {
    if (finished) return;
    if (node instanceof Text) {
      if (!node.parentElement) return;
      const text = preserveLines ? measuredText(node) : textValue(node);
      if (limit?.node === node) finished = true;
      if (text) {
        const element = node.parentElement;
        const overrides = { ...textFill(element, root), link: linkOf(element) };
        text.split(/\r\n|\r|\n/).forEach((line, index) => {
          const value = index === 0 ? line : `\n${line}`;
          if (!value) return;
          if (resolve) runs.push(...resolve(element, value, overrides));
          else {
            const style = { ...runStyle(element, root), ...overrides };
            runs.push({
              text: value,
              ...style,
              letterSpacing: correctedLetterSpacing(element, line, style),
            });
          }
        });
      }
    } else if (node instanceof Element && visible(node) && !omittedTags.has(node.localName)) {
      if (node.localName === 'br') {
        runs.push(...(resolve ? resolve(node, '\n') : [{ text: '\n', ...runStyle(node, root) }]));
        previousRect = undefined;
      } else for (const child of node.childNodes) collect(child);
    }
  };
  for (const node of nodes) collect(node);
  return runs;
}

function paragraph(element: Element, runs: PptxRun[]): PptxParagraph {
  const style = getComputedStyle(element);
  const align =
    style.textAlign === 'center' || style.textAlign === 'right' || style.textAlign === 'justify'
      ? style.textAlign
      : style.textAlign === 'end'
        ? 'right'
        : 'left';
  const result: PptxParagraph = {
    runs,
    align,
    lineHeight: px(style.lineHeight) || px(style.fontSize) * 1.2,
    spaceBefore: 0,
    spaceAfter: 0,
  };
  if (element.localName === 'li' && style.listStyleType !== 'none') {
    const list = element.parentElement;
    const siblings = list
      ? Array.from(list.children).filter((child) => child.localName === 'li')
      : [];
    let level = 0;
    for (let parent = list?.parentElement; parent; parent = parent.parentElement) {
      if (parent.localName === 'ul' || parent.localName === 'ol') level++;
    }
    result.list = {
      kind: list?.localName === 'ol' ? 'number' : 'bullet',
      start: Number(
        element.getAttribute('value') ??
          Number(list?.getAttribute('start') ?? 1) + siblings.indexOf(element),
      ),
      level,
      indent: px(style.fontSize),
      hanging: px(style.fontSize) * 0.25,
    };
  }
  return result;
}

function isInline(node: Node): boolean {
  if (node instanceof Text) return true;
  if (!(node instanceof Element)) return false;
  if (node.localName === 'br') return true;
  const style = getComputedStyle(node);
  return (
    inlineDisplays.has(style.display) &&
    style.position !== 'absolute' &&
    style.position !== 'fixed' &&
    !['img', 'svg', 'canvas', 'video', 'table'].includes(node.localName)
  );
}

export async function extractPage(
  root: HTMLDivElement,
  index: number,
  signal: AbortSignal,
  notes?: string,
): Promise<PptxPage> {
  resetFontCache();
  const restorePseudos = materializePseudoElements(root);
  let probe: Awaited<ReturnType<typeof createGlyphProbe>> | undefined;
  const origin = root.getBoundingClientRect();
  const objects: PptxObject[] = [];
  const diagnostics: PptxDiagnostic[] = [];
  const sourceElements = new Map<string, Element>();
  const sourceIds = new Map<Element, string>();
  let resolve: FontResolver;
  const warn = (
    element: Element,
    code: string,
    message: string,
    suggestion: string,
    severity: 'error' | 'warning' = 'error',
  ) => {
    diagnostics.push({
      severity,
      code,
      message,
      suggestion,
      source: sourcePath(element, root),
      page: index + 1,
    });
  };
  const base = (element: Element) => {
    const source = sourcePath(element, root);
    sourceElements.set(source, element);
    if (!sourceIds.has(element)) sourceIds.set(element, `p${index + 1}-s${sourceIds.size + 1}`);
    return {
      ...relativeRect(element.getBoundingClientRect(), origin),
      id: `p${index + 1}-o${objects.length + 1}`,
      source,
      sourceId: sourceIds.get(element),
      order: objects.length,
      link: linkOf(element),
    };
  };
  const emitDecoration = (element: Element, shape: Decoration) => {
    if (shape.gradient?.kind === 'radial')
      warn(
        element,
        'radial-vector-approximation',
        'The radial gradient uses editable vector bands to retain its CSS centre and radius.',
        'Subtle colour steps can vary between PowerPoint renderers.',
        'warning',
      );
    for (const layer of radialFillShapes(shape)) objects.push({ ...base(element), ...layer });
  };
  const decorations = (element: Element) => {
    const style = getComputedStyle(element);
    const box = base(element);
    if (box.w <= 0 || box.h <= 0) return;
    const alpha = opacity(element, root);
    const fill = color(style.backgroundColor, alpha);
    const edges = borders(element, root);
    const radii = [
      style.borderTopLeftRadius,
      style.borderTopRightRadius,
      style.borderBottomRightRadius,
      style.borderBottomLeftRadius,
    ].map((r) => (r.endsWith('%') ? (px(r) * Math.min(box.w, box.h)) / 100 : px(r)));
    const ellipse = [
      style.borderTopLeftRadius,
      style.borderTopRightRadius,
      style.borderBottomRightRadius,
      style.borderBottomLeftRadius,
    ].every((r) => r === '50%');
    const geometry = ellipse
      ? ('ellipse' as const)
      : radii.some(Boolean)
        ? ('path' as const)
        : ('rect' as const);
    const path = geometry === 'path' ? roundPath(box.w, box.h, radii) : undefined;
    const blurMatch = /^blur\(([\d.]+)px\)$/.exec(style.filter);
    const blur = blurMatch ? Number(blurMatch[1]) : undefined;
    const paint = (shape: Decoration) =>
      emitDecoration(element, { ...shape, blur: shape.blur ?? blur });
    const textClip = style.backgroundClip === 'text' || style.webkitBackgroundClip === 'text';
    try {
      const shadows = shadowShapes(style, box, alpha, radii, ellipse);
      if (shadows.before.length > 1)
        warn(
          element,
          'shadow-vector-approximation',
          'The blurred outer shadow uses editable vector bands.',
          'Its soft edge can differ slightly from the browser.',
          'warning',
        );
      for (const shadow of shadows.before) paint(shadow);
      if (!textClip && fill.opacity > 0) paint({ ...box, kind: 'shape', geometry, path, fill });
      for (const background of textClip ? [] : backgroundShapes(style, box, alpha)) {
        const entireBox =
          background.x === box.x &&
          background.y === box.y &&
          background.w === box.w &&
          background.h === box.h;
        paint({
          ...background,
          geometry: entireBox ? geometry : background.geometry,
          path: entireBox ? path : background.path,
        });
      }
      for (const shadow of shadows.after) paint(shadow);
    } catch (error) {
      warn(
        element,
        'unsupported-background-image',
        String(error),
        'Use a supported linear or radial gradient, grid, or original image asset.',
      );
    }
    const uniform = edges.every((edge) => JSON.stringify(edge) === JSON.stringify(edges[0]));
    if (uniform && edges[0].width > 0 && edges[0].opacity > 0)
      paint({ ...box, kind: 'shape', geometry, path, stroke: edges[0] });
    else if (!uniform) {
      const curved = radii.some(Boolean)
        ? borderPaths(
            box.w,
            box.h,
            radii,
            edges.map((edge) => edge.width),
          )
        : undefined;
      const positions = [
        { x: box.x, y: box.y, w: box.w, h: 0 },
        { x: box.x + box.w, y: box.y, w: 0, h: box.h },
        { x: box.x, y: box.y + box.h, w: box.w, h: 0 },
        { x: box.x, y: box.y, w: 0, h: box.h },
      ];
      edges.forEach((stroke, edge) => {
        if (stroke.width > 0 && stroke.opacity > 0)
          paint(
            curved
              ? { ...box, kind: 'shape', geometry: 'path', path: curved[edge], stroke }
              : { ...positions[edge], kind: 'shape', geometry: 'line', stroke },
          );
      });
    }
    if (style.filter !== 'none' && !blurMatch && !(element instanceof HTMLImageElement))
      warn(
        element,
        'unsupported-filter',
        `Unsupported CSS filter: ${style.filter}`,
        'Use a blur filter or apply this filter to an original image asset.',
      );
    if (blur && element.children.length)
      warn(
        element,
        'unsupported-filter',
        'A nonzero blur on a content group requires group effects.',
        'Apply the blur to individual decorative shapes.',
      );
    if (
      style.backdropFilter &&
      style.backdropFilter !== 'none' &&
      !/^blur\(0(?:px)?\)$/.test(style.backdropFilter)
    )
      warn(
        element,
        'backdrop-filter-approximation',
        'The translucent panel is preserved; its backdrop blur is not available in native PowerPoint.',
        'Use the exported panel fill when editing this effect.',
        'warning',
      );
    if (style.clipPath && style.clipPath !== 'none')
      warn(
        element,
        'unsupported-clip-path',
        `Unsupported clipping path: ${style.clipPath}`,
        'Use rectangular clipping or native shape geometry.',
      );
    if (style.maskImage && style.maskImage !== 'none' && style.backgroundImage === 'none')
      warn(
        element,
        'unsupported-mask-image',
        'This mask has no supported native background.',
        'Use a radial mask over a repeated grid background.',
      );
    if (style.mixBlendMode !== 'normal')
      warn(
        element,
        'unsupported-blend',
        'A blend mode changes the visible composition.',
        'Use normal blending.',
      );
    if (style.direction === 'rtl')
      warn(
        element,
        'unsupported-rtl',
        'Right-to-left paragraph layout needs a native adapter.',
        'Use a supported paragraph direction.',
      );
    if (style.writingMode !== 'horizontal-tb')
      warn(
        element,
        'unsupported-writing-mode',
        'Vertical writing is not supported.',
        'Use horizontal text.',
      );
    if (style.transform !== 'none') {
      const matrix = new DOMMatrix(style.transform);
      if (
        !matrix.is2D ||
        Math.abs(matrix.b) > 0.0001 ||
        Math.abs(matrix.c) > 0.0001 ||
        matrix.a <= 0 ||
        matrix.d <= 0
      )
        warn(
          element,
          'unsupported-transform',
          'A rotated or skewed element needs a native transform adapter.',
          'Use axis-aligned text and shapes.',
        );
    }
    for (const pseudo of ['::before', '::after']) {
      const generated = getComputedStyle(element, pseudo);
      if (!['none', 'normal'].includes(generated.content) && generated.display !== 'none')
        warn(
          element,
          'unsupported-pseudo',
          `Unsupported generated content: ${generated.content}`,
          'Use textual or decorative generated content.',
        );
    }
  };

  const addText = (element: Element, nodes: Node[]) => {
    const limit = ellipsisLimit(element, nodes);
    const runs = runsIn(nodes, root, true, limit, resolve);
    if (limit) {
      runs.push(...resolve(element, '…'));
      diagnostics.push({
        severity: 'warning',
        code: 'text-ellipsis',
        page: index + 1,
        source: sourcePath(element, root),
        message: 'Text is shortened with an ellipsis to match the slide.',
        suggestion: 'The full source text is retained in this report.',
        originalText: runsIn(nodes, root, true)
          .map((run) => run.text)
          .join(''),
      });
    }
    if (!runs.some((run) => /[^\t\r\n ]/.test(run.text))) return;
    const range = document.createRange();
    range.setStartBefore(nodes[0]);
    range.setEndAfter(nodes[nodes.length - 1]);
    const measured = relativeRect(range.getBoundingClientRect(), origin);
    const style = getComputedStyle(element);
    const box = base(element);
    const contentLeft = box.x + px(style.borderLeftWidth) + px(style.paddingLeft);
    const contentRight = box.x + box.w - px(style.borderRightWidth) - px(style.paddingRight);
    // Separate inline fragments around inline-block children keep their measured horizontal positions.
    const positioned =
      ['flex', 'inline-flex', 'grid', 'inline-grid'].includes(style.display) ||
      nodes.length !== element.childNodes.length;
    const x = positioned ? measured.x : contentLeft;
    const w = positioned ? measured.w : contentRight - contentLeft;
    const lineHeight = px(style.lineHeight) || Math.max(...runs.map((run) => run.fontSize)) * 1.2;
    const h = Math.max(measured.h, lineHeight);
    const baseline = firstTextBaseline(nodes, origin);
    const y = baseline === undefined ? measured.y : officeTextTop(baseline, lineHeight);
    if (w <= 0 || h <= 0) {
      warn(
        element,
        'text-unmeasurable',
        'Visible text has no measurable layout box.',
        'Give the text a nonzero size.',
      );
      return;
    }
    const p = paragraph(element, runs);
    if (positioned) p.align = 'left';
    objects.push({ ...box, x, y, w, h, kind: 'text', wrap: false, paragraphs: [p] });
  };

  const addList = (element: Element) => {
    const items = Array.from(element.querySelectorAll('li')).filter(visible);
    if (!items.length) return;
    const paragraphs: PptxParagraph[] = [];
    for (const item of items) {
      const style = getComputedStyle(item);
      if (
        !['disc', 'decimal', 'none'].includes(style.listStyleType) ||
        style.listStyleImage !== 'none' ||
        item.closest('ol[reversed]')
      ) {
        warn(
          item,
          'unsupported-list-style',
          'This list uses a custom marker or numbering style.',
          'Use round bullets or ascending decimal numbers.',
        );
        continue;
      }
      decorations(item);
      const nodes = Array.from(item.childNodes).filter(
        (node) => !(node instanceof Element && ['ul', 'ol'].includes(node.localName)),
      );
      if (nodes.some((node) => !isInline(node) && node instanceof Element)) {
        warn(
          item,
          'unsupported-list-layout',
          'A list item contains a block layout requiring a native adapter.',
          'Use inline text and formatting within list items.',
        );
        continue;
      }
      const runs = runsIn(nodes, root, true, undefined, resolve);
      const value = paragraph(item, runs);
      const fontSize = runs[0]?.fontSize ?? px(style.fontSize);
      if (value.list) {
        value.list.indent =
          fontSize + item.getBoundingClientRect().left - items[0].getBoundingClientRect().left;
        if (value.list.level > 8)
          warn(
            item,
            'unsupported-list-depth',
            'This list exceeds PowerPoint nesting depth.',
            'Use at most nine levels.',
          );
      }
      value.spaceAfter = px(style.marginBottom);
      paragraphs.push(value);
    }
    const first = relativeRect(items[0].getBoundingClientRect(), origin);
    const last = relativeRect(items[items.length - 1].getBoundingClientRect(), origin);
    const indent = paragraphs[0]?.runs[0]?.fontSize ?? 0;
    objects.push({
      ...base(element),
      x: first.x - indent,
      y: first.y,
      w: first.w + indent,
      h: Math.max(last.y + last.h - first.y, first.h),
      kind: 'text',
      paragraphs,
    });
  };

  const addTable = (element: Element): Element[] | undefined => {
    const marked = element.getAttribute('data-osd-pptx') === 'table';
    const rows = Array.from(
      element.querySelectorAll(marked ? '[data-osd-pptx="row"]' : 'tr'),
    ).filter(
      (row) =>
        row.closest(marked ? '[data-osd-pptx="table"]' : 'table') === element && visible(row),
    );
    const cells = rows.map((row) =>
      Array.from(row.children).filter((cell) =>
        marked
          ? cell.getAttribute('data-osd-pptx') === 'cell'
          : ['td', 'th'].includes(cell.localName),
      ),
    );
    if (!cells.length || !cells[0].length || cells.some((row) => row.length !== cells[0].length)) {
      warn(
        element,
        'table-nonrectangular',
        'The table is empty or has inconsistent column counts.',
        'Use a rectangular table without merged cells.',
      );
      return;
    }
    if (
      cells
        .flat()
        .some(
          (cell) =>
            Number(cell.getAttribute('colspan') ?? 1) !== 1 ||
            Number(cell.getAttribute('rowspan') ?? 1) !== 1,
        )
    ) {
      warn(
        element,
        'table-merged-cells',
        'Merged cells are not supported.',
        'Use individual rectangular cells.',
      );
      return;
    }
    if (
      marked &&
      (rows.some((row, r) => row.getAttribute('data-osd-pptx-row') !== String(r)) ||
        cells.some((row, r) =>
          row.some(
            (cell, c) =>
              cell.getAttribute('data-osd-pptx-row') !== String(r) ||
              cell.getAttribute('data-osd-pptx-col') !== String(c),
          ),
        ))
    ) {
      warn(
        element,
        'table-marker-index',
        'Marked table cells must have contiguous zero-based row and column indices.',
        'Set data-osd-pptx-row and data-osd-pptx-col on every cell.',
      );
      return;
    }
    const overlays: Element[] = [];
    const tableRows: PptxCell[][] = cells.map((row) =>
      row.map((cell) => {
        const style = getComputedStyle(cell);
        if (cell.querySelector('img,svg,canvas,table'))
          warn(
            cell,
            'table-cell-content',
            'This cell contains content that the text table adapter cannot preserve.',
            'Use text-only cells.',
          );
        const decorated = Array.from(cell.querySelectorAll('*')).some((child) => {
          const css = getComputedStyle(child);
          return (
            color(css.backgroundColor).opacity > 0 ||
            css.backgroundImage !== 'none' ||
            css.boxShadow !== 'none' ||
            (['flex', 'grid', 'inline-flex', 'inline-grid'].includes(css.display) &&
              child.children.length > 1)
          );
        });
        if (decorated) overlays.push(cell);
        let background = color(style.backgroundColor);
        for (
          let parent = cell.parentElement;
          parent && parent !== element.parentElement && background.opacity < 1;
          parent = parent.parentElement
        ) {
          const under = color(getComputedStyle(parent).backgroundColor);
          const alpha = background.opacity + under.opacity * (1 - background.opacity);
          if (!alpha) continue;
          const channels = [0, 2, 4].map((start) =>
            Math.round(
              (Number.parseInt(background.color.slice(start, start + 2), 16) * background.opacity +
                Number.parseInt(under.color.slice(start, start + 2), 16) *
                  under.opacity *
                  (1 - background.opacity)) /
                alpha,
            )
              .toString(16)
              .padStart(2, '0'),
          );
          background = { color: channels.join('').toUpperCase(), opacity: alpha };
        }
        return {
          paragraphs: [
            paragraph(
              cell,
              decorated ? [] : runsIn(Array.from(cell.childNodes), root, true, undefined, resolve),
            ),
          ],
          fill: { ...background, opacity: background.opacity * opacity(cell, root) },
          borders: borders(cell, root),
          padding: [
            px(style.paddingTop),
            px(style.paddingRight),
            px(style.paddingBottom),
            px(style.paddingLeft),
          ],
          valign:
            style.verticalAlign === 'bottom'
              ? 'bottom'
              : style.verticalAlign === 'middle'
                ? 'middle'
                : 'top',
        };
      }),
    );
    const columnWidths = cells[0].map((cell) => cell.getBoundingClientRect().width);
    const rowHeights = rows.map((row) => row.getBoundingClientRect().height);
    const firstCell = relativeRect(cells[0][0].getBoundingClientRect(), origin);
    objects.push({
      ...base(element),
      x: firstCell.x,
      y: firstCell.y,
      w: columnWidths.reduce((sum, width) => sum + width, 0),
      h: rowHeights.reduce((sum, height) => sum + height, 0),
      kind: 'table',
      rows: tableRows,
      columnWidths,
      rowHeights,
    });
    if (overlays.length)
      warn(
        element,
        'table-cell-layout',
        'Decorated table cells retain their layout as separate editable text and shapes over the native table.',
        'Edit these decorated labels as text objects; other cells remain native table cells.',
        'warning',
      );
    return overlays;
  };

  const addImage = async (element: HTMLImageElement) => {
    const style = getComputedStyle(element);
    const box = base(element);
    let asset: Awaited<ReturnType<typeof normalizeImageAsset>>;
    try {
      asset = await normalizeImageAsset(element.currentSrc || element.src, signal, {
        width: box.w,
        height: box.h,
        filter: style.filter,
      });
    } catch (error) {
      checkAbort(signal);
      warn(
        element,
        'image-asset-failed',
        String(error),
        'Use an accessible supported original image asset and retry.',
      );
      return;
    }
    const nw = asset.naturalWidth,
      nh = asset.naturalHeight;
    const fit = style.objectFit;
    let scaleX = box.w / nw,
      scaleY = box.h / nh;
    if (fit !== 'fill') {
      const contain = Math.min(scaleX, scaleY);
      scaleX = scaleY =
        fit === 'cover'
          ? Math.max(scaleX, scaleY)
          : fit === 'none'
            ? 1
            : fit === 'scale-down'
              ? Math.min(1, contain)
              : contain;
    }
    const w = nw * scaleX,
      h = nh * scaleY;
    const pos = splitCss(style.objectPosition, ' ');
    const offset = (value: string | undefined, free: number) =>
      value?.endsWith('%') ? (px(value) / 100) * free : px(value ?? '0');
    const x = offset(pos[0], box.w - w),
      y = offset(pos[1], box.h - h);
    const left = Math.max(0, -x),
      top = Math.max(0, -y);
    const right = Math.max(0, x + w - box.w),
      bottom = Math.max(0, y + h - box.h);
    objects.push({
      ...box,
      ...asset,
      opacity: opacity(element, root),
      kind: 'image',
      x: box.x + Math.max(0, x),
      y: box.y + Math.max(0, y),
      w: w - left - right,
      h: h - top - bottom,
      crop: { left: left / w, top: top / h, right: right / w, bottom: bottom / h },
    });
  };

  const visit = async (element: Element, contentOnly = false): Promise<void> => {
    checkAbort(signal);
    if (omittedTags.has(element.localName) || !visible(element)) return;
    if (element instanceof SVGSVGElement) {
      try {
        for (const shape of svgShapes(element, root, origin)) emitDecoration(element, shape);
      } catch (error) {
        warn(
          element,
          'unsupported-svg',
          String(error),
          'Use supported SVG paths, lines, circles, ellipses, polygons and rectangles.',
        );
      }
      return;
    }
    const marker = element.getAttribute('data-osd-pptx');
    const semanticId = element.getAttribute('data-osd-pptx-id');
    if (marker && !['table', 'row', 'cell', 'node', 'arrow', 'line'].includes(marker)) {
      warn(
        element,
        'unknown-marker',
        `Unknown export marker: ${marker}.`,
        'Use a supported version 1 marker.',
      );
    }
    if (marker === 'node' && !semanticId)
      warn(element, 'missing-node-id', 'A node marker requires an ID.', 'Set data-osd-pptx-id.');
    if (element.getAttribute('data-osd-pptx-connection') === 'attached')
      warn(
        element,
        'attached-connection',
        'Attached connectors are not supported by this exporter version.',
        'Use geometry connectors.',
      );
    if (element.localName === 'table' || marker === 'table') {
      decorations(element);
      for (const cell of addTable(element) ?? []) await visit(cell, true);
      return;
    }
    if (!contentOnly) decorations(element);
    if (['ul', 'ol'].includes(element.localName)) {
      addList(element);
      return;
    }
    if (element instanceof HTMLImageElement) {
      await addImage(element);
      return;
    }
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      if (element instanceof HTMLInputElement && element.type === 'range') {
        const box = base(element);
        const style = getComputedStyle(element);
        const alpha = opacity(element, root);
        const accent = color(style.accentColor === 'auto' ? '#0067c0' : style.accentColor, alpha);
        const minimum = Number(element.min || 0),
          maximum = Number(element.max || 100);
        const value = Math.max(
          0,
          Math.min(1, (Number(element.value) - minimum) / Math.max(1, maximum - minimum)),
        );
        const knob = Math.min(12, box.h),
          track = Math.min(4, box.h);
        const x = box.x + knob / 2,
          y = box.y + (box.h - track) / 2,
          w = box.w - knob;
        emitDecoration(element, {
          x,
          y,
          w,
          h: track,
          kind: 'shape',
          geometry: 'roundRect',
          radius: track / 2,
          fill: color('#e5e5e5', alpha),
          stroke: { ...color('#bcbcbc', alpha), width: 0.5 },
        });
        if (value > 0)
          emitDecoration(element, {
            x,
            y,
            w: w * value,
            h: track,
            kind: 'shape',
            geometry: 'roundRect',
            radius: track / 2,
            fill: accent,
          });
        emitDecoration(element, {
          x: x + w * value - knob / 2,
          y: box.y + (box.h - knob) / 2,
          w: knob,
          h: knob,
          kind: 'shape',
          geometry: 'ellipse',
          fill: accent,
        });
        warn(
          element,
          'native-range-control',
          'The slider is exported as an editable track and thumb at its current value.',
          'Edit the native shapes to change its static appearance.',
          'warning',
        );
        return;
      }
      if (
        element instanceof HTMLInputElement &&
        ['checkbox', 'radio', 'color', 'file'].includes(element.type)
      ) {
        warn(
          element,
          'unsupported-control',
          `The ${element.type} input needs a native control adapter.`,
          'Use text, shapes or a range control for static presentation content.',
        );
        return;
      }
      const text =
        element instanceof HTMLInputElement && element.type === 'password'
          ? '•'.repeat(element.value.length)
          : element.value || element.getAttribute('placeholder') || '';
      if (text) {
        const style = getComputedStyle(element);
        const box = base(element);
        objects.push({
          ...box,
          x: box.x + px(style.paddingLeft) + px(style.borderLeftWidth),
          y: box.y + px(style.paddingTop) + px(style.borderTopWidth),
          w: box.w - px(style.paddingLeft) - px(style.paddingRight),
          kind: 'text',
          wrap: false,
          paragraphs: [paragraph(element, resolve(element, text))],
        });
      }
      return;
    }
    if (['svg', 'canvas', 'video', 'iframe', 'select'].includes(element.localName)) {
      warn(
        element,
        'unsupported-element',
        `Visible ${element.localName} requires a native export adapter.`,
        'Use supported text, shapes, tables or original image assets.',
      );
      return;
    }
    if (marker === 'arrow' || marker === 'line') {
      const direction = element.getAttribute('data-osd-pptx-direction') ?? 'right';
      const valid = ['left', 'right', 'up', 'down', 'both-horizontal', 'both-vertical'];
      if (!valid.includes(direction))
        warn(
          element,
          'arrow-direction',
          'The marked arrow has an invalid direction.',
          'Use a supported direction.',
        );
      const value = element.textContent?.trim() ?? '';
      if (value && !/^[←→↑↓↔↕➜➔➝⟶⟵-]+$/.test(value)) {
        warn(
          element,
          'arrow-content',
          'A marked arrow contains descriptive text.',
          'Put the description in a separate element.',
        );
        return;
      }
      const box = base(element);
      const vertical = ['up', 'down', 'both-vertical'].includes(direction);
      const style = getComputedStyle(element);
      objects.push({
        ...box,
        x: vertical ? box.x + box.w / 2 : box.x,
        y: vertical ? box.y : box.y + box.h / 2,
        w: vertical ? 0 : box.w,
        h: vertical ? box.h : 0,
        kind: 'shape',
        geometry: 'line',
        stroke: { ...color(style.color, opacity(element, root)), width: 2 },
        startArrow:
          marker === 'arrow' &&
          ['left', 'up', 'both-horizontal', 'both-vertical'].includes(direction),
        endArrow:
          marker === 'arrow' &&
          ['right', 'down', 'both-horizontal', 'both-vertical'].includes(direction),
      });
      return;
    }
    let inline: Node[] = [];
    const flush = () => {
      if (inline.length) addText(element, inline);
      inline = [];
    };
    for (const node of element.childNodes) {
      if (isInline(node)) {
        inline.push(node);
        if (node instanceof Element && visible(node)) {
          for (const descendant of [node, ...node.querySelectorAll('*')])
            if (visible(descendant)) decorations(descendant);
        }
      } else {
        flush();
        if (node instanceof Element) await visit(node);
      }
    }
    flush();
  };
  if (root.dataset.osdPptxVersion !== '1')
    warn(
      root,
      'unsupported-marker-version',
      'The export marker version is unsupported.',
      'Use marker version 1.',
    );
  const semanticIds = new Set<string>();
  for (const element of root.querySelectorAll('[data-osd-pptx-id], [data-osd-pptx]')) {
    if (!visible(element)) continue;
    const id = element.getAttribute('data-osd-pptx-id');
    if (id !== null) {
      if (!id.trim() || semanticIds.has(id))
        warn(
          element,
          'invalid-marker-id',
          'Marker IDs must be nonempty and unique within a page.',
          'Use a unique nonempty ID.',
        );
      semanticIds.add(id);
    }
    const role = element.getAttribute('data-osd-pptx');
    const connection = element.getAttribute('data-osd-pptx-connection');
    if (connection && !['geometry', 'attached'].includes(connection))
      warn(
        element,
        'invalid-connection',
        'The connection mode is invalid.',
        'Use geometry connections.',
      );
    const header = element.getAttribute('data-osd-pptx-header');
    if (header !== null && !['true', 'false'].includes(header))
      warn(
        element,
        'invalid-table-header',
        'A table header marker must be true or false.',
        'Use a boolean header marker.',
      );
    if (role === 'arrow' && !element.hasAttribute('data-osd-pptx-direction'))
      warn(
        element,
        'missing-arrow-direction',
        'A marked arrow requires an explicit direction.',
        'Set data-osd-pptx-direction.',
      );
    if (role === 'table' && element.parentElement?.closest('[data-osd-pptx="table"],table'))
      warn(element, 'nested-table', 'Nested tables are not supported.', 'Use independent tables.');
    if (
      ['row', 'cell'].includes(role ?? '') &&
      !element.parentElement?.closest('[data-osd-pptx="table"]')
    )
      warn(
        element,
        'orphan-table-marker',
        'A table row or cell has no marked parent table.',
        'Put the row and cells inside one marked table.',
      );
  }
  try {
    const controls = [...root.querySelectorAll('input,textarea')]
      .map(
        (element) =>
          (element as HTMLInputElement).value + (element.getAttribute('placeholder') ?? ''),
      )
      .join('');
    const characters = `${root.textContent ?? ''}${controls}…•`;
    probe = await createGlyphProbe(
      characters + characters.toLocaleUpperCase() + characters.toLocaleLowerCase(),
      signal,
    );
    resolve = createFontResolver(probe, root, index, diagnostics);
    for (const child of root.children) await visit(child);
    for (const element of root.querySelectorAll('[data-osd-pptx-from], [data-osd-pptx-to]')) {
      for (const attr of ['data-osd-pptx-from', 'data-osd-pptx-to']) {
        const target = element.getAttribute(attr);
        if (
          target &&
          !root.querySelector(`[data-osd-pptx="node"][data-osd-pptx-id="${CSS.escape(target)}"]`)
        ) {
          warn(
            element,
            'missing-connector-node',
            'A connector refers to a missing page node.',
            'Reference a node ID on the same page.',
          );
        }
      }
    }
    const finalizeObjects = (): PptxObject[] => {
      const result: PptxObject[] = [];
      for (const object of objects) {
        const element = sourceElements.get(object.source);
        const clip = { x: 0, y: 0, w: origin.width, h: origin.height };
        for (
          let parent = element?.parentElement;
          parent && parent !== root;
          parent = parent.parentElement
        ) {
          const style = getComputedStyle(parent);
          const rect = relativeRect(parent.getBoundingClientRect(), origin);
          const clips = (value: string) => ['hidden', 'clip', 'scroll', 'auto'].includes(value);
          const right = clip.x + clip.w,
            bottom = clip.y + clip.h;
          if (clips(style.overflowX)) {
            clip.x = Math.max(clip.x, rect.x);
            clip.w = Math.max(0, Math.min(right, rect.x + rect.w) - clip.x);
          }
          if (clips(style.overflowY)) {
            clip.y = Math.max(clip.y, rect.y);
            clip.h = Math.max(0, Math.min(bottom, rect.y + rect.h) - clip.y);
          }
        }
        if (object.kind === 'shape') result.push(...clipShape(object, clip));
        else if (
          object.x + object.w <= clip.x ||
          object.x >= clip.x + clip.w ||
          object.y + object.h <= clip.y ||
          object.y >= clip.y + clip.h
        )
          continue;
        else if (object.kind === 'image') {
          const x = Math.max(clip.x, object.x),
            y = Math.max(clip.y, object.y);
          const w = Math.min(clip.x + clip.w, object.x + object.w) - x,
            h = Math.min(clip.y + clip.h, object.y + object.h) - y;
          const crop = object.crop ?? { left: 0, right: 0, top: 0, bottom: 0 };
          const cw = 1 - crop.left - crop.right,
            ch = 1 - crop.top - crop.bottom;
          result.push({
            ...object,
            x,
            y,
            w,
            h,
            crop: {
              left: crop.left + ((x - object.x) / object.w) * cw,
              right: crop.right + ((object.x + object.w - x - w) / object.w) * cw,
              top: crop.top + ((y - object.y) / object.h) * ch,
              bottom: crop.bottom + ((object.y + object.h - y - h) / object.h) * ch,
            },
          });
        } else result.push(object);
      }
      const keys = paintKeys(root);
      result.sort(
        (a, b) =>
          comparePaintKeys(
            keys.get(sourceElements.get(a.source) ?? root) ?? [],
            keys.get(sourceElements.get(b.source) ?? root) ?? [],
          ) || a.order - b.order,
      );
      return result.map((object, order) => ({
        ...object,
        order,
        id: `p${index + 1}-o${order + 1}`,
      }));
    };
    const fontFaces = new Set(
      objects.flatMap((object) =>
        object.kind === 'text'
          ? object.paragraphs.flatMap((p) =>
              p.runs.flatMap((run) => [
                run.latinFontFace ?? run.fontFace,
                ...(run.eastAsianFontFace ? [run.eastAsianFontFace] : []),
              ]),
            )
          : object.kind === 'table'
            ? object.rows.flatMap((row) =>
                row.flatMap((cell) =>
                  cell.paragraphs.flatMap((p) =>
                    p.runs.flatMap((run) => [
                      run.latinFontFace ?? run.fontFace,
                      ...(run.eastAsianFontFace ? [run.eastAsianFontFace] : []),
                    ]),
                  ),
                ),
              )
            : [],
      ),
    );
    if (fontFaces.size)
      warn(
        root,
        'fonts-not-embedded',
        `The file uses ${Array.from(fontFaces).join(', ')} without embedding fonts. Office may substitute unavailable fonts and change wrapping.`,
        'Install these fonts when comparing or editing the presentation.',
        'warning',
      );
    if (!objects.length)
      warn(
        root,
        'empty-page',
        'The page contains no exportable objects.',
        'Add visible supported content.',
      );
    const page: PptxPage = {
      index,
      id: `page-${index + 1}`,
      background: color(getComputedStyle(root).backgroundColor),
      objects: finalizeObjects(),
      notes,
      diagnostics,
    };
    page.groups = extractGroups(root, page, sourceElements);
    return page;
  } finally {
    probe?.dispose();
    restorePseudos();
  }
}
