import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import type { PptxRun } from '../../src/app/lib/pptx/model';
import { coreRoot, openSlide } from './helpers';

type LayoutOptions = {
  fontFamily?: string;
  fontSize: number;
  fontWeight: number;
  lang: string;
  letterSpacing: number;
  text: string;
};

type LayoutEvidence = {
  diagnostics: { code: string; message: string; severity: string }[];
  fontsAfter: number;
  fontsBefore: number;
  runs: {
    fontFace: string;
    fontResolutions: {
      coverage: string;
      layout: { advanceDeltaPx: number; status: string };
      reasons: string[];
      resolved: string;
      script: string;
      substituted: boolean;
    }[];
    fontSize: number;
    letterSpacing: number;
    script: string;
    sourceAdvance: number;
    sourceInk: InkEvidence;
    targetAdvance: number;
    targetInk: InkEvidence;
    sourceWordCollisionPixels: number;
    targetWordCollisionPixels: number;
    text: string;
  }[];
  sourceDomWidth: number;
  targetWidth: number;
};

type InkEvidence = {
  actualBoundingBoxAscent: number;
  actualBoundingBoxDescent: number;
  actualBoundingBoxLeft: number;
  actualBoundingBoxRight: number;
  advance: number;
};

async function inspectFontLayout(page: Page, options: LayoutOptions): Promise<LayoutEvidence> {
  return page.evaluate(
    async ({ fontProbeUrl, resolverUrl, styleUrl, ...input }) => {
      const { createGlyphProbe } = await import(fontProbeUrl);
      const { createFontResolver } = await import(resolverUrl);
      const { canvasFont, px, sourceAdvance } = await import(styleUrl);
      const root = document.createElement('div');
      const element = document.createElement('span');
      Object.assign(root.style, {
        left: '0',
        position: 'absolute',
        top: '0',
      });
      Object.assign(element.style, {
        display: 'inline-block',
        fontFamily: input.fontFamily ?? 'system-ui',
        fontSize: `${input.fontSize}px`,
        fontWeight: String(input.fontWeight),
        letterSpacing: `${input.letterSpacing}px`,
        lineHeight: `${input.fontSize * 1.2}px`,
        whiteSpace: 'pre',
      });
      element.lang = input.lang;
      element.textContent = input.text;
      root.append(element);
      document.body.append(root);
      await document.fonts.ready;

      const graphemes = (value: string) =>
        [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)].map(
          ({ segment }) => segment,
        );
      const characterCount = (value: string) =>
        graphemes(value.replace(/[\r\n\u200b]/g, '')).length;
      const finite = (value: number) => (Number.isFinite(value) ? value : 0);
      const measureInk = (
        context: CanvasRenderingContext2D,
        font: string,
        value: string,
        tracking: number,
      ): InkEvidence => {
        context.font = font;
        const metrics = context.measureText(value);
        return {
          actualBoundingBoxAscent: finite(metrics.actualBoundingBoxAscent),
          actualBoundingBoxDescent: finite(metrics.actualBoundingBoxDescent),
          actualBoundingBoxLeft: finite(metrics.actualBoundingBoxLeft),
          actualBoundingBoxRight: finite(metrics.actualBoundingBoxRight),
          advance: finite(metrics.width + characterCount(value) * tracking),
        };
      };
      const pairOverlap = (
        font: string,
        size: number,
        left: string,
        right: string,
        advance: number,
        lang: string,
      ): number => {
        const canvas = document.createElement('canvas');
        canvas.lang = lang;
        canvas.width = Math.ceil(size * 4 + Math.abs(advance) + 20);
        canvas.height = Math.ceil(size * 4);
        Object.assign(canvas.style, {
          position: 'fixed',
          left: '-100000px',
          visibility: 'hidden',
          letterSpacing: '0px',
          wordSpacing: '0px',
          fontFeatureSettings: 'normal',
          fontVariant: 'normal',
        });
        // Chromium resolves the canvas language from the connected element.
        root.append(canvas);
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          canvas.remove();
          return 0;
        }
        context.font = font;
        context.textBaseline = 'alphabetic';
        context.fillText(left, size, size * 2);
        const first = context.getImageData(0, 0, canvas.width, canvas.height).data;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillText(right, size + advance, size * 2);
        const second = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let overlap = 0;
        for (let index = 3; index < first.length; index += 4)
          if (first[index] > 32 && second[index] > 32) overlap += 1;
        canvas.remove();
        return overlap;
      };
      const wordCollisionPixels = (
        context: CanvasRenderingContext2D,
        font: string,
        size: number,
        value: string,
        tracking: number,
        lang: string,
      ): number => {
        context.font = font;
        const values = graphemes(value);
        let result = 0;
        for (let index = 0; index + 1 < values.length; index += 1) {
          const left = values[index];
          const right = values[index + 1];
          if (!left.trim() || !right.trim()) continue;
          const advance = context.measureText(left).width + tracking;
          result += pairOverlap(font, size, left, right, advance, lang);
        }
        return result;
      };

      const fontsBefore = document.fonts.size;
      const metricsCanvas = document.createElement('canvas');
      metricsCanvas.lang = input.lang;
      const canvas = metricsCanvas.getContext('2d', {
        willReadFrequently: true,
      });
      if (!canvas) throw new Error('The browser cannot create the font-layout metrics canvas.');
      const probe = await createGlyphProbe(input.text, new AbortController().signal);
      let evidence: Omit<LayoutEvidence, 'fontsAfter'> | null = null;
      try {
        const diagnostics: { code: string; message: string; severity: string }[] = [];
        const runs = createFontResolver(
          probe,
          root,
          0,
          diagnostics,
        )(element, input.text) as PptxRun[];
        const style = getComputedStyle(element);
        const sourceFont = canvasFont(style, style.fontWeight, style.fontFamily);
        const evidenceRuns = runs.map((run) => {
          const families = [run.latinFontFace, run.eastAsianFontFace]
            .filter(Boolean)
            .map((family) => JSON.stringify(family))
            .join(', ');
          const targetFont = canvasFont(
            style,
            run.bold ? '700' : '400',
            families || JSON.stringify(run.fontFace),
            `${run.fontSize}px`,
          );
          const sourceRunAdvance =
            sourceAdvance(element, run.text, canvas) +
            characterCount(run.text) * px(style.letterSpacing);
          const targetRunAdvance = measureInk(
            canvas,
            targetFont,
            run.text,
            run.letterSpacing,
          ).advance;
          const sourceInk = measureInk(canvas, sourceFont, run.text, px(style.letterSpacing));
          const targetInk = measureInk(canvas, targetFont, run.text, run.letterSpacing);
          return {
            fontFace: run.fontFace,
            fontResolutions: (run.fontResolutions ?? []).map((resolution) => ({
              coverage: resolution.coverage,
              layout: resolution.layout,
              reasons: resolution.reasons,
              resolved: resolution.resolved,
              script: resolution.script,
              substituted: resolution.substituted,
            })),
            fontSize: run.fontSize,
            letterSpacing: run.letterSpacing,
            script: run.fontResolutions?.[0]?.script ?? 'latin',
            sourceAdvance: sourceRunAdvance,
            sourceInk,
            targetAdvance: targetRunAdvance,
            targetInk,
            sourceWordCollisionPixels: wordCollisionPixels(
              canvas,
              sourceFont,
              input.fontSize,
              run.text,
              px(style.letterSpacing),
              input.lang,
            ),
            targetWordCollisionPixels: wordCollisionPixels(
              canvas,
              targetFont,
              run.fontSize,
              run.text,
              run.letterSpacing,
              input.lang,
            ),
            text: run.text,
          };
        });
        const targetWidth = evidenceRuns.reduce(
          (sum: number, run: { targetAdvance: number }) => sum + run.targetAdvance,
          0,
        );
        evidence = {
          diagnostics,
          fontsBefore,
          runs: evidenceRuns,
          sourceDomWidth: element.getBoundingClientRect().width,
          targetWidth,
        };
      } finally {
        probe.dispose();
        root.remove();
      }
      if (!evidence) throw new Error('The font-layout metrics were not collected.');
      return { ...evidence, fontsAfter: document.fonts.size };
    },
    {
      ...options,
      fontProbeUrl: `/@fs/${path.join(coreRoot, 'src/app/lib/pptx/font-probe.ts')}`,
      resolverUrl: `/@fs/${path.join(coreRoot, 'src/app/lib/pptx/fonts.ts')}`,
      styleUrl: `/@fs/${path.join(coreRoot, 'src/app/lib/pptx/style.ts')}`,
    },
  );
}

