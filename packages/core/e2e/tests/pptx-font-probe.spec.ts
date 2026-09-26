import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';
import { coreRoot, deleteSlide, duplicateSlide, openSlide, slideSourcePath } from './helpers';

// Self-authored test font: its cmap contains only A, with a plain square outline.
const partialFont =
  'AAEAAAAKAIAAAwAgT1MvMjjHWvcAAACsAAAATmNtYXAADwC3AAAA/AAAAChnbHlmELUTwgAAASQAAABmaGVhZGJSRBoAAAGMAAAANmhoZWEGugLeAAABxAAAACRobXR4CowAlgAAAegAAAAMbG9jYQAAAMwAAAH0AAAAEG1heHAABQAGAAACBAAAACBuYW1lEbAi1wAAAiQAAADscG9zdP+fADIAAAMQAAAAIAAAAfQBkAAFAAACigCWAAAAAAKKAJYAAAK8ASwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABPUy8yAAAAIAD/AyD/OAAAAzQA3AAAAAAAAQADAAoAAAAMAAwAAAAAABwAAAAAAAAAAQAAAEEAAABBAAAAAQABAGQAZAK8ArwAAwAAAQEBAQBkAAACWAAAAGQCWAAA/agAAQCCAIIDAgMCAAMAAAEBAQEAggAAAoAAAACCAoAAAP2AAAEAeACMAvgC+AADAAABAQEBAHgAAAKAAAAAjAJsAAD9lAAAAAEAAAABAAAIqOPLXw889QALA+gAAAAAAAAAAAAAAAAAAAAAAAAAAAM0AzQAAAAIAAIAAQAAAAAAAQAAAzT/JAAAA4QAMgAyA1IAAQAAAAAAAAAAAAAAAAAAAAMDhAAyA4QAMgOEADIAAAAAAAAAIgAAAEQAAABmAAEAAAADAAQAAQAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAEADYAAwABBAkAAQA6AAAAAwABBAkAAgAOADoAAwABBAkABAA6AEgAAwABBAkABgA0AIIATwBwAGUAbgBTAGwAaQBkAGUAIABQAHIAbwBiAGUAIABQAGEAcgB0AGkAYQBsACAATABhAHQAaQBuAFIAZQBnAHUAbABhAHIATwBwAGUAbgBTAGwAaQBkAGUAIABQAHIAbwBiAGUAIABQAGEAcgB0AGkAYQBsACAATABhAHQAaQBuAE8AcABlAG4AUwBsAGkAZABlAFAAcgBvAGIAZQBQAGEAcgB0AGkAYQBsAEwAYQB0AGkAbgADAAAAAAAA/5wAMgAAAAAAAAAAAAAAAAAAAAAAAAAA';

test('proves coverage against fallback and cleans up temporary faces on dispose and abort', async ({
  page,
}) => {
  await openSlide(page, 'alpha');
  const result = await page.evaluate(
    async ({ moduleUrl, partialFont }) => {
      const { createGlyphProbe } = await import(moduleUrl);
      const face = new FontFace(
        'PptxPartialCoverageFixture',
        Uint8Array.from(atob(partialFont), (c) => c.charCodeAt(0)),
      );
      await face.load();
      document.fonts.add(face);
      const before = document.fonts.size;
      try {
        const probe = await createGlyphProbe('A漢😀⚠️⚠︎');
        const results = {
          latin: probe.hasGlyph(face.family, 'A'),
          han: probe.hasGlyph(face.family, '漢'),
          absent: probe.hasGlyph('PptxAbsentFont2026', 'A'),
          arial: probe.hasGlyph('Arial', 'A'),
          cached: probe.hasGlyph('Arial', 'A'),
          outside: probe.hasGlyph('Arial', 'B'),
          complex: probe.hasGlyph('Arial', 'A\u0301'),
          emojiVariant: probe.hasGlyph('Apple Color Emoji', '⚠️'),
          missingVariant: probe.hasGlyph(face.family, '⚠️'),
          absentVariant: probe.hasGlyph('PptxAbsentFont2026', '⚠️'),
        };
        probe.dispose();
        const after = document.fonts.size;
        const disposed = probe.hasGlyph('Arial', 'A');
        const controller = new AbortController();
        const pending = createGlyphProbe('A', controller.signal);
        controller.abort();
        let abortName = '';
        try {
          await pending;
        } catch (error) {
          abortName = (error as Error).name;
        }
        return { results, before, after, afterAbort: document.fonts.size, disposed, abortName };
      } finally {
        document.fonts.delete(face);
      }
    },
    { moduleUrl: `/@fs/${path.join(coreRoot, 'src/app/lib/pptx/font-probe.ts')}`, partialFont },
  );
  expect(result.results).toEqual({
    latin: 'supported',
    han: 'missing',
    absent: 'missing',
    arial: 'supported',
    cached: 'supported',
    outside: 'unknown',
    complex: 'unknown',
    emojiVariant: 'supported',
    missingVariant: 'missing',
    absentVariant: 'missing',
  });
  expect(result.after).toBe(result.before);
  expect(result.afterAbort).toBe(result.before);
  expect(result.disposed).toBe('unknown');
  expect(result.abortName).toBe('AbortError');
});

