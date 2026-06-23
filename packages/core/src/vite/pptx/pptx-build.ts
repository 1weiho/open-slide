import pptxgen from 'pptxgenjs';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type {
  IRImage,
  IRItem,
  IRPage,
  IRRichText,
  IRShape,
  IRDecorBox,
  IRCurvePath,
  Run,
} from './types.ts';
import type { CustGeomSpec } from './custgeom.ts';

const FONT_MAP = {
  mono: 'JetBrains Mono',
  body: 'Segoe UI',
  display: 'JetBrains Mono',
};
const DEFAULT_BODY = 'Segoe UI';

const CANVAS_W_PX = 1920;
const CANVAS_H_PX = 1080;
const SLIDE_W_IN = 13.333;
const SLIDE_H_IN = 7.5;
const PX_PER_INCH_X = CANVAS_W_PX / SLIDE_W_IN; // 144
const PX_PER_INCH_Y = CANVAS_H_PX / SLIDE_H_IN; // 144

const px = (p: number) => p / PX_PER_INCH_X;
const py = (p: number) => p / PX_PER_INCH_Y;

// Canvas 1920x1080 px maps to 13.333x7.5 inch (144 canvas-px/inch).
// Font sizes use the same scale: 1 canvas-px = 72/144 = 0.5 pt.
const fpt = (p: number) => +(p * 0.5).toFixed(2);

const hex = (c?: string) => {
  if (!c) return '000000';
  const s = c.replace('#', '').trim();
  if (/^[0-9a-fA-F]{6}$/.test(s)) return s.toUpperCase();
  if (/^[0-9a-fA-F]{8}$/.test(s)) return s.slice(0, 6).toUpperCase();
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    return (s[0] + s[0] + s[1] + s[1] + s[2] + s[2]).toUpperCase();
  }
  return '1A1F2E';
};

const MONO = 'JetBrains Mono';

// ─── ImageFallback Emitter ────────────────────────────────────────────────────

function emitFallbackImage(
  slide: pptxgen.Slide,
  leaf: { rect: { x: number; y: number; w: number; h: number }; fallbackImageDataUrl?: string },
): boolean {
  if (!leaf.fallbackImageDataUrl) return false;
  slide.addImage({
    data: leaf.fallbackImageDataUrl,
    x: px(leaf.rect.x),
    y: py(leaf.rect.y),
    w: px(leaf.rect.w),
    h: py(leaf.rect.h),
  } as any);
  return true;
}

// ─── Generic Mappers ──────────────────────────────────────────────────────────

function nameFor(group: string[] | null, localId: string): string {
  return group && group.length > 0 ? `${group.join('/')}/${localId}` : localId;
}

function renderRichText(slide: pptxgen.Slide, it: IRRichText, groupChain: string[] | null) {
  const x = px(it.rect.x),
    y = py(it.rect.y);
  const w = Math.max(px(it.rect.w), 0.05);
  const h = Math.max(py(it.rect.h), 0.05);
  const fam = it.fontFamily ? FONT_MAP[it.fontFamily] : DEFAULT_BODY;
  const fs = Math.max(fpt(it.fontSize), 6);
  // Convert bare-newline runs into a `breakLine: true` flag on the
  // preceding content run. The DOM extractor emits a literal `\n` text run
  // whenever it encounters <br/> inside a leaf-of-block, intending it as a
  // paragraph break. pptxgenjs's CRLF split fires only when a run contains
  // a newline in the MIDDLE of its text — `text.includes(CRLF) &&
  // !text.match(/\n$/)` — so a sole-`\n` run skips the split and the
  // newline survives into the slide XML as `<a:t>\n</a:t>` inside the
  // current `<a:p>`. PowerPoint then ignores it and lays out every run on
  // one continuous line. Setting `breakLine: true` on the preceding run
  // makes pptxgenjs close the current `<a:p>` and start a new one for the
  // subsequent run, matching what the DOM intended.
  const flatRuns: Array<{ run: Run; breakAfter: boolean }> = [];
  for (const r of it.runs) {
    const isBareNewline = r.text === '\n' || r.text === '\r\n';
    if (isBareNewline) {
      const last = flatRuns[flatRuns.length - 1];
      // Edge case: a leading bare newline has no preceding run to attach
      // `breakAfter` to. The DOM extractor does not emit leading newlines
      // in practice (every block opens with content before any <br/>), but
      // silently dropping it here matches PowerPoint's own behaviour for
      // an empty leading paragraph — a leading break is visually inert.
      if (last) last.breakAfter = true;
      // Drop the standalone newline run; the break is captured by the
      // preceding entry's `breakAfter` flag (or dropped entirely when
      // there is no preceding run).
      continue;
    }
    flatRuns.push({ run: r, breakAfter: false });
  }
  const runs = flatRuns.map(({ run: r, breakAfter }) => ({
    text: r.text,
    options: {
      color: r.color ? hex(r.color) : undefined,
      bold: r.bold || undefined,
      italic: r.italic || undefined,
      fontFace: r.mono ? MONO : undefined,
      breakLine: breakAfter || undefined,
    },
  }));
  slide.addText(
    runs as any,
    {
      x,
      y,
      w,
      h,
      fontFace: fam,
      fontSize: fs,
      align: (it.align as any) || 'left',
      valign: (it.valign as any) || 'top',
      // Auto-shrink when CJK / display-font fallback in PowerPoint renders
      // wider than chromium measured. Without this, large headings overflow
      // and wrap onto an extra line because the captured rect is too tight.
      // `fit: 'shrink'` emits <a:normAutofit/> — PowerPoint shrinks font on
      // overflow at view time. `autoFit: true` (<a:spAutoFit/>) only resizes
      // the shape, which doesn't fix width-constrained wrap.
      fit: 'shrink',
      objectName: nameFor(groupChain, it.id),
    } as any,
  );
}