test('preserves mixed Latin and East Asian advances with script-specific tracking', async ({
  page,
}, testInfo) => {
  await openSlide(page, 'alpha');
  const result = await inspectFontLayout(page, {
    fontSize: 22,
    fontWeight: 600,
    lang: 'zh-Hant',
    letterSpacing: 0,
    text: 'OPEN SLIDE · 簡報工具',
  });
  await fs.writeFile(
    testInfo.outputPath('mixed-font-layout.json'),
    JSON.stringify(result, null, 2),
  );

  expect(result.diagnostics.filter(({ severity }) => severity === 'error')).toEqual([]);
  expect(result.runs.map(({ text }) => text)).toEqual(['OPEN SLIDE ', '· 簡報工具']);
  expect(new Set(result.runs.map(({ script }) => script))).toEqual(new Set(['latin', 'eastAsian']));
  expect(result.runs.every(({ fontResolutions }) => fontResolutions.length === 1)).toBe(true);
  expect(
    result.runs.every(({ fontResolutions }) =>
      fontResolutions.every(
        ({ coverage, layout }) =>
          coverage === 'supported' && (layout.status === 'safe' || layout.status === 'preserved'),
      ),
    ),
  ).toBe(true);
  expect(
    result.runs.every(
      ({ sourceAdvance, targetAdvance }) => Math.abs(targetAdvance - sourceAdvance) <= 0.5,
    ),
  ).toBe(true);
  expect(Math.abs(result.targetWidth - result.sourceDomWidth)).toBeLessThanOrEqual(0.5);
  expect(
    result.runs.every(({ sourceInk, targetInk }) =>
      [
        sourceInk.advance,
        sourceInk.actualBoundingBoxAscent,
        sourceInk.actualBoundingBoxDescent,
        targetInk.advance,
        targetInk.actualBoundingBoxAscent,
        targetInk.actualBoundingBoxDescent,
      ].every(Number.isFinite),
    ),
  ).toBe(true);
  expect(
    result.runs.every(
      ({ sourceWordCollisionPixels, targetWordCollisionPixels }) =>
        targetWordCollisionPixels <= sourceWordCollisionPixels,
    ),
  ).toBe(true);
  expect(result.fontsAfter).toBe(result.fontsBefore);
});

