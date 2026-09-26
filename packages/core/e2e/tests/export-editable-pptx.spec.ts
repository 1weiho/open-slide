import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';
import { coreRoot, deleteSlide, duplicateSlide, openSlide, slideSourcePath } from './helpers';

const slideId = 'editable-pptx-new-deck';
const source = `import React from 'react';
import { Steps, Step, useSlidePageNumber, useIsActivePage } from '@open-slide/core';
export const FixtureReact = React;
export const meta = { title: 'New editable deck' };
export const notes = ['第一頁 notes\\nKeep line two.', '第二頁 notes'];
const Frame = ({children}) => <section lang="zh-Hant" style={{width:'100%',height:'100%',padding:80,background:'#fff',fontFamily:'Arial',fontSize:36}}>{children}</section>;
const One = () => <Frame><h1 style={{fontSize:72}}>可編輯 <strong style={{color:'#f00',letterSpacing:-2}}>Mixed text</strong></h1><ol start={3} style={{listStyle:'decimal',paddingLeft:50}}><li>Third item</li><li>Fourth item</li></ol><table style={{width:1000,borderCollapse:'collapse'}}><tbody><tr><th style={{border:'2px solid #333',padding:12}}>欄一</th><th style={{border:'2px solid #333',padding:12}}>Column two</th></tr><tr><td style={{border:'2px solid #333',padding:12}}>甲</td><td style={{border:'2px solid #333',padding:12}}>42</td></tr></tbody></table><a href="https://example.com/export">Link preserved</a></Frame>;
const Two = () => {const {current,total}=useSlidePageNumber();const active=useIsActivePage();const [value,setValue]=React.useState(94.5);React.useEffect(()=>{if(active)setValue(0)},[active]);return <Frame><h1>Page {current} / {total}</h1><p>Final amount: {value}</p>{active&&<button>Replay animation</button>}<input type="range" min="0" max="200" defaultValue="110" style={{width:320,height:30,accentColor:'#1234ab'}}/><Steps><Step><p>First reveal</p></Step><Step><p>Final reveal</p></Step></Steps><div style={{width:400,height:120,background:'#dbf0ff',borderRadius:24,border:'2px solid #05c'}}>Move this shape</div></Frame>};
export default [One,Two];`;
const exporterUrl = `/@fs/${path.join(coreRoot, 'src/app/lib/export-editable-pptx.ts')}`;
const captureUrl = `/@fs/${path.join(coreRoot, 'src/app/lib/pptx/capture.ts')}`;
const extractUrl = `/@fs/${path.join(coreRoot, 'src/app/lib/pptx/extract.ts')}`;
const moduleUrl = `/@fs/${slideSourcePath(slideId)}`;