function renderShape(slide: pptxgen.Slide, it: IRShape, groupChain: string[] | null) {
  const x = px(it.rect.x),
    y = py(it.rect.y);
  // For closed shapes a zero side collapses the geometry, so clamp to a
  // hairline. For a line, h=0 (horizontal) and w=0 (vertical) are valid
  // — clamping them tilts the line by ~1.4px which is highly visible.
  const isLine = it.shape === 'line';
  const w = isLine ? px(it.rect.w) : Math.max(px(it.rect.w), 0.01);
  const h = isLine ? py(it.rect.h) : Math.max(py(it.rect.h), 0.01);
  const common = {
    x,
    y,
    w,
    h,
    fill: it.fill ? { color: hex(it.fill) } : { type: 'none' as const },
    line: it.stroke
      ? {
          color: hex(it.stroke),
          width: it.strokeWidth ?? 1,
          dashType: it.dashed ? 'dash' : 'solid',
        }
      : { type: 'none' as const },
    objectName: nameFor(groupChain, it.id),
  } as any;
  if (isLine) {
    slide.addShape('line', {
      ...common,
      line: {
        ...common.line,
        endArrowType: it.endArrow ? 'triangle' : undefined,
      },
      flipH: it.flipH,
      flipV: it.flipV,
    });
  } else if (it.shape === 'roundRect') {
    // pptxgenjs treats `rectRadius` as inches of corner radius (despite docs
    // calling it a fraction). Convert canvas-px → inches and cap at half the
    // shorter side so the corner stays a quarter-circle, never overflowing
    // into a pill on small boxes.
    const radiusPx = Math.min(it.rectRadius ?? 4, Math.min(it.rect.w, it.rect.h) / 2);
    slide.addShape('roundRect', { ...common, rectRadius: px(radiusPx) });
  } else if (it.shape === 'ellipse') {
    slide.addShape('ellipse', common);
  } else {
    slide.addShape('rect', common);
  }
}

function renderCurvePath(
  slide: pptxgen.Slide,
  it: IRCurvePath,
  groupChain: string[] | null,
  customGeoms: CustGeomSpec[],
) {
  const x = px(it.rect.x),
    y = py(it.rect.y);
  // Clamp to a hairline if bbox collapses; postprocess uses the IR rect for
  // its world-space coords, but pptxgenjs needs >0 width/height to even emit.
  const w = Math.max(px(it.rect.w), 0.01);
  const h = Math.max(py(it.rect.h), 0.01);
  const name = `__cust__${customGeoms.length}__${nameFor(groupChain, it.id)}`;
  slide.addShape('rect', {
    x,
    y,
    w,
    h,
    fill: { type: 'none' as const },
    line: { type: 'none' as const },
    objectName: name,
  } as any);
  customGeoms.push({
    points: it.points,
    rect: it.rect,
    closed: it.closed,
    fill: it.fill,
    stroke: it.stroke,
    strokeWidth: it.strokeWidth,
    dashed: it.dashed,
    endArrow: it.endArrow,
  });
}