test('keeps a substituted Traditional Chinese heading within its measured DOM advance', async ({
  page,
}, testInfo) => {
  await openSlide(page, 'alpha');
  const result = await inspectFontLayout(page, {
    fontSize: 70,
    fontWeight: 800,
    lang: 'zh-Hant',
    letterSpacing: -2.45,
    text: '簡報文字需要清晰，內容仍要完整',
  });
  await fs.writeFile(testInfo.outputPath('cjk-font-layout.json'), JSON.stringify(result, null, 2));

  expect(result.diagnostics.filter(({ severity }) => severity === 'error')).toEqual([]);
  expect(result.runs.map(({ text }) => text)).toEqual(['簡報文字需要清晰，內容仍要完整']);
  expect(
    result.runs.some(({ fontResolutions }) =>
      fontResolutions.some(({ substituted }) => substituted),
    ),
  ).toBe(true);
  expect(result.runs.every(({ fontSize }) => fontSize >= 63 && fontSize <= 70)).toBe(true);
  expect(
    result.runs.every(
      ({ fontSize, fontResolutions }) =>
        fontSize === 70 ||
        fontResolutions.some(({ reasons }) =>
          reasons.some((reason) => reason.startsWith('font-size-adjusted:')),
        ),
    ),
  ).toBe(true);
  expect(
    result.runs.every(({ fontResolutions }) =>
      fontResolutions.every(
        ({ coverage, layout }) =>
          coverage === 'supported' && (layout.status === 'safe' || layout.status === 'preserved'),
      ),
    ),
  ).toBe(true);
  expect(Math.abs(result.targetWidth - result.sourceDomWidth)).toBeLessThanOrEqual(0.5);
  expect(
    result.runs.every(({ sourceInk, targetInk }) =>
      [
        sourceInk.advance,
        sourceInk.actualBoundingBoxAscent,
        sourceInk.actualBoundingBoxDescent,
        targetInk.advance,
        targetInk.actualBoundingBoxAscent,
        targetInk.actualBoundingBoxDescent,
      ].every(Number.isFinite),
    ),
  ).toBe(true);
  expect(
    result.runs.every(
      ({ sourceWordCollisionPixels, targetWordCollisionPixels }) =>
        targetWordCollisionPixels <= sourceWordCollisionPixels,
    ),
  ).toBe(true);
  expect(result.fontsAfter).toBe(result.fontsBefore);
});