test('preserves a browser-only author font and reports recipient availability as unknown', async ({
  page,
  request,
}, testInfo) => {
  const id = 'browser-only-font';
  await duplicateSlide(request, 'alpha', id);
  try {
    await fs.writeFile(
      slideSourcePath(id),
      `import React from 'react';
export const FixtureReact = React;
export const meta={title:'Browser-only font control'};
export const notes=['The square is the source glyph A in a self-authored browser-only font. PowerPoint lacks this face; compare its replacement on opening.'];
export default [()=> <section lang="en" style={{width:'100%',height:'100%',padding:100,background:'#fff',color:'#111',fontFamily:'Arial',fontSize:36}}><h1>Browser-only font control</h1><p>Source character A uses a square glyph. The font is not embedded.</p><p style={{fontFamily:'PptxBrowserOnlyFixture',fontSize:120}}>A</p></section>];`,
    );
    await openSlide(page, id);
    const result = await page.evaluate(
      async ({ partialFont, moduleUrl, exporterUrl }) => {
        const face = new FontFace(
          'PptxBrowserOnlyFixture',
          Uint8Array.from(atob(partialFont), (c) => c.charCodeAt(0)),
        );
        await face.load();
        document.fonts.add(face);
        try {
          const { exportSlideAsEditablePptx } = await import(exporterUrl);
          const { blob, report } = await exportSlideAsEditablePptx(
            await import(moduleUrl),
            'browser-only-font',
          );
          return { bytes: Array.from(new Uint8Array(await blob.arrayBuffer())), report };
        } finally {
          document.fonts.delete(face);
        }
      },
      {
        partialFont,
        moduleUrl: `/@fs/${slideSourcePath(id)}`,
        exporterUrl: `/@fs/${path.join(coreRoot, 'src/app/lib/export-editable-pptx.ts')}`,
      },
    );
    await fs.writeFile(
      testInfo.outputPath('browser-only-font.pptx'),
      Uint8Array.from(result.bytes),
    );
    await fs.writeFile(
      testInfo.outputPath('browser-only-font.report.json'),
      JSON.stringify(result.report, null, 2),
    );
    const xml = strFromU8(unzipSync(Uint8Array.from(result.bytes))['ppt/slides/slide1.xml']);
    expect(xml).toContain('typeface="PptxBrowserOnlyFixture"');
    expect(xml).toContain('<a:t>A</a:t>');
    expect(
      result.report.quality.fonts.some(
        (font: { resolved: string; coverage: string; substituted: boolean }) =>
          font.resolved === 'PptxBrowserOnlyFixture' &&
          font.coverage === 'supported' &&
          !font.substituted,
      ),
    ).toBe(true);
    expect(result.report.quality.recipientFonts).toBe('unknown');
  } finally {
    await page.goto('about:blank');
    await deleteSlide(request, id);
  }
});
