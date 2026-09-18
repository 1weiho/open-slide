import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';
import { coreRoot, deleteSlide, duplicateSlide, openSlide, slideSourcePath } from './helpers';

const slideId = 'pptx-native-css-fixture';
const exporterUrl = `/@fs/${path.join(coreRoot, 'src/app/lib/export-editable-pptx.ts')}`;
const moduleUrl = `/@fs/${slideSourcePath(slideId)}`;
const source = `import React from 'react';
export const FixtureReact = React;
export const meta = { title: 'Renamed native CSS fixture' };
const Frame = ({ children }) => <section style={{position:'relative',width:'100%',height:'100%',boxSizing:'border-box',padding:40,background:'#fff',fontFamily:'Arial',fontSize:24,color:'#111'}}>{children}</section>;
const pseudoCss = '.pseudo-box::before{content:"BEFORE";display:block;position:absolute;left:0;top:0;width:120px;height:32px;background:#ff6600;color:#fff;font:20px Arial}.pseudo-box::after{content:"AFTER";display:block;position:absolute;right:0;bottom:0;width:90px;height:32px;background:#0066ff;color:#fff;font:20px Arial}';
const EffectsPage = () => <Frame>
  <style>{pseudoCss}</style>
  <h1>Native effects page <span style={{background:'linear-gradient(90deg,#2355e8,#ed2182)',backgroundClip:'text',WebkitBackgroundClip:'text',color:'transparent'}}>Gradient heading</span></h1>
  <div style={{position:'absolute',left:80,top:120,width:340,height:150,background:'linear-gradient(135deg, #f04444 0%, #2176d2 100%)',boxShadow:'8px 10px 4px rgba(0,0,0,0.35), -5px 4px 0 rgba(0,80,200,0.6)'}} />
  <div className="pseudo-box" style={{position:'absolute',left:80,top:310,width:360,height:90,background:'#eeeeee'}}>Pseudo host</div>
  <svg width="300" height="170" viewBox="0 0 300 170" style={{position:'absolute',left:520,top:80,transform:'rotate(180deg)',transformOrigin:'center'}}>
    <path d="M 12 16 l 90 0 m 24 30 c 24 44 52 -22 116 26 l 30 34 z" fill="#20a060" stroke="#123456" strokeWidth="4" />
  </svg>
  <div style={{position:'absolute',left:-48,top:470,width:190,height:110,borderRadius:'50%',background:'#ffcc00'}} />
  <div data-pptx-shadow="ellipse" style={{position:'absolute',left:80,top:600,width:190,height:110,borderRadius:'50%',background:'#ffd400',boxShadow:'0 0 0 12px rgba(230,0,0,0.8)'}} />
  <div data-pptx-shadow="roundRect" style={{position:'absolute',left:360,top:600,width:190,height:110,borderRadius:'24px',background:'#00cc88',boxShadow:'0 0 0 12px rgba(0,0,230,0.8)'}} />
  <div style={{position:'absolute',left:820,top:360,width:190,height:90,zIndex:1,background:'#d64545',color:'#fff',padding:18}}>z-low</div>
  <div style={{position:'absolute',left:850,top:390,width:190,height:90,zIndex:2,background:'#315dcc',color:'#fff',padding:18}}>z-high</div>
  <div style={{position:'absolute',left:520,top:450,width:160,height:45,borderBottom:'6px solid #225511',borderRadius:'0 0 999px 999px'}} />
</Frame>;
const GridPage = () => <Frame>
  <h1>Masked grid and image opacity</h1>
  <div style={{position:'absolute',left:80,top:120,width:320,height:190,backgroundImage:'linear-gradient(to right, #3a5a9a 0px, #3a5a9a 1px, transparent 1px, transparent 24px)',backgroundSize:'24px 24px',backgroundRepeat:'repeat',maskImage:'radial-gradient(ellipse at center, #000 60%, transparent 100%)'}} />
  <img alt="opacity source" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" style={{position:'absolute',left:520,top:140,width:180,height:120,opacity:0.42}} />
  <table style={{position:'absolute',left:800,top:600,width:700,borderCollapse:'collapse'}}><tbody><tr style={{background:'#f6edef'}}><td style={{width:500,padding:20}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span>Native model</span><span style={{background:'#083d77',color:'#fff',borderRadius:18,padding:'6px 12px'}}>Lowest</span></div></td><td style={{width:200,padding:20}}>11.25</td></tr></tbody></table>
</Frame>;
const RenamedTablePage = () => <Frame>
  <h1>Reordered marked table page</h1>
  <table data-osd-pptx="table" style={{position:'absolute',left:80,top:120,width:560,borderCollapse:'collapse',tableLayout:'fixed'}}><tbody>
    <tr data-osd-pptx="row" data-osd-pptx-row="0"><td data-osd-pptx="cell" data-osd-pptx-row="0" data-osd-pptx-col="0" style={{width:260,height:100,border:'2px solid #333',padding:12,verticalAlign:'top'}}>Wrapped <strong>bold</strong> rich text cell content that spans lines.</td><td data-osd-pptx="cell" data-osd-pptx-row="0" data-osd-pptx-col="1" style={{width:260,height:100,border:'2px solid #333',padding:12,verticalAlign:'middle'}}>Header <em>second</em> cell</td></tr>
    <tr data-osd-pptx="row" data-osd-pptx-row="1"><td data-osd-pptx="cell" data-osd-pptx-row="1" data-osd-pptx-col="0" style={{width:260,height:80,border:'2px solid #333',padding:12,verticalAlign:'bottom'}}>Row two first</td><td data-osd-pptx="cell" data-osd-pptx-row="1" data-osd-pptx-col="1" style={{width:260,height:80,border:'2px solid #333',padding:12,verticalAlign:'top'}}>Row two second</td></tr>
  </tbody></table>
</Frame>;
export default [EffectsPage, GridPage, RenamedTablePage];`;