function renderDecor(slide: pptxgen.Slide, it: IRDecorBox, groupChain: string[] | null) {
  const x = px(it.rect.x),
    y = py(it.rect.y);
  const w = Math.max(px(it.rect.w), 0.05);
  const h = Math.max(py(it.rect.h), 0.05);
  const maxR = Math.max(...it.borderRadii);
  const useRound = maxR > 0;
  // See renderShape — `rectRadius` is in inches, not a fraction.
  const radiusPx = Math.min(maxR, Math.min(it.rect.w, it.rect.h) / 2);
  slide.addShape(useRound ? 'roundRect' : 'rect', {
    x,
    y,
    w,
    h,
    rectRadius: useRound ? px(radiusPx) : 0,
    fill: it.background ? { color: hex(it.background) } : { color: 'FFFFFF', transparency: 100 },
    line: it.borderColor
      ? { color: hex(it.borderColor), width: it.borderWidth || 1 }
      : { type: 'none' },
    shadow: it.boxShadow
      ? {
          type: 'outer',
          offset: it.boxShadow.offsetX,
          blur: it.boxShadow.blur,
          color: hex(it.boxShadow.color),
          opacity: 0.4,
        }
      : undefined,
    objectName: nameFor(groupChain, it.id),
  } as any);
}

function renderImage(
  slide: pptxgen.Slide,
  it: IRImage,
  groupChain: string[] | null,
  assetRoot: string,
) {
  const x = px(it.rect.x),
    y = py(it.rect.y);
  const w = Math.max(px(it.rect.w), 0.05);
  const h = Math.max(py(it.rect.h), 0.05);
  const baseName = nameFor(groupChain, it.id);
  // Plan K K-2: encode srcPrimId on synthetic primitive-screenshot images so
  // the post-release pixel-diff gate can identify and re-render the source
  // primitive purely by reading the emitted pptx. Plain images keep their
  // unprefixed name.
  const objectName = it.srcPrimId ? `primimg:${it.srcPrimId}:${baseName}` : baseName;
  if (it.src.startsWith('data:')) {
    slide.addImage({
      data: it.src,
      x,
      y,
      w,
      h,
      sizing: { type: 'contain', w, h },
      objectName,
    } as any);
    return;
  }
  let resolved: string;
  if (it.src.startsWith('file://')) {
    resolved = fileURLToPath(it.src);
  } else if (path.isAbsolute(it.src)) {
    resolved = it.src;
  } else {
    resolved = path.resolve(assetRoot, it.src);
  }
  if (!existsSync(resolved)) {
    slide.addText(`[missing image: ${it.src.slice(0, 80)}]`, {
      x,
      y,
      w,
      h,
      fontFace: MONO,
      fontSize: 10,
      color: 'AA0000',
      objectName,
    } as any);
    return;
  }
  slide.addImage({
    path: resolved,
    x,
    y,
    w,
    h,
    sizing: { type: 'contain', w, h },
    objectName,
  } as any);
}

function renderItem(
  slide: pptxgen.Slide,
  it: IRItem,
  groupChain: string[],
  assetRoot: string,
  customGeoms: CustGeomSpec[],
) {
  if ((it as any).classification?.kind === 'ImageFallback' && emitFallbackImage(slide, it as any)) {
    return;
  }
  switch (it.kind) {
    case 'Group': {
      const chain = [...groupChain, it.id];
      for (const child of it.children) renderItem(slide, child, chain, assetRoot, customGeoms);
      return;
    }
    case 'Shape':
      renderShape(slide, it, groupChain);
      return;
    case 'CurvePath':
      renderCurvePath(slide, it, groupChain, customGeoms);
      return;
    case 'RichText':
      renderRichText(slide, it, groupChain);
      return;
    case 'Decor':
      renderDecor(slide, it, groupChain);
      return;
    case 'Image':
      renderImage(slide, it, groupChain, assetRoot);
      return;
  }
}

export async function buildPptx(
  pages: IRPage[],
  outPath: string,
  assetRoot = process.cwd(),
  design?: any,
): Promise<{ customGeomsPerSlide: CustGeomSpec[][] }> {
  const pres = new pptxgen();
  pres.defineLayout({ name: 'CANVAS', width: SLIDE_W_IN, height: SLIDE_H_IN });
  pres.layout = 'CANVAS';
  // Slide background: honor design.palette.bg so dark-theme decks render
  // correctly. Falls back to a neutral cream so legacy decks without an
  // explicit bg keep their prior appearance.
  const bgHex = (() => {
    const raw = design?.palette?.bg;
    if (typeof raw !== 'string') return 'F7F5F0';
    return hex(raw) || 'F7F5F0';
  })();
  const customGeomsPerSlide: CustGeomSpec[][] = [];
  for (const page of pages) {
    const slide = pres.addSlide();
    // Per-page bg override (captured from a full-bleed wrapper div whose
    // colour differs from the deck-level palette.bg) takes precedence.
    const pageBg = page.bgOverride ? hex(page.bgOverride) || bgHex : bgHex;
    slide.background = { color: pageBg };
    const customGeoms: CustGeomSpec[] = [];
    for (const it of page.items) renderItem(slide, it, [], assetRoot, customGeoms);
    customGeomsPerSlide.push(customGeoms);
  }
  await pres.writeFile({ fileName: outPath });
  return { customGeomsPerSlide };
}
