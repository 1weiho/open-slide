import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';
import { coreRoot, deleteSlide, duplicateSlide, openSlide, slideSourcePath } from './helpers';

const slideId = 'font-script-matrix';
const source = `import React from 'react';
export const FixtureReact=React;
export const meta={title:'Author font matrix'};
export const notes=['Font matrix notes'];
export default [()=> <section style={{width:'100%',height:'100%',padding:90,background:'#fff',color:'#111',fontFamily:'Arial',fontSize:32,lineHeight:'44px'}}>
  <p lang="zh-Hant">繁體中文 ABC 0123，標點 <strong>粗體</strong> <a href="https://example.com">連結</a></p>
  <p lang="zh-Hans">简体中文 ABC 456</p>
  <p lang="ja">日本語の文字 ABC 789</p>
  <p lang="ko">한국어 문자 ABC 123</p>
  <p>Unknown language 中文 ABC 😀</p>
  <p>Zero\u200bwidth break</p>
  <p lang="zh-Hant" style={{fontFamily:'Definitely Absent Font, Arial'}}>Safe replacement 繁體字 ABC</p>
  <ol start={3} lang="zh-Hant" style={{listStyleType:'decimal',paddingLeft:40}}><li>清單 mixed 123</li><li><em>保留斜體</em></li></ol>
  <table lang="ja" style={{borderCollapse:'collapse',width:800}}><tbody><tr><td style={{padding:16,border:'1px solid #ccc'}}>表の文字 ABC</td><td style={{padding:16,border:'1px solid #ccc'}}>日本語 456</td></tr></tbody></table>
</section>];`;