type ExportResult = {
  bytes: number[];
  report: {
    pages: { index: number; objects: number; text: number; tables: number; images: number }[];
    diagnostics: { severity: string; code: string; message: string }[];
  };
  viewer: { url: string; text: string; generated: number; hosts: number };
};

async function exportFixture(page: Page, order = [0, 1, 2]): Promise<ExportResult> {
  return page.evaluate(
    async ({ exporterUrl, moduleUrl, slideId, order }) => {
      const { exportSlideAsEditablePptx } = await import(exporterUrl);
      const original = await import(moduleUrl);
      const slide = { ...original, default: order.map((index) => original.default[index]) };
      const before = {
        url: window.location.href,
        text: document.querySelector('main[data-inspector-root]')?.textContent ?? '',
      };
      const { blob, report } = await exportSlideAsEditablePptx(slide, slideId);
      return {
        bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
        report,
        viewer: {
          url: before.url,
          text: before.text,
          generated: document.querySelectorAll('[data-osd-pptx-generated]').length,
          hosts: document.querySelectorAll('[data-osd-pptx-capture]').length,
        },
      };
    },
    { exporterUrl, moduleUrl, slideId, order },
  );
}

function slideXml(bytes: number[], index: number): string {
  const zip = unzipSync(Uint8Array.from(bytes));
  return strFromU8(zip[`ppt/slides/slide${index}.xml`]);
}

function shapeBlocks(xml: string): string[] {
  return Array.from(xml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g), (match) => match[0]);
}

function pictureBlocks(xml: string): string[] {
  return Array.from(xml.matchAll(/<p:pic>[\s\S]*?<\/p:pic>/g), (match) => match[0]);
}

function shapeBounds(block: string): { x: number; y: number; w: number; h: number } {
  const match = /<a:off x="(-?\d+)" y="(-?\d+)"\s*\/><a:ext cx="(\d+)" cy="(\d+)"\s*\/>/.exec(
    block,
  );
  expect(match).not.toBeNull();
  return {
    x: Number(match?.[1]),
    y: Number(match?.[2]),
    w: Number(match?.[3]),
    h: Number(match?.[4]),
  };
}

function textOccurrences(xml: string, value: string): number {
  return xml.split(value).length - 1;
}