test.beforeEach(async ({ request, page }) => {
  await duplicateSlide(request, 'alpha', slideId);
  await fs.writeFile(slideSourcePath(slideId), source);
  await openSlide(page, slideId);
});
test.afterEach(async ({ request, page }) => {
  await page.goto('about:blank');
  await deleteSlide(request, slideId);
});

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`exports a new two-page deck with editable objects (${reducedMotion})`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion });
    const before = await page.locator('main[data-inspector-root]').innerText();
    const result = await page.evaluate(
      async ({ exporterUrl, moduleUrl, slideId }) => {
        const { exportSlideAsEditablePptx } = await import(exporterUrl);
        const slide = await import(moduleUrl);
        const { blob, report } = await exportSlideAsEditablePptx(slide, slideId).catch(
          (error: { diagnostics: unknown }) => {
            throw new Error(JSON.stringify(error.diagnostics));
          },
        );
        return {
          bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
          report,
          hosts: document.querySelectorAll('[data-osd-pptx-capture]').length,
        };
      },
      { exporterUrl, moduleUrl, slideId },
    );
    expect(result.hosts).toBe(0);
    expect(result.report.pages).toHaveLength(2);
    expect(
      result.report.diagnostics.filter((entry: { severity: string }) => entry.severity === 'error'),
    ).toEqual([]);
    expect(await page.locator('main[data-inspector-root]').innerText()).toBe(before);
    const data = Uint8Array.from(result.bytes);
    await fs.writeFile(testInfo.outputPath('editable-new-deck.pptx'), data);
    const zip = unzipSync(data);
    for (const [name, bytes] of Object.entries(zip)) {
      if (!/^ppt\/slides\/slide\d+\.xml$/.test(name)) continue;
      const xml = strFromU8(bytes);
      const rels = strFromU8(zip[`${name.replace('slides/', 'slides/_rels/')}.rels`]);
      const ids = new Set(Array.from(rels.matchAll(/ Id="([^"]+)"/g), (match) => match[1]));
      for (const match of xml.matchAll(/ r:(?:id|embed|link)="([^"]+)"/g))
        expect(ids.has(match[1]), `${name}: unresolved ${match[1]}`).toBe(true);
      for (const match of xml.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)) {
        expect(
          (match[1].match(/<a:pPr[ >]/g) ?? []).length,
          `${name}: duplicate paragraph properties`,
        ).toBeLessThanOrEqual(1);
        if (match[1].includes('<a:pPr')) expect(match[1].startsWith('<a:pPr')).toBe(true);
      }
    }
    const one = strFromU8(zip['ppt/slides/slide1.xml']);
    const two = strFromU8(zip['ppt/slides/slide2.xml']);
    expect(one).toContain('<a:tbl>');
    expect(one).toContain('Mixed text');
    expect(one).toContain('可編輯');
    expect(one).toContain('startAt="3"');
    expect(one).toContain('startAt="4"');
    expect(one).toContain('spc="-100"');
    expect(one).not.toContain('<p:pic>');
    expect(two).toContain('Final reveal');
    expect(two).toContain('Move this shape');
    expect(two).toContain('94.5');
    expect(two).not.toContain('Replay animation');
    expect(two).not.toContain('<a:t>110</a:t>');
    expect(two).toContain('1234AB');
    expect(two).toContain('prst="ellipse"');
    expect(strFromU8(zip['ppt/notesSlides/notesSlide1.xml'])).toContain('第一頁 notes');
    expect(strFromU8(zip['ppt/notesSlides/notesSlide2.xml'])).toContain('第二頁 notes');
    expect(strFromU8(zip['ppt/slides/_rels/slide1.xml.rels'])).toContain(
      'https://example.com/export',
    );
  });
}

