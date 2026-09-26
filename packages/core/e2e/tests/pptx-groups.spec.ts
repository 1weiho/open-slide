import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';
import { coreRoot, deleteSlide, duplicateSlide, openSlide, slideSourcePath } from './helpers';

const slideId = 'group-pilot-new-deck';
const source = `import React from 'react';
export const FixtureReact=React;
export const meta={title:'Group pilot'};
export const notes=['Preserve grouping notes https://example.com'];
export default [()=> <section style={{width:'100%',height:'100%',background:'#fff',fontFamily:'Arial',fontSize:32}}>
  <div data-osd-pptx-group="card" style={{position:'absolute',left:90,top:90,width:700,height:300,background:'#eaf3fa',borderRadius:24,boxShadow:'8px 10px 16px #3455',padding:30}}>
    <div data-osd-pptx-group="label"><svg width="40" height="40" viewBox="0 0 40 40"><path d="M0 0 L40 0 L40 40 Z" fill="#258"/><path d="M0 0 L0 40 L40 40 Z" fill="#58b"/></svg><span>Native nested label</span></div>
    <p><a href="https://example.com">Card text and link</a></p>
  </div>
  <div data-osd-pptx-group="table-card" style={{position:'absolute',left:900,top:100,width:700,height:240,background:'#faf2e0',padding:20}}>
    <table style={{width:600,borderCollapse:'collapse'}}><tbody><tr><td style={{border:'1px solid #000',padding:12}}>Cell one</td><td style={{border:'1px solid #000',padding:12}}>Cell two</td></tr></tbody></table>
  </div>
  <div style={{position:'absolute',left:100,top:650,width:600,height:200,background:'radial-gradient(ellipse at 30% 40%,#79b,#eee)'}}>Automatic source group</div>
</section>];`;

test('groups explicit cards and same-source vectors while leaving tables native', async ({
  page,
  request,
}, testInfo) => {
  await duplicateSlide(request, 'alpha', slideId);
  try {
    await fs.writeFile(slideSourcePath(slideId), source);
    await openSlide(page, slideId);
    const result = await page.evaluate(
      async ({ moduleUrl, exporterUrl }) => {
        const slide = await import(moduleUrl);
        const { exportSlideAsEditablePptx } = await import(exporterUrl);
        const { blob, report } = await exportSlideAsEditablePptx(slide, 'group-pilot-new-deck');
        return {
          bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
          report,
          roots: document.querySelectorAll('[data-osd-pptx-capture]').length,
        };
      },
      {
        moduleUrl: `/@fs/${slideSourcePath(slideId)}`,
        exporterUrl: `/@fs/${path.join(coreRoot, 'src/app/lib/export-editable-pptx.ts')}`,
      },
    );
    const bytes = Uint8Array.from(result.bytes);
    await fs.writeFile(testInfo.outputPath('groups.pptx'), bytes);
    const zip = unzipSync(bytes);
    const xml = strFromU8(zip['ppt/slides/slide1.xml']);
    expect(result.roots).toBe(0);
    expect(
      result.report.diagnostics.filter((entry: { severity: string }) => entry.severity === 'error'),
    ).toEqual([]);
    expect(
      result.report.diagnostics.some(
        (entry: { code: string }) => entry.code === 'group-skipped-table',
      ),
    ).toBe(true);
    expect(xml).toContain('<a:tbl>');
    expect(xml).toContain('<p:grpSp>');
    expect(xml).toContain('Native nested label');
    expect(xml).toContain('Automatic source group');
    expect(xml).not.toContain('<p:pic>');
    expect(result.report.quality.totals.groupContainers).toBe(
      (xml.match(/<p:grpSp>/g) ?? []).length,
    );
    expect(result.report.quality.totals.nativeLeafObjects).toBe(
      (xml.match(/<p:(?:sp|graphicFrame|pic)>/g) ?? []).length,
    );
    expect(result.report.quality.totals.vectorApproximationSources).toBe(2);
    expect(result.report.quality.totals.sourceImages).toBe(0);
  } finally {
    await page.goto('about:blank');
    await deleteSlide(request, slideId);
  }
});
