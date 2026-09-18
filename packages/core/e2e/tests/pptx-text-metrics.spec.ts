import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { coreRoot, deleteSlide, duplicateSlide, openSlide, slideSourcePath } from './helpers';

const slideId = 'pptx-text-metrics-fixture';
const moduleUrl = `/@fs/${slideSourcePath(slideId)}`;
const captureUrl = `/@fs/${path.join(coreRoot, 'src/app/lib/pptx/capture.ts')}`;
const extractUrl = `/@fs/${path.join(coreRoot, 'src/app/lib/pptx/extract.ts')}`;

const source = `import React from 'react';
export const FixtureReact = React;
export const meta = { title: 'PPTX text metrics fixture' };
const Frame = ({ children }) => <section style={{ width: '100%', height: '100%', padding: 80, boxSizing: 'border-box', background: '#fff', color: '#111' }}>{children}</section>;
const Metrics = () => <Frame>
  <p data-metric="fallback" style={{ width: 420, margin: 0, fontFamily: 'system-ui, sans-serif', fontSize: 36, lineHeight: '44px', letterSpacing: '1.5px' }}>Narrow fallback text preserves each browser measured line and its source advance.</p>
  <p data-metric="rich" style={{ width: 360, margin: '48px 0 0', fontFamily: 'system-ui, sans-serif', fontSize: 30, lineHeight: '38px', letterSpacing: '0.75px' }}>Rich run <strong style={{ fontFamily: 'monospace', fontWeight: 700 }}>混合 😀 glyphs</strong> keep measured soft breaks together.</p>
  <p data-metric="arial" style={{ margin: '48px 0 0', fontFamily: 'Arial', fontSize: 28, lineHeight: '34px' }}>Arial explicit</p>
  <p data-metric="mono" style={{ margin: '24px 0 0', fontFamily: 'monospace, Arial', fontSize: 28, lineHeight: '34px' }}>Monospace explicit</p>
  <p data-metric="surrogate" style={{ margin: '24px 0 0', fontFamily: 'system-ui, sans-serif', fontSize: 28, lineHeight: '34px', letterSpacing: '2px', whiteSpace: 'nowrap' }}>A😀B</p>
  <div data-metric="ellipsis" style={{ width: 430, boxSizing: 'border-box', paddingRight: 32, margin: '48px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Arial', fontSize: 28, lineHeight: '36px' }}><span style={{ color: '#456' }}>{'A wide inline prefix '}</span><strong style={{ color: '#789', fontFamily: 'monospace', fontWeight: 700 }}>{'with a second rich run '}</strong><span style={{ color: '#abc', fontFamily: 'Arial' }}>{'and a long suffix that should remain in the source report after measured CSS truncation for PowerPoint editing'}</span></div>
  <div data-metric="space-only" style={{ margin: '24px 0 0', fontFamily: 'Arial', fontSize: 40, lineHeight: '48px' }}>{'\u00a0\u3000'}</div>
  <div data-metric="fragments" style={{position:'absolute',left:800,top:300,fontFamily:'Times New Roman',fontSize:100,lineHeight:'120px'}}>PREFIX <span style={{display:'inline-block'}}>74</span>–<span style={{display:'inline-block'}}>98</span><span style={{fontSize:48}}>%</span></div>
</Frame>;
export default [Metrics];`;

type Run = {
  text: string;
  fontFace: string;
  fontSize: number;
  bold: boolean;
  letterSpacing: number;
};

type TextObject = {
  kind: string;
  source: string;
  x: number;
  y: number;
  w: number;
  h: number;
  paragraphs: { runs: Run[] }[];
};

type Diagnostic = {
  severity: string;
  code: string;
  originalText?: string;
};

type Extracted = { objects: TextObject[]; diagnostics: Diagnostic[] };