test('preserves measured soft breaks, explicit breaks, and missing-font fallback', async ({
  page,
}, testInfo) => {
  const result = await page.evaluate(
    async ({ captureUrl, extractUrl, exporterUrl, moduleUrl }) => {
      const [{ capturePage }, { extractPage }, { exportSlideAsEditablePptx }] = await Promise.all([
        import(captureUrl),
        import(extractUrl),
        import(exporterUrl),
      ]);
      const React = (await import(moduleUrl)).FixtureReact;
      const Typography = () =>
        React.createElement(
          'section',
          {
            style: {
              width: '100%',
              height: '100%',
              padding: 80,
              fontFamily: '"OpenSlideMissingFont", monospace',
              fontSize: 42,
              lineHeight: '48px',
            },
          },
          React.createElement(
            'p',
            { style: { width: 320, margin: 0 } },
            'Narrow CJK English ',
            React.createElement(
              'strong',
              { style: { fontFamily: '"OpenSlideOtherMissingFont", monospace' } },
              '混合字型 Mixed',
            ),
            ' wraps across this long paragraph with browser measured lines.',
          ),
          React.createElement(
            'p',
            { style: { width: 320, margin: '48px 0 0' } },
            'Explicit',
            React.createElement('br'),
            'line break with ',
            React.createElement('em', null, 'rich run'),
            ' stays grouped.',
          ),
        );
      const slide = { default: [Typography] };
      const signal = new AbortController().signal;
      const captured = await capturePage(slide, 0, signal, 20_000);
      const extracted = await (async () => {
        try {
          return await extractPage(captured.host, 0, signal);
        } finally {
          captured.dispose();
        }
      })();
      const { blob, report } = await exportSlideAsEditablePptx(slide, 'typography');
      return {
        bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
        extracted,
        report,
      };
    },
    { captureUrl, extractUrl, exporterUrl, moduleUrl },
  );

  const textObjects = result.extracted.objects.filter(
    (object: { kind: string }) => object.kind === 'text',
  );
  expect(textObjects).toHaveLength(2);
  expect(result.report.pages[0]).toMatchObject({ objects: 2, text: 2, tables: 0, images: 0 });

  const firstRuns = textObjects[0].paragraphs[0].runs;
  const firstText = firstRuns.map((run: { text: string }) => run.text).join('');
  const firstTextWithoutSoftBreaks = firstText.replace(/\n/g, ' ');
  expect(firstTextWithoutSoftBreaks).toContain('Narrow CJK English');
  expect(firstText).toContain('混合');
  expect(firstText).toContain('字型 Mixed');
  expect(
    firstRuns.some((run: { bold: boolean; text: string }) => run.bold && run.text.includes('混合')),
  ).toBe(true);
  expect((firstText.match(/\n/g) ?? []).length).toBeGreaterThan(0);
  expect(
    firstRuns
      .filter((run: { text: string }) => /[A-Za-z]/.test(run.text))
      .every((run: { fontFace: string }) => run.fontFace === 'Courier New'),
  ).toBe(true);
  expect(
    firstRuns
      .filter((run: { text: string }) => /\p{Script=Han}/u.test(run.text))
      .every(
        (run: {
          eastAsianFontFace?: string;
          fontResolutions?: { script: string; coverage: string }[];
        }) =>
          Boolean(run.eastAsianFontFace) &&
          run.fontResolutions?.some(
            (font) => font.script === 'eastAsian' && font.coverage === 'supported',
          ),
      ),
  ).toBe(true);

  const secondRuns = textObjects[1].paragraphs[0].runs;
  const secondText = secondRuns.map((run: { text: string }) => run.text).join('');
  const secondTextWithoutSoftBreaks = secondText.replace(/\n/g, ' ');
  expect(secondTextWithoutSoftBreaks).toContain('Explicit');
  expect(secondTextWithoutSoftBreaks).toContain('line break');
  expect(secondRuns.some((run: { text: string }) => run.text === '\n')).toBe(true);
  expect(secondRuns.length).toBeGreaterThan(2);

  const data = Uint8Array.from(result.bytes);
  await fs.writeFile(testInfo.outputPath('typography.pptx'), data);
  const zip = unzipSync(data);
  const xml = strFromU8(zip['ppt/slides/slide1.xml']);
  expect(xml).toContain('typeface="Courier New"');
  expect((xml.match(/<a:br\s*\/>/g) ?? []).length).toBeGreaterThan(0);
  expect(xml).toContain('Explicit');
  expect(xml).toContain('line break');
});

test('reports unsupported content and releases capture roots', async ({ page }) => {
  const result = await page.evaluate(
    async ({ exporterUrl, moduleUrl }) => {
      const { exportSlideAsEditablePptx } = await import(exporterUrl);
      const React = (await import(moduleUrl)).FixtureReact;
      const Unsupported = () => React.createElement('canvas', { width: 200, height: 100 });
      try {
        await exportSlideAsEditablePptx({ default: [Unsupported] }, 'unsupported');
      } catch (error) {
        const failure = error as { diagnostics: { code: string }[] };
        return {
          codes: failure.diagnostics.map((entry) => entry.code),
          hosts: document.querySelectorAll('[data-osd-pptx-capture]').length,
        };
      }
      return { codes: [], hosts: -1 };
    },
    { exporterUrl, moduleUrl },
  );
  expect(result.codes).toContain('unsupported-element');
  expect(result.hosts).toBe(0);
});