test('exports author language, Latin/EA runs, lists and tables through the worker', async ({
  page,
  request,
}, testInfo) => {
  await duplicateSlide(request, 'alpha', slideId);
  try {
    await fs.writeFile(slideSourcePath(slideId), source);
    await openSlide(page, slideId);
    const result = await page.evaluate(
      async ({ moduleUrl, exporterUrl }) => {
        const fontsBefore = document.fonts.size;
        const { exportSlideAsEditablePptx } = await import(exporterUrl);
        const { blob, report } = await exportSlideAsEditablePptx(
          await import(moduleUrl),
          'font-script-matrix',
        ).catch((error: { diagnostics?: unknown }) => {
          throw new Error(JSON.stringify(error.diagnostics ?? error));
        });
        return {
          bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
          report,
          fontsBefore,
          fontsAfter: document.fonts.size,
          captureRoots: document.querySelectorAll('[data-osd-pptx-capture]').length,
        };
      },
      {
        moduleUrl: `/@fs/${slideSourcePath(slideId)}`,
        exporterUrl: `/@fs/${path.join(coreRoot, 'src/app/lib/export-editable-pptx.ts')}`,
      },
    );
    await fs.writeFile(testInfo.outputPath('font-matrix.pptx'), Uint8Array.from(result.bytes));
    await fs.writeFile(
      testInfo.outputPath('font-matrix.report.json'),
      JSON.stringify(result.report, null, 2),
    );
    const zip = unzipSync(Uint8Array.from(result.bytes));
    const xml = strFromU8(zip['ppt/slides/slide1.xml']);
    const fonts = result.report.quality.fonts;
    expect(result.fontsAfter).toBe(result.fontsBefore);
    expect(result.captureRoots).toBe(0);
    expect(
      result.report.diagnostics.filter((entry: { severity: string }) => entry.severity === 'error'),
    ).toEqual([]);
    for (const language of ['zh-Hant', 'zh-Hans', 'ja', 'ko']) {
      expect(
        fonts.some(
          (font: { language: string; script: string; coverage: string }) =>
            font.language === language &&
            font.script === 'eastAsian' &&
            font.coverage === 'supported',
        ),
      ).toBe(true);
    }
    expect(
      fonts.some(
        (font: { language: unknown; script: string }) =>
          font.language === null && font.script === 'eastAsian',
      ),
    ).toBe(true);
    expect(
      fonts.some(
        (font: { requested: string[]; substituted: boolean; layout: { status: string } }) =>
          font.requested[0] === 'Definitely Absent Font' &&
          font.substituted &&
          font.layout.status === 'safe',
      ),
    ).toBe(true);
    expect(xml).toContain('<a:latin typeface="Arial"/>');
    expect(xml).toContain('<a:ea typeface=');
    expect(xml).not.toContain('lang="und"');
    expect(xml).toContain('startAt="3"');
    expect(xml).toContain('<a:tbl>');
    const ids = [...xml.matchAll(/<p:cNvPr\b[^>]*\bid="(\d+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(xml).toContain('😀');
    expect(xml).toContain('Zero\u200bwidth break');
    expect(xml).not.toContain('<p:pic>');
    expect(strFromU8(zip['ppt/notesSlides/notesSlide1.xml'])).toContain('Font matrix notes');
    expect(strFromU8(zip['ppt/slides/_rels/slide1.xml.rels'])).toContain('https://example.com');
  } finally {
    await page.close();
    await deleteSlide(request, slideId);
  }
});

test('blocks unproven coverage and a measured replacement that introduces glyph overlap', async ({
  page,
}) => {
  await openSlide(page, 'alpha');
  const result = await page.evaluate(
    async (resolverUrl) => {
      const { createFontResolver, authorLanguage } = await import(resolverUrl);
      const root = document.createElement('div');
      root.innerHTML =
        '<p style="font-family: Arial; font-size: 40px; line-height: 48px">iiiiii</p><div lang="zh-Hant"><span lang="ja">文字</span><span lang="">文字</span></div>';
      document.body.append(root);
      try {
        const element = root.querySelector('p');
        const missing: { code: string; severity: string }[] = [];
        const unknownRuns = createFontResolver(
          { hasGlyph: () => 'unknown' },
          root,
          0,
          missing,
        )(element, 'Text');
        const unsafe: { code: string; severity: string }[] = [];
        const unsafeRuns = createFontResolver(
          { hasGlyph: (family: string) => (family === 'Courier New' ? 'supported' : 'missing') },
          root,
          0,
          unsafe,
        )(element, 'iiiiii');
        return {
          missing,
          unsafe,
          unknownRuns,
          unsafeRuns,
          languages: [...root.querySelectorAll('span')].map((node) => authorLanguage(node, root)),
        };
      } finally {
        root.remove();
      }
    },
    `/@fs/${path.join(coreRoot, 'src/app/lib/pptx/fonts.ts')}`,
  );
  expect(
    result.missing.some(
      (entry) => entry.code === 'font-coverage-unknown' && entry.severity === 'error',
    ),
  ).toBe(true);
  expect(
    result.unsafe.some(
      (entry) => entry.code === 'font-substitution-layout' && entry.severity === 'error',
    ),
  ).toBe(true);
  expect(result.unsafeRuns[0].fontResolutions[0].layout.status).toBe('unsafe');
  expect(result.languages).toEqual(['ja', null]);
});

test('preserves DOM advances for tabular digits without stale canvas font state', async ({
  page,
}) => {
  await openSlide(page, 'alpha');
  const result = await page.evaluate(
    async (base) => {
      const { createFontResolver } = await import(`${base}/fonts.ts`);
      const { createGlyphProbe } = await import(`${base}/font-probe.ts`);
      const { sourceAdvance, px, trackingCount } = await import(`${base}/style.ts`);
      const root = document.createElement('div');
      root.innerHTML =
        '<span style="font-family:system-ui; font-variant-numeric:tabular-nums; font-size:22px; letter-spacing:-0.08px; white-space:pre">01 / 16</span>';
      document.body.append(root);
      const probe = await createGlyphProbe('01 / 16', new AbortController().signal);
      try {
        const element = root.firstElementChild as HTMLElement;
        const diagnostics: { severity: string }[] = [];
        const runs = createFontResolver(probe, root, 0, diagnostics)(element, element.textContent);
        const canvas = document.createElement('canvas').getContext('2d');
        if (!canvas) throw new Error('Canvas is unavailable');
        const targetWidth = runs.reduce(
          (width: number, run: { fontFace: string; text: string; letterSpacing: number }) => {
            canvas.font = `22px "${run.fontFace}"`;
            return (
              width +
              canvas.measureText(run.text).width +
              Array.from(run.text).length * run.letterSpacing
            );
          },
          0,
        );
        return {
          diagnostics,
          sourceWidth: element.getBoundingClientRect().width,
          directSourceWidth:
            sourceAdvance(element, element.textContent, canvas) +
            trackingCount(element.textContent) * px(getComputedStyle(element).letterSpacing),
          numericVariant: getComputedStyle(element).fontVariantNumeric,
          variantShorthand: getComputedStyle(element).fontVariant,
          targetWidth,
          runs,
        };
      } finally {
        probe.dispose();
        root.remove();
      }
    },
    `/@fs/${path.join(coreRoot, 'src/app/lib/pptx')}`,
  );
  expect(result.diagnostics.filter((entry) => entry.severity === 'error')).toEqual([]);
  expect(
    result.runs.every((run: { fontResolutions: { layout: { status: string } }[] }) =>
      run.fontResolutions.every((font) => font.layout.status === 'safe'),
    ),
  ).toBe(true);
  expect(Math.abs(result.targetWidth - result.sourceWidth)).toBeLessThan(0.5);
  expect(result.numericVariant).toBe('tabular-nums');
  expect(Math.abs(result.directSourceWidth - result.sourceWidth)).toBeLessThan(0.02);
});

test('blocks unverified glyph features and rejects invalid canvas font assignments', async ({
  page,
}) => {
  await openSlide(page, 'alpha');
  const result = await page.evaluate(
    async (base) => {
      const { createFontResolver } = await import(`${base}/fonts.ts`);
      const { createGlyphProbe } = await import(`${base}/font-probe.ts`);
      const { setCanvasFont } = await import(`${base}/style.ts`);
      const root = document.createElement('div');
      document.body.append(root);
      const probe = await createGlyphProbe('Abc123', new AbortController().signal);
      try {
        const errors = [];
        for (const style of [
          'font-variant-caps:small-caps',
          'font-variation-settings:"wght" 550',
          'font-feature-settings:"sups" 1',
          'font-variant-position:super',
          'font-variant-alternates:historical-forms',
          'font-kerning:none',
          'font-optical-sizing:none',
          'font-synthesis:none',
        ]) {
          root.innerHTML = `<span style='font:32px Arial; ${style}'>Abc123</span>`;
          const diagnostics: { severity: string; code: string }[] = [];
          createFontResolver(probe, root, 0, diagnostics)(root.firstElementChild, 'Abc123');
          errors.push(
            diagnostics.filter((item) => item.severity === 'error').map((item) => item.code),
          );
        }
        const canvas = document.createElement('canvas').getContext('2d');
        let rejected = false;
        try {
          setCanvasFont(canvas, 'this is not a CSS font');
        } catch {
          rejected = true;
        }
        return { errors, rejected };
      } finally {
        probe.dispose();
        root.remove();
      }
    },
    `/@fs/${path.join(coreRoot, 'src/app/lib/pptx')}`,
  );
  expect(result.errors).toHaveLength(8);
  for (const errors of result.errors) expect(errors).toContain('unsupported-font-features');
  expect(result.rejected).toBe(true);
});

test('measures source OpenType outlines on an attached canvas and clears target features', async ({
  page,
}) => {
  await openSlide(page, 'alpha');
  const result = await page.evaluate(
    async (base) => {
      const { withCanvasTextStyle, setCanvasFont } = await import(`${base}/style.ts`);
      const element = document.createElement('span');
      element.style.cssText =
        'font:40px system-ui;font-feature-settings:"sups" 1;letter-spacing:0;display:inline-block';
      element.textContent = '1111 a 2345';
      document.body.append(element);
      const canvas = document.createElement('canvas').getContext('2d');
      if (!canvas) throw new Error('Canvas is unavailable');
      const measure = () => {
        setCanvasFont(canvas, '40px system-ui');
        const metrics = canvas.measureText(element.textContent ?? '');
        return {
          width: metrics.width,
          ascent: metrics.actualBoundingBoxAscent,
          descent: metrics.actualBoundingBoxDescent,
        };
      };
      try {
        const source = withCanvasTextStyle(canvas, getComputedStyle(element), '', measure);
        const target = withCanvasTextStyle(canvas, null, '', measure);
        try {
          withCanvasTextStyle(canvas, getComputedStyle(element), '', () => {
            throw new Error('probe failure');
          });
        } catch {
          /* expected cleanup */
        }
        return {
          source,
          target,
          domWidth: element.getBoundingClientRect().width,
          connected: canvas.canvas.isConnected,
        };
      } finally {
        element.remove();
      }
    },
    `/@fs/${path.join(coreRoot, 'src/app/lib/pptx')}`,
  );
  expect(Math.abs(result.source.width - result.domWidth)).toBeLessThan(0.5);
  expect(result.target.width - result.source.width).toBeGreaterThan(30);
  expect(
    result.source.ascent !== result.target.ascent ||
      result.source.descent !== result.target.descent,
  ).toBe(true);
  expect(result.connected).toBe(false);
});