test.describe('editable PPTX text metrics', () => {
  test.beforeEach(async ({ request, page }) => {
    await duplicateSlide(request, 'alpha', slideId);
    await fs.writeFile(slideSourcePath(slideId), source);
    await openSlide(page, slideId);
  });

  test.afterEach(async ({ request, page }) => {
    await page.goto('about:blank');
    await deleteSlide(request, slideId);
  });

  test('preserves browser line advances, rich runs, generic order, and Unicode counts', async ({
    page,
  }) => {
    const result = await page.evaluate(
      async ({ captureUrl, extractUrl, moduleUrl }) => {
        const [{ capturePage }, { extractPage }] = await Promise.all([
          import(captureUrl),
          import(extractUrl),
        ]);
        const slideModule = await import(moduleUrl);
        const controller = new AbortController();
        const sourceLines = (element: Element) => {
          const node = element.firstChild;
          if (!(node instanceof Text)) throw new Error('line fixture must have one text node');
          const range = document.createRange();
          const lines: { top: number; left: number; right: number; text: string }[] = [];
          let offset = 0;
          for (const character of node.data) {
            range.setStart(node, offset);
            offset += character.length;
            range.setEnd(node, offset);
            const rect = range.getBoundingClientRect();
            if (!rect.width || !rect.height) continue;
            const top = Math.round(rect.top * 100) / 100;
            const line = lines.find((candidate) => candidate.top === top);
            if (line) {
              line.left = Math.min(line.left, rect.left);
              line.right = Math.max(line.right, rect.right);
              line.text += character;
            } else {
              lines.push({ top, left: rect.left, right: rect.right, text: character });
            }
          }
          return lines.map(({ top, left, right, text }) => ({ top, width: right - left, text }));
        };
        const canvas = document.createElement('canvas').getContext('2d');
        if (!canvas) throw new Error('canvas unavailable');
        const lineAdvance = (element: Element, text: string, run: Run) => {
          const style = getComputedStyle(element);
          canvas.font = `${run.bold ? '700' : '400'} ${style.fontSize} ${JSON.stringify(run.fontFace)}`;
          return canvas.measureText(text).width + run.letterSpacing * Array.from(text).length;
        };
        const capturedMetrics = await capturePage(slideModule, 0, controller.signal, 20_000);
        try {
          const fallbackElement = capturedMetrics.host.querySelector('[data-metric="fallback"]');
          if (!fallbackElement) throw new Error('fallback fixture missing');
          const fallbackSourceLines = sourceLines(fallbackElement);
          const extracted = (await extractPage(
            capturedMetrics.host,
            0,
            controller.signal,
          )) as Extracted;
          const objects = extracted.objects.filter((object) => object.kind === 'text');
          const byText = (needle: string) => {
            const object = objects.find((candidate) =>
              candidate.paragraphs[0]?.runs
                .map((run) => run.text)
                .join('')
                .includes(needle),
            );
            if (!object) throw new Error(`missing text object ${needle}`);
            return object;
          };
          const fallback = byText('Narrow fallback');
          const fallbackElementStyle = getComputedStyle(fallbackElement);
          const fallbackLines = fallback.paragraphs[0].runs.flatMap((run) =>
            run.text
              .split('\n')
              .filter(Boolean)
              .map((text) => ({ text, width: lineAdvance(fallbackElement, text, run) })),
          );
          const rich = byText('Rich run');
          const arial = byText('Arial explicit');
          const mono = byText('Monospace explicit');
          const surrogate = byText('A😀B');
          const arialElement = capturedMetrics.host.querySelector('[data-metric="arial"]');
          if (!arialElement) throw new Error('Arial fixture missing');
          const arialStyle = getComputedStyle(arialElement);
          const monoElement = capturedMetrics.host.querySelector('[data-metric="mono"]');
          if (!monoElement) throw new Error('monospace fixture missing');
          const monoStyle = getComputedStyle(monoElement);
          return {
            fallbackSourceLines,
            fallbackLines,
            fallbackRuns: fallback.paragraphs[0].runs,
            richRuns: rich.paragraphs[0].runs,
            arialRuns: arial.paragraphs[0].runs,
            monoRuns: mono.paragraphs[0].runs,
            surrogateRuns: surrogate.paragraphs[0].runs,
            fallbackLetterSpacing: Number.parseFloat(fallbackElementStyle.letterSpacing),
            arialStyle: {
              family: arialStyle.fontFamily,
              weight: arialStyle.fontWeight,
              style: arialStyle.fontStyle,
              variant: arialStyle.fontVariant,
              stretch: arialStyle.fontStretch,
              letterSpacing: Number.parseFloat(arialStyle.letterSpacing),
            },
            monoLetterSpacing: Number.parseFloat(monoStyle.letterSpacing),
            fallbackText: fallback.paragraphs[0].runs.map((run) => run.text).join(''),
            objectCount: objects.length,
          };
        } finally {
          capturedMetrics.dispose();
        }
      },
      { captureUrl, extractUrl, moduleUrl },
    );

    expect(result.objectCount).toBe(12);
    expect(result.fallbackSourceLines.length).toBeGreaterThan(1);
    expect(result.fallbackLines).toHaveLength(result.fallbackSourceLines.length);
    result.fallbackLines.forEach((line, index) => {
      expect(Math.abs(line.width - result.fallbackSourceLines[index].width)).toBeLessThan(1.5);
    });
    expect(result.fallbackText.replace(/\n/g, ' ')).toContain('Narrow fallback text');
    expect(result.fallbackRuns.length).toBeLessThan(result.fallbackText.replace(/\n/g, '').length);
    expect(result.fallbackRuns.some((run) => run.text.includes('\n'))).toBe(true);
    expect(result.fallbackRuns.every((run) => run.fontFace === 'Arial')).toBe(true);
    expect(result.arialRuns).toHaveLength(1);
    expect(result.arialRuns[0]).toMatchObject({
      fontFace: 'Arial',
      letterSpacing: result.arialStyle.letterSpacing,
    });
    expect(result.monoRuns).toHaveLength(1);
    expect(result.monoRuns[0]).toMatchObject({
      fontFace: 'Courier New',
      letterSpacing: result.monoLetterSpacing,
    });
    expect(result.richRuns.some((run) => run.bold && run.fontFace === 'Courier New')).toBe(true);
    expect(result.richRuns.some((run) => run.text.includes('\n'))).toBe(true);
    const surrogateText = result.surrogateRuns.map((run) => run.text).join('');
    expect(surrogateText).toBe('A😀B');
    expect(surrogateText.length).toBe(4);
    expect(Array.from(surrogateText)).toHaveLength(3);
    expect(result.surrogateRuns.find((run) => run.text === '😀')?.fontFace).toBe(
      'Apple Color Emoji',
    );
  });
  test('matches CSS nowrap ellipsis and preserves visible-width whitespace', async ({ page }) => {
    const result = await page.evaluate(
      async ({ captureUrl, extractUrl, moduleUrl }) => {
        const { capturePage } = await import(captureUrl);
        const { extractPage } = await import(extractUrl);
        const controller = new AbortController();
        const captured = await capturePage(await import(moduleUrl), 0, controller.signal, 20_000);
        try {
          const ellipsisElement = captured.host.querySelector('[data-metric="ellipsis"]');
          if (!ellipsisElement) throw new Error('ellipsis fixture missing');
          const spacesElement = captured.host.querySelector('[data-metric="space-only"]');
          if (!spacesElement) throw new Error('space-only fixture missing');
          const extracted = (await extractPage(captured.host, 0, controller.signal)) as Extracted;
          const textObjects = extracted.objects.filter((object) => object.kind === 'text');
          const ellipsisObject = textObjects.find((object) =>
            object.paragraphs[0]?.runs.some((run) => run.text.includes('A wide inline prefix')),
          );
          if (!ellipsisObject) throw new Error('ellipsis text object missing');
          const spacesObject = textObjects.find((object) =>
            object.paragraphs[0]?.runs.some((run) => run.text.includes('\u00a0')),
          );
          if (!spacesObject) throw new Error('space-only text object missing');
          const fullText = ellipsisElement.textContent ?? '';
          const visibleText = ellipsisObject.paragraphs[0].runs.map((run) => run.text).join('');
          const diagnostic = extracted.diagnostics.find((entry) => entry.code === 'text-ellipsis');
          if (!diagnostic) throw new Error('ellipsis diagnostic missing');
          const style = getComputedStyle(ellipsisElement);
          const rect = ellipsisElement.getBoundingClientRect();
          const contentWidth =
            rect.width -
            Number.parseFloat(style.borderLeftWidth) -
            Number.parseFloat(style.borderRightWidth) -
            Number.parseFloat(style.paddingLeft) -
            Number.parseFloat(style.paddingRight);
          const range = document.createRange();
          range.selectNodeContents(spacesElement);
          return {
            fullText,
            visibleText,
            runCount: ellipsisObject.paragraphs[0].runs.length,
            hasBoldRun: ellipsisObject.paragraphs[0].runs.some((run) => run.bold),
            objectWidth: ellipsisObject.w,
            contentWidth,
            diagnosticSeverity: diagnostic.severity,
            diagnosticOriginalText: diagnostic.originalText,
            spaceText: spacesObject.paragraphs[0].runs.map((run) => run.text).join(''),
            spaceRangeWidth: range.getBoundingClientRect().width,
          };
        } finally {
          captured.dispose();
        }
      },
      { captureUrl, extractUrl, moduleUrl },
    );

    expect(result.fullText.length).toBeGreaterThan(100);
    expect(result.visibleText.endsWith('…')).toBe(true);
    expect(result.visibleText.length).toBeLessThan(result.fullText.length);
    expect(result.visibleText).toContain('A wide inline prefix');
    expect(result.visibleText).not.toContain('measured CSS truncation');
    expect(result.runCount).toBeGreaterThanOrEqual(2);
    expect(result.hasBoldRun).toBe(true);
    expect(result.objectWidth).toBeCloseTo(result.contentWidth, 1);
    expect(result.diagnosticSeverity).toBe('warning');
    expect(result.diagnosticOriginalText).toBe(result.fullText);
    expect(result.spaceText).toBe('\u00a0\u3000');
    expect(result.spaceRangeWidth).toBeGreaterThan(0);
  });
  test('positions inline fragments around independently laid out children without glyph overlap', async ({
    page,
  }) => {
    const result = await page.evaluate(
      async ({ captureUrl, extractUrl, moduleUrl }) => {
        const { capturePage } = await import(captureUrl);
        const { extractPage } = await import(extractUrl);
        const controller = new AbortController();
        const captured = await capturePage(await import(moduleUrl), 0, controller.signal, 20_000);
        try {
          const element: Element | null = captured.host.querySelector('[data-metric="fragments"]');
          if (!element) throw new Error('fragment fixture missing');
          const origin = captured.host.getBoundingClientRect();
          const expected = Array.from(element.childNodes).map((node) => {
            const range = document.createRange();
            range.selectNode(node);
            return { text: node.textContent, x: range.getBoundingClientRect().x - origin.x };
          });
          const ir = await extractPage(captured.host, 0, controller.signal);
          return {
            expected,
            actual: ir.objects
              .filter((o: { kind: string }) => o.kind === 'text')
              .map((o: { x: number; paragraphs: { runs: { text: string }[] }[] }) => ({
                x: o.x,
                text: o.paragraphs.flatMap((p) => p.runs.map((r) => r.text)).join(''),
              })),
          };
        } finally {
          captured.dispose();
        }
      },
      { captureUrl, extractUrl, moduleUrl },
    );
    for (const expected of result.expected) {
      const actual = result.actual.find((o: { text: string }) => o.text === expected.text);
      expect(actual, String(expected.text)).toBeDefined();
      expect(actual?.x).toBeCloseTo(expected.x, 1);
    }
  });
});