test('reports a writer worker failure with an actionable deck diagnostic', async ({ page }) => {
  const result = await page.evaluate(
    async ({ exporterUrl, moduleUrl, slideId }) => {
      const browser = window as unknown as { Worker: typeof Worker };
      const OriginalWorker = browser.Worker;
      let terminated = 0;
      class FailingWorker {
        onerror: ((event: { message: string }) => void) | null = null;
        onmessage: ((event: { data: unknown }) => void) | null = null;
        onmessageerror: (() => void) | null = null;

        constructor() {
          queueMicrotask(() => this.onerror?.({ message: 'fixture writer failed' }));
        }

        postMessage() {}

        terminate() {
          terminated += 1;
        }
      }
      browser.Worker = FailingWorker as unknown as typeof Worker;
      try {
        const { exportSlideAsEditablePptx } = await import(exporterUrl);
        const slide = await import(moduleUrl);
        await exportSlideAsEditablePptx(slide, slideId, { pageIndices: [0] });
        return { name: 'resolved', diagnostics: [], terminated };
      } catch (error) {
        const failure = error as {
          name: string;
          diagnostics?: { code: string; page: number; source: string; suggestion: string }[];
        };
        return { name: failure.name, diagnostics: failure.diagnostics ?? [], terminated };
      } finally {
        browser.Worker = OriginalWorker;
      }
    },
    { exporterUrl, moduleUrl, slideId },
  );
  expect(result.name).toBe('EditablePptxError');
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      code: 'writer-error',
      page: 0,
      source: 'deck',
      suggestion: expect.stringContaining('Retry'),
    }),
  ]);
  expect(result.terminated).toBe(1);
});

test('cancels preparation and generation without leaving hidden roots', async ({ page }) => {
  const result = await page.evaluate(
    async ({ exporterUrl, moduleUrl, slideId }) => {
      const { exportSlideAsEditablePptx } = await import(exporterUrl);
      const slide = await import(moduleUrl);
      const names: string[] = [];
      for (const phase of ['preparing', 'generating']) {
        const controller = new AbortController();
        try {
          await exportSlideAsEditablePptx(slide, slideId, {
            signal: controller.signal,
            onProgress: (progress: { phase: string }) => {
              if (progress.phase === phase) controller.abort();
            },
          });
        } catch (error) {
          names.push((error as Error).name);
        }
      }
      return { names, hosts: document.querySelectorAll('[data-osd-pptx-capture]').length };
    },
    { exporterUrl, moduleUrl, slideId },
  );
  expect(result.names).toEqual(['AbortError', 'AbortError']);
  expect(result.hosts).toBe(0);
});

test('times out unresolved readiness and cleans the page', async ({ page }) => {
  const result = await page.evaluate(
    async ({ exporterUrl, moduleUrl }) => {
      const { exportSlideAsEditablePptx } = await import(exporterUrl);
      const React = (await import(moduleUrl)).FixtureReact;
      const Waiting = () => React.createElement('div', { 'data-waitfor': '.missing' }, 'Waiting');
      try {
        await exportSlideAsEditablePptx({ default: [Waiting] }, 'waiting', { pageTimeoutMs: 100 });
      } catch (error) {
        return {
          codes: (error as { diagnostics: { code: string }[] }).diagnostics.map(
            (entry) => entry.code,
          ),
          hosts: document.querySelectorAll('[data-osd-pptx-capture]').length,
        };
      }
      return { codes: [], hosts: -1 };
    },
    { exporterUrl, moduleUrl },
  );
  expect(result.codes).toContain('readiness-timeout');
  expect(result.hosts).toBe(0);
});