test.describe('editable PPTX native CSS export', () => {
  test.beforeEach(async ({ request, page }) => {
    await duplicateSlide(request, 'alpha', slideId);
    await fs.writeFile(slideSourcePath(slideId), source);
    await openSlide(page, slideId);
  });

  test.afterEach(async ({ request, page }) => {
    await page.goto('about:blank');
    await deleteSlide(request, slideId);
  });

  test('retains native effects, SVG paths, paint order, clipping and pseudos', async ({
    page,
  }, testInfo) => {
    const result = await exportFixture(page);
    const bytes = Uint8Array.from(result.bytes);
    await fs.writeFile(testInfo.outputPath('native-css-effects.pptx'), bytes);
    const xml = slideXml(result.bytes, 1);
    const shapes = shapeBlocks(xml);

    expect(result.report.pages).toHaveLength(3);
    expect(result.report.diagnostics.filter((entry) => entry.severity === 'error')).toEqual([]);
    expect(result.viewer.generated).toBe(0);
    expect(result.viewer.hosts).toBe(0);
    expect(await page.evaluate(() => window.location.href)).toBe(result.viewer.url);
    expect(await page.locator('main[data-inspector-root]').textContent()).toBe(result.viewer.text);
    expect(pictureBlocks(xml)).toHaveLength(0);
    expect((xml.match(/<a:gradFill\b/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect(xml).toContain('0050C8');
    expect(xml).toContain('000000');
    expect(
      shapes.filter((shape) => shape.includes('000000') && shape.includes('<a:custGeom')).length,
    ).toBeGreaterThanOrEqual(20);
    expect((xml.match(/<a:custGeom\b/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect((xml.match(/<a:cubicBezTo\b/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect((xml.match(/<a:moveTo\b/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(xml).toContain('BEFORE');
    expect(xml).toContain('AFTER');
    expect(xml).toContain('FF6600');
    expect(xml).toContain('0066FF');
    expect(shapes.find((shape) => shape.includes('Gradient heading'))).toMatch(
      /<a:rPr[^>]*>[\s\S]*?<a:gradFill/,
    );
    expect(
      shapes.some((shape) => shape.includes('225511') && shape.includes('<a:cubicBezTo>')),
    ).toBe(true);
    expect(xml).not.toMatch(/NaN|undefined/);
    for (const match of xml.matchAll(/<a:pt\s+x="([^"]+)"\s+y="([^"]+)"\s*\/>/g)) {
      expect(Number.isFinite(Number(match[1]))).toBe(true);
      expect(Number.isFinite(Number(match[2]))).toBe(true);
      expect(Number(match[1])).toBeGreaterThanOrEqual(0);
      expect(Number(match[2])).toBeGreaterThanOrEqual(0);
    }

    const low = shapes.findIndex((block) => block.includes('z-low'));
    const high = shapes.findIndex((block) => block.includes('z-high'));
    expect(low).toBeGreaterThanOrEqual(0);
    expect(high).toBeGreaterThan(low);
  });

  test('clips elliptical and rounded shadows outside the border box with CSS spread bounds', async ({
    page,
  }) => {
    const result = await exportFixture(page);
    const shapes = shapeBlocks(slideXml(result.bytes, 1));
    const ellipseShadow = shapes.find((block) => block.includes('E60000'));
    const ellipseFill = shapes.find((block) => block.includes('FFD400'));
    const roundShadow = shapes.find((block) => block.includes('0000E6'));
    const roundFill = shapes.find((block) => block.includes('00CC88'));

    expect(ellipseShadow).toBeDefined();
    expect(ellipseFill).toBeDefined();
    expect(roundShadow).toBeDefined();
    expect(roundFill).toBeDefined();
    expect(ellipseShadow).toContain('<a:custGeom');
    expect((ellipseShadow?.match(/<a:moveTo>/g) ?? []).length).toBeGreaterThan(4);
    expect(roundShadow).toContain('<a:custGeom');
    expect((roundShadow?.match(/<a:moveTo>/g) ?? []).length).toBeGreaterThan(4);

    const ellipseShadowBounds = shapeBounds(ellipseShadow as string);
    const ellipseFillBounds = shapeBounds(ellipseFill as string);
    const roundShadowBounds = shapeBounds(roundShadow as string);
    const roundFillBounds = shapeBounds(roundFill as string);
    const spread = 12 * 6350;
    expect(ellipseShadowBounds).toEqual({
      x: ellipseFillBounds.x - spread,
      y: ellipseFillBounds.y - spread,
      w: ellipseFillBounds.w + spread * 2,
      h: ellipseFillBounds.h + spread * 2,
    });
    expect(roundShadowBounds).toEqual({
      x: roundFillBounds.x - spread,
      y: roundFillBounds.y - spread,
      w: roundFillBounds.w + spread * 2,
      h: roundFillBounds.h + spread * 2,
    });
  });

  test('retains masked repeated gradients and image opacity in generated OOXML', async ({
    page,
  }, testInfo) => {
    const result = await exportFixture(page);
    await fs.writeFile(
      testInfo.outputPath('native-css-grid-opacity.pptx'),
      Uint8Array.from(result.bytes),
    );
    const xml = slideXml(result.bytes, 2);
    const pictures = pictureBlocks(xml);

    expect(result.report.pages[1]).toMatchObject({ index: 1, images: 1 });
    expect(result.report.diagnostics.filter((entry) => entry.severity === 'error')).toEqual([]);
    expect(pictures).toHaveLength(1);
    expect((xml.match(/<a:gradFill\b/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect((xml.match(/<a:gsLst\b/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect(pictures[0]).toMatch(/alphaModFix|<a:alpha\b[^>]*(?:val|amt)=/);
    expect(pictures[0]).toMatch(/(?:val|amt)="(?:42|42000|420000|58|58000|580000)"/);
  });

  test('exports a new fixture with one marked 2x2 rich-text table', async ({ page }, testInfo) => {
    const result = await exportFixture(page);
    await fs.writeFile(testInfo.outputPath('native-css-table.pptx'), Uint8Array.from(result.bytes));
    const xml = slideXml(result.bytes, 3);
    const paragraphs = Array.from(xml.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g), (match) => match[1]);

    expect(result.report.pages.map((page) => page.index)).toEqual([0, 1, 2]);
    expect(result.report.pages[2]).toMatchObject({ index: 2, tables: 1, images: 0 });
    expect(result.report.diagnostics.filter((entry) => entry.severity === 'error')).toEqual([]);
    expect((xml.match(/<a:tbl\b/g) ?? []).length).toBe(1);
    expect((xml.match(/<a:tc\b/g) ?? []).length).toBe(4);
    expect(textOccurrences(xml, 'Wrapped')).toBe(1);
    expect(textOccurrences(xml, 'bold')).toBe(1);
    expect(textOccurrences(xml, 'Row two second')).toBe(1);
    expect(xml).toMatch(/<a:rPr[^>]*\bb="1"/);
    expect(xml).toMatch(/<a:rPr[^>]*\bi="1"/);
    for (const paragraph of paragraphs) {
      expect((paragraph.match(/<a:pPr[ >]/g) ?? []).length).toBeLessThanOrEqual(1);
      if (paragraph.includes('<a:pPr')) expect(paragraph.startsWith('<a:pPr')).toBe(true);
    }
  });

  test('uses the current page order without registering the new deck', async ({ page }) => {
    const result = await exportFixture(page, [2, 0, 1]);
    expect(slideXml(result.bytes, 1)).toContain('Reordered marked table page');
    expect(slideXml(result.bytes, 1)).toContain('<a:tbl>');
    expect(slideXml(result.bytes, 2)).toContain('Native effects page');
    expect(pictureBlocks(slideXml(result.bytes, 3))).toHaveLength(1);
    expect(result.report.pages.map((entry) => entry.index)).toEqual([0, 1, 2]);
  });

  test('preserves decorated cell labels and inherited row fills without duplicated text', async ({
    page,
  }) => {
    const result = await exportFixture(page);
    const xml = slideXml(result.bytes, 2);
    const table = xml.match(/<a:tbl>[\s\S]*?<\/a:tbl>/)?.[0] ?? '';
    expect(table).toContain('11.25');
    expect(table).toContain('F6EDEF');
    expect(table).not.toContain('Lowest');
    expect(textOccurrences(xml, 'Native model')).toBe(1);
    expect(textOccurrences(xml, 'Lowest')).toBe(1);
    expect(shapeBlocks(xml).some((shape) => shape.includes('083D77'))).toBe(true);
    expect(shapeBlocks(xml).some((shape) => shape.includes('Lowest'))).toBe(true);
    expect(
      result.report.diagnostics.some(
        (entry) => entry.code === 'table-cell-layout' && entry.severity === 'warning',
      ),
    ).toBe(true);
  });
});
