import { parseFontFamilies as parseCssFontFamilies } from './css';
import type { PptxDiagnostic, PptxFontResolution, PptxRun } from './model';
import {
  canvasFont,
  correctedLetterSpacing,
  px,
  runStyle,
  setCanvasFont,
  sourceAdvance,
  sourcePath,
  textLanguage,
  trackingCount,
  withCanvasTextStyle,
} from './style';

export type GlyphProbe = {
  hasGlyph: (
    family: string,
    text: string,
    style: { weight: string; style: string },
  ) => 'supported' | 'missing' | 'unknown';
};
export type FontResolver = (
  element: Element,
  text: string,
  overrides?: Partial<PptxRun>,
) => PptxRun[];

export function parseFontFamilies(value: string): string[] {
  const result: string[] = [];
  let quoted = '',
    current = '';
  for (const character of value) {
    if ((character === '"' || character === "'") && (!quoted || quoted === character))
      quoted = quoted ? '' : character;
    else if (character === ',' && !quoted) {
      if (current.trim()) result.push(current.trim());
      current = '';
    } else current += character;
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

export function authorLanguage(element: Element, root: Element): string | null {
  for (let current: Element | null = element; current; current = current.parentElement) {
    const lang = current.getAttribute('lang');
    if (lang !== null) {
      if (!lang.trim()) return null;
      try {
        return Intl.getCanonicalLocales(lang.trim())[0] ?? null;
      } catch {
        /* Invalid tags do not override a valid ancestor. */
      }
    }
    if (current === root) break;
  }
  return null;
}

function scriptOf(text: string): PptxFontResolution['script'] {
  if (
    /[\p{Script_Extensions=Han}\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}\p{Script_Extensions=Hangul}\p{Script_Extensions=Bopomofo}\u3000-\u303f\uff01-\uff60]/u.test(
      text,
    )
  )
    return 'eastAsian';
  if (/[^\p{Script_Extensions=Latin}\p{Number}\p{Punctuation}\p{Separator}\p{ASCII}]/u.test(text))
    return 'other';
  return 'latin';
}

function eastAsianCandidates(language: string | null): string[] {
  if (/^ja\b/i.test(language ?? ''))
    return ['Hiragino Sans', 'Yu Gothic', 'Noto Sans JP', 'Arial Unicode MS'];
  if (/^ko\b/i.test(language ?? ''))
    return ['Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'Arial Unicode MS'];
  if (/^zh-(?:Hant|TW|HK|MO)\b/i.test(language ?? ''))
    return ['PingFang TC', 'Microsoft JhengHei', 'Noto Sans TC', 'Arial Unicode MS'];
  if (/^zh-(?:Hans|CN|SG)\b/i.test(language ?? ''))
    return ['PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'Arial Unicode MS'];
  return [
    'Arial Unicode MS',
    'Noto Sans CJK',
    'PingFang TC',
    'Hiragino Sans',
    'Apple SD Gothic Neo',
  ];
}

const generics = new Map([
  ['system-ui', 'Arial'],
  ['-apple-system', 'Arial'],
  ['blinkmacsystemfont', 'Arial'],
  ['sans-serif', 'Arial'],
  ['serif', 'Times New Roman'],
  ['monospace', 'Courier New'],
]);

// Italic outlines can have overlapping bounding boxes without their ink touching.
// Inspect those exceptional pairs before declaring a newly introduced collision.
function overlapPixels(
  font: string,
  size: number,
  left: string,
  right: string,
  advance: number,
  language: string,
  style: CSSStyleDeclaration | null,
): number {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(size * 4 + Math.abs(advance));
  canvas.height = Math.ceil(size * 4);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return Number.POSITIVE_INFINITY;
  return withCanvasTextStyle(context, style, language, () => {
    setCanvasFont(context, font);
    context.textBaseline = 'alphabetic';
    context.fillText(left, size, size * 2);
    const first = context.getImageData(0, 0, canvas.width, canvas.height).data;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillText(right, size + advance, size * 2);
    const second = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let overlap = 0;
    for (let index = 3; index < first.length; index += 4)
      if (first[index] > 32 && second[index] > 32) overlap++;
    canvas.width = 0;
    canvas.height = 0;
    return overlap;
  });
}

export function createFontResolver(
  probe: GlyphProbe,
  root: Element,
  page: number,
  outputDiagnostics: PptxDiagnostic[],
): FontResolver {
  const canvas = document.createElement('canvas').getContext('2d');
  const seenDiagnostics = new Set<string>();
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const attempt = (
    element: Element,
    text: string,
    overrides: Partial<PptxRun>,
    excluded: Set<string>,
    scales: Map<string, number>,
  ): { runs: PptxRun[]; diagnostics: PptxDiagnostic[] } => {
    const diagnostics: PptxDiagnostic[] = [];
    const warn = (element: Element, code: string, message: string, error: boolean) => {
      const source = sourcePath(element, root);
      diagnostics.push({
        severity: error ? 'error' : 'warning',
        code,
        page: page + 1,
        source,
        message,
        suggestion: error
          ? 'Use an available author font covering the text and enough space for its measured layout.'
          : 'Install the reported fonts in PowerPoint; recipient font availability is unknown.',
      });
    };
    const css = getComputedStyle(element);
    const numericSpacing = css.fontVariantNumeric === 'tabular-nums';
    // Native text cannot carry these CSS OpenType switches. The app's default
    // stylistic alternates and tabular numerals can be normalized only after a
    // DOM advance check and source-feature-aware ink checks below.
    const normalizedFeatures = css.fontFeatureSettings !== 'normal' || numericSpacing;
    const supportedFeatures =
      css.fontFeatureSettings === 'normal' ||
      css.fontFeatureSettings
        .split(',')
        .every((feature) =>
          /^\s*"(?:ss01|cv11|calt|tnum)"(?:\s+(?:on|off|0|1))?\s*$/.test(feature),
        );
    if (
      !supportedFeatures ||
      css.fontVariationSettings !== 'normal' ||
      css.fontVariantCaps !== 'normal' ||
      css.fontVariantLigatures !== 'normal' ||
      css.fontVariantEastAsian !== 'normal' ||
      css.fontVariantPosition !== 'normal' ||
      css.fontVariantAlternates !== 'normal' ||
      (css.fontVariantNumeric !== 'normal' && !numericSpacing) ||
      css.fontKerning !== 'auto' ||
      css.fontOpticalSizing !== 'auto' ||
      css.fontSynthesis !== 'weight style small-caps' ||
      css.fontSizeAdjust !== 'none'
    )
      warn(
        element,
        'unsupported-font-features',
        'The source uses font features whose glyph outlines cannot be verified for native export.',
        true,
      );
    const requested = parseFontFamilies(css.fontFamily);
    const language = authorLanguage(element, root);
    const base = { ...runStyle(element, root), ...overrides, lang: language ?? 'und' };
    const parts = [...segmenter.segment(text)].map(({ segment }) => segment);
    const sets = new Map<PptxFontResolution['script'], string[]>();
    for (const part of parts) {
      if (/^[\s\u200b]+$/.test(part)) continue;
      const script = scriptOf(part);
      const values = sets.get(script) ?? [];
      if (!values.includes(part)) values.push(part);
      sets.set(script, values);
    }
    const resolutions = new Map<PptxFontResolution['script'], PptxFontResolution>();
    for (const [script, characters] of sets) {
      const fallback =
        script === 'eastAsian'
          ? eastAsianCandidates(language)
          : script === 'other'
            ? ['Apple Color Emoji', 'Segoe UI Emoji', 'Arial Unicode MS', 'Arial']
            : [
                'Arial',
                'Helvetica Neue',
                'Helvetica',
                'Aptos',
                'Calibri',
                'Times New Roman',
                'Courier New',
              ];
      const candidates = [
        ...new Set([
          ...requested.map((family) => generics.get(family.toLowerCase()) ?? family),
          ...fallback,
        ]),
      ];
      let selected: string | undefined;
      let unknown = false;
      for (const family of candidates) {
        if (excluded.has(`${script}:${family.toLowerCase()}`)) continue;
        const status = characters.map((character) =>
          probe.hasGlyph(family, character, {
            weight: base.bold ? '700' : '400',
            style: css.fontStyle,
          }),
        );
        if (status.every((value) => value === 'supported')) {
          selected = family;
          break;
        }
        if (status.includes('unknown')) unknown = true;
      }
      const resolved = selected ?? base.fontFace;
      const substituted = !requested[0] || requested[0].toLowerCase() !== resolved.toLowerCase();
      const resolution: PptxFontResolution = {
        source: sourcePath(element, root),
        requested,
        language,
        resolved,
        script,
        coverage: selected ? 'supported' : unknown ? 'unknown' : 'missing',
        substituted,
        reasons: selected
          ? substituted
            ? [
                requested.some((family) => family.toLowerCase() === resolved.toLowerCase())
                  ? 'author-stack-fallback'
                  : requested.some((family) => generics.has(family.toLowerCase()))
                    ? 'generic-font-resolution'
                    : 'missing-font-or-glyph',
              ]
            : []
          : ['coverage-unproven'],
        layout: {
          status: selected ? (substituted ? 'unknown' : 'preserved') : 'unknown',
          advanceDeltaPx: 0,
        },
      };
      if (excluded.size && selected)
        resolution.reasons.push(...[...excluded].map((key) => `layout-rejected:${key}`));
      if (normalizedFeatures) resolution.reasons.push('font-features-normalized');
      resolutions.set(script, resolution);
      if (!selected)
        warn(
          element,
          unknown ? 'font-coverage-unknown' : 'font-glyph-missing',
          `No proven font coverage for ${script} text in ${requested.join(', ')}.`,
          true,
        );
    }
    const latin = resolutions.get('latin')?.resolved ?? base.fontFace;
    const eastAsian = resolutions.get('eastAsian')?.resolved;
    const segments: { text: string; script: PptxFontResolution['script'] }[] = [];
    for (const part of parts) {
      const previous = segments.at(-1);
      const script = /^[\s\u200b]+$/.test(part) ? (previous?.script ?? 'latin') : scriptOf(part);
      if (previous && previous.script === script) previous.text += part;
      else segments.push({ text: part, script });
    }
    if (!segments.length) segments.push({ text, script: 'latin' });
    const runs = segments.map((segment) => {
      const relevant = [...resolutions.values()].filter(
        (resolution) => resolution.script === segment.script,
      );
      const face = resolutions.get(segment.script)?.resolved ?? latin;
      const run: PptxRun = {
        ...base,
        text: segment.text,
        fontFace: face,
        latinFontFace: face,
        eastAsianFontFace: segment.script === 'other' ? undefined : eastAsian,
      };
      const scale = scales.get(`${segment.script}:${face.toLowerCase()}`) ?? 1;
      if ((normalizedFeatures || relevant.some((font) => font.substituted)) && scale < 1) {
        run.fontSize *= scale;
        for (const font of relevant)
          if (!font.reasons.some((reason) => reason.startsWith('font-size-adjusted:')))
            font.reasons.push(`font-size-adjusted:${base.fontSize}->${run.fontSize}`);
      }
      run.letterSpacing = correctedLetterSpacing(
        element,
        segment.text.replace(/\r\n|\r|\n/g, ''),
        run,
      );
      const families = [run.latinFontFace, run.eastAsianFontFace]
        .filter(Boolean)
        .map((family) => JSON.stringify(family))
        .join(', ');
      let safe = true,
        delta = 0;
      const failures = new Set<string>();
      if (normalizedFeatures || relevant.some((resolution) => resolution.substituted)) {
        safe = Boolean(canvas);
        if (canvas) {
          const lines = segment.text.split(/\r\n|\r|\n/);
          for (const line of lines) {
            if (!line) continue;
            const sourceFont = canvasFont(css, css.fontWeight, css.fontFamily);
            const targetFont = canvasFont(
              css,
              run.bold ? '700' : '400',
              families,
              `${run.fontSize}px`,
            );
            const before = withCanvasTextStyle(canvas, css, textLanguage(element), () => {
              setCanvasFont(canvas, sourceFont);
              return canvas.measureText(line);
            });
            const glyphs = [...segmenter.segment(line)]
              .map(({ segment }) => segment)
              .filter((glyph) => glyph !== '\u200b');
            const sourceWidth = sourceAdvance(element, line, canvas);
            const { after, targetMetrics } = withCanvasTextStyle(
              canvas,
              null,
              textLanguage(element),
              () => {
                setCanvasFont(canvas, targetFont);
                return {
                  after: canvas.measureText(line),
                  targetMetrics: glyphs.map((glyph) => canvas.measureText(glyph)),
                };
              },
            );
            const advance =
              after.width -
              sourceWidth +
              trackingCount(line) * (run.letterSpacing - px(css.letterSpacing));
            delta = Math.max(delta, Math.abs(advance));
            const lineHeight = px(css.lineHeight) || run.fontSize * 1.2;
            const sourceAscent = Math.max(
              before.fontBoundingBoxAscent,
              before.actualBoundingBoxAscent,
            );
            const sourceDescent = Math.max(
              before.fontBoundingBoxDescent,
              before.actualBoundingBoxDescent,
            );
            const inkFits =
              after.actualBoundingBoxAscent <= sourceAscent + 0.5 &&
              after.actualBoundingBoxDescent <= sourceDescent + 0.5 &&
              after.actualBoundingBoxAscent + after.actualBoundingBoxDescent <=
                Math.max(lineHeight, sourceAscent + sourceDescent) + 0.5;
            const spacingFits = targetMetrics.every((metric, index) => {
              if (metric.width + run.letterSpacing <= 0) return false;
              const next = targetMetrics[index + 1];
              if (!next || !glyphs[index].trim() || !glyphs[index + 1].trim()) return true;
              const afterGap =
                metric.width +
                run.letterSpacing -
                metric.actualBoundingBoxRight -
                next.actualBoundingBoxLeft;
              if (afterGap >= 0) return true;
              const beforeOverlap = overlapPixels(
                sourceFont,
                base.fontSize,
                glyphs[index],
                glyphs[index + 1],
                sourceAdvance(element, glyphs[index], canvas) + px(css.letterSpacing),
                textLanguage(element),
                css,
              );
              const afterOverlap = overlapPixels(
                targetFont,
                run.fontSize,
                glyphs[index],
                glyphs[index + 1],
                metric.width + run.letterSpacing,
                textLanguage(element),
                null,
              );
              return (
                Number.isFinite(afterOverlap) &&
                Number.isFinite(beforeOverlap) &&
                afterOverlap <= beforeOverlap
              );
            });
            if (!Number.isFinite(advance) || Math.abs(advance) > 0.5)
              failures.add('line advance changed');
            if (!inkFits) failures.add('ink exceeds the source bounds');
            if (!spacingFits) failures.add('glyph spacing introduces overlap');
            if (failures.size) safe = false;
          }
        }
        if (!safe)
          warn(
            element,
            'font-substitution-layout',
            `The replacement font cannot preserve the measured text bounds safely: ${[...failures].join('; ')}.`,
            true,
          );
        else
          warn(
            element,
            relevant.some((resolution) => resolution.substituted)
              ? 'font-substituted'
              : 'font-features-normalized',
            normalizedFeatures
              ? `Native text uses ${families} with default OpenType features; source DOM advances, font bounds and absence of added glyph collisions were checked. Stylistic alternates and tabular glyph shapes may differ.`
              : `Font fallback uses ${families}; glyph coverage, initial line advances and ink bounds were checked.`,
            false,
          );
      }
      run.fontResolutions = relevant.map((resolution) => ({
        ...resolution,
        layout: {
          status:
            resolution.substituted || normalizedFeatures ? (safe ? 'safe' : 'unsafe') : 'preserved',
          advanceDeltaPx: delta,
        },
      }));
      return run;
    });
    return { runs, diagnostics };
  };
  return (element, text, overrides = {}) => {
    const excluded = new Set<string>();
    const scales = new Map<string, number>();
    let result = attempt(element, text, overrides, excluded, scales);
    // A covered face can still be unsafe after spacing correction. Try the next
    // available candidates before reporting that no safe replacement was found.
    for (let retry = 0; retry < 32; retry++) {
      const unsafe = result.runs
        .flatMap((run) => run.fontResolutions ?? [])
        .filter(
          (font) =>
            (font.substituted || font.reasons.includes('font-features-normalized')) &&
            font.layout.status === 'unsafe',
        );
      if (!unsafe.length) break;
      for (const key of new Set(
        unsafe.map((font) => `${font.script}:${font.resolved.toLowerCase()}`),
      )) {
        const scale = scales.get(key) ?? 1;
        const nextScale = [0.98, 0.95, 0.9].find((candidate) => candidate < scale);
        if (nextScale) scales.set(key, nextScale);
        else excluded.add(key);
      }
      const next = attempt(element, text, overrides, excluded, scales);
      if (
        next.runs.some((run) => run.fontResolutions?.some((font) => font.coverage !== 'supported'))
      )
        break;
      result = next;
    }
    for (const diagnostic of result.diagnostics) {
      const key = `${diagnostic.source}/${diagnostic.code}/${diagnostic.message}`;
      if (!seenDiagnostics.has(key)) {
        outputDiagnostics.push(diagnostic);
        seenDiagnostics.add(key);
      }
    }
    return result.runs;
  };
}

type Platform = 'mac' | 'win' | 'other';

const GENERIC = new Set([
  'system-ui',
  '-apple-system',
  'blinkmacsystemfont',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'math',
  'emoji',
  'fangsong',
]);

const GENERIC_MAP: Record<Platform, Record<string, string>> = {
  mac: {
    system: 'Helvetica Neue',
    sans: 'Helvetica',
    serif: 'Times New Roman',
    mono: 'Menlo',
    cursive: 'Apple Chancery',
    fantasy: 'Papyrus',
  },
  win: {
    system: 'Segoe UI',
    sans: 'Arial',
    serif: 'Times New Roman',
    mono: 'Consolas',
    cursive: 'Comic Sans MS',
    fantasy: 'Impact',
  },
  other: {
    system: 'Arial',
    sans: 'Arial',
    serif: 'Times New Roman',
    mono: 'Courier New',
    cursive: 'Comic Sans MS',
    fantasy: 'Impact',
  },
};

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const p = (nav.userAgentData?.platform ?? navigator.platform ?? '').toLowerCase();
  if (p.includes('mac') || p.includes('iphone') || p.includes('ipad')) return 'mac';
  if (p.includes('win')) return 'win';
  return 'other';
}

function mapGeneric(family: string, platform: Platform): string {
  const map = GENERIC_MAP[platform];
  switch (family.toLowerCase()) {
    case 'system-ui':
    case '-apple-system':
    case 'blinkmacsystemfont':
    case 'ui-sans-serif':
    case 'ui-rounded':
      return map.system;
    case 'serif':
    case 'ui-serif':
    case 'fangsong':
      return map.serif;
    case 'monospace':
    case 'ui-monospace':
      return map.mono;
    case 'cursive':
      return map.cursive;
    case 'fantasy':
      return map.fantasy;
    case 'math':
      return 'Cambria Math';
    default:
      return map.sans;
  }
}

const PROBE_TEXT = 'mmmmmmmmmmlliWWwwIIi@#0123';
const availability = new Map<string, boolean>();
const resolved = new Map<string, string>();
let probeCtx: CanvasRenderingContext2D | null | undefined;

function probe(): CanvasRenderingContext2D | null {
  if (probeCtx === undefined) {
    probeCtx = document.createElement('canvas').getContext('2d');
  }
  return probeCtx;
}

function widthWith(ctx: CanvasRenderingContext2D, font: string): number {
  ctx.font = `72px ${font}`;
  return ctx.measureText(PROBE_TEXT).width;
}

export function isFontAvailable(family: string): boolean {
  const cached = availability.get(family);
  if (cached !== undefined) return cached;
  const ctx = probe();
  let available = false;
  if (ctx) {
    const quoted = `"${family.replace(/"/g, '')}"`;
    for (const base of ['monospace', 'serif', 'sans-serif']) {
      if (Math.abs(widthWith(ctx, `${quoted}, ${base}`) - widthWith(ctx, base)) > 0.01) {
        available = true;
        break;
      }
    }
  }
  availability.set(family, available);
  return available;
}

/**
 * PowerPoint needs one concrete family name, so pick the first entry of the CSS
 * stack that the browser can actually render, mapping generic keywords to the
 * platform's default face.
 */
export function resolveFontFamily(stack: string): string {
  const cached = resolved.get(stack);
  if (cached) return cached;
  const platform = detectPlatform();
  let result: string | null = null;
  for (const family of parseCssFontFamilies(stack)) {
    if (!family) continue;
    if (GENERIC.has(family.toLowerCase())) {
      result = mapGeneric(family, platform);
      break;
    }
    if (isFontAvailable(family)) {
      result = family;
      break;
    }
  }
  const out = result ?? mapGeneric('sans-serif', platform);
  resolved.set(stack, out);
  return out;
}