test('counts an emoji variation selector as one tracked grapheme', async ({ page }, testInfo) => {
  await openSlide(page, 'alpha');
  const result = await inspectFontLayout(page, {
    fontSize: 32,
    fontWeight: 600,
    lang: 'en-US',
    letterSpacing: 1.25,
    text: '✈️',
  });
  await fs.writeFile(testInfo.outputPath('vs16-font-layout.json'), JSON.stringify(result, null, 2));

  expect(result.diagnostics.filter(({ severity }) => severity === 'error')).toEqual([]);
  expect(result.runs.map(({ text }) => text)).toEqual(['✈️']);
  expect(result.runs).toHaveLength(1);
  expect(result.runs[0].fontResolutions).toHaveLength(1);
  expect(
    result.runs[0].fontResolutions.every(
      ({ coverage, layout }) =>
        coverage === 'supported' && (layout.status === 'safe' || layout.status === 'preserved'),
    ),
  ).toBe(true);
  expect(Math.abs(result.runs[0].sourceAdvance - result.sourceDomWidth)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(result.targetWidth - result.sourceDomWidth)).toBeLessThanOrEqual(0.5);
  expect(
    result.runs.every(
      ({ sourceWordCollisionPixels, targetWordCollisionPixels }) =>
        targetWordCollisionPixels <= sourceWordCollisionPixels,
    ),
  ).toBe(true);
  expect(result.fontsAfter).toBe(result.fontsBefore);
});

test('preserves Times New Roman advances for labels with ligature sequences', async ({
  page,
}, testInfo) => {
  await openSlide(page, 'alpha');
  const texts = ['Sample workflow + text', 'Office workflow + text'];
  const results: LayoutEvidence[] = [];
  for (const text of texts)
    results.push(
      await inspectFontLayout(page, {
        fontFamily: 'Times New Roman',
        fontSize: 36,
        fontWeight: 800,
        lang: '',
        letterSpacing: -0.08,
        text,
      }),
    );
  await fs.writeFile(
    testInfo.outputPath('times-new-roman-font-layout.json'),
    JSON.stringify(results, null, 2),
  );

  for (const [index, result] of results.entries()) {
    expect(result.diagnostics.filter(({ severity }) => severity === 'error')).toEqual([]);
    expect(result.runs.map(({ text }) => text)).toEqual([texts[index]]);
    expect(
      result.runs.every(
        ({ fontFace, fontResolutions }) =>
          fontFace === 'Times New Roman' &&
          fontResolutions.every(
            ({ coverage, layout, resolved }) =>
              resolved === 'Times New Roman' &&
              coverage === 'supported' &&
              (layout.status === 'safe' || layout.status === 'preserved'),
          ),
      ),
    ).toBe(true);
    expect(
      result.runs.every(
        ({ fontSize, fontResolutions }) =>
          fontSize <= 36 &&
          (fontSize === 36 ||
            fontResolutions.some(({ reasons }) =>
              reasons.some((reason) => reason.startsWith('font-size-adjusted:')),
            )),
      ),
    ).toBe(true);
    expect(Math.abs(result.targetWidth - result.sourceDomWidth)).toBeLessThanOrEqual(0.5);
    expect(
      result.runs.every(
        ({ sourceWordCollisionPixels, targetWordCollisionPixels }) =>
          targetWordCollisionPixels <= sourceWordCollisionPixels,
      ),
    ).toBe(true);
    expect(result.fontsAfter).toBe(result.fontsBefore);
  }
});
