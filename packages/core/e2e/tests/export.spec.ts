import fs from 'node:fs/promises';
import { expect, type Page, test } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';
import { openSlide } from './helpers.ts';

async function exportDeck(page: Page, label: string): Promise<Record<string, Uint8Array>> {
  await page.getByRole('button', { name: 'Download' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: label, exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('alpha.pptx');
  const path = await file.path();
  return unzipSync(new Uint8Array(await fs.readFile(path)));
}

test.describe('pptx export', () => {
  test('writes native text boxes, backgrounds and speaker notes', async ({ page }) => {
    await openSlide(page, 'alpha');
    const parts = await exportDeck(page, 'Export as PPTX');

    expect(Object.keys(parts).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))).toHaveLength(
      3,
    );
    const slide1 = strFromU8(parts['ppt/slides/slide1.xml']);
    expect(slide1).toContain('<a:t>Alpha page one</a:t>');
    expect(slide1).toContain('<a:t>Opening content</a:t>');
    expect(slide1).toContain('<p:bg><p:bgPr><a:solidFill><a:srgbClr val="101014">');
    expect(slide1).toContain('<a:bodyPr wrap="none"');
    expect(slide1).toContain('<a:lnSpc><a:spcPts');
    expect(slide1).not.toContain('<p:pic>');

    expect(strFromU8(parts['ppt/notesSlides/notesSlide1.xml'])).toContain(
      '<a:t>Alpha speaker note</a:t>',
    );
    expect(parts['ppt/notesSlides/notesSlide2.xml']).toBeUndefined();
    expect(strFromU8(parts['ppt/notesSlides/notesSlide3.xml'])).toContain(
      '<a:t>Alpha final note</a:t>',
    );
    expect(strFromU8(parts['ppt/presentation.xml'])).toContain(
      '<p:sldSz cx="12192000" cy="6858000"/>',
    );
  });

  test('image export embeds one full-bleed picture per page', async ({ page }) => {
    await openSlide(page, 'alpha');
    const parts = await exportDeck(page, 'Export as image PPTX');

    const slide2 = strFromU8(parts['ppt/slides/slide2.xml']);
    expect(slide2).toContain('<p:pic>');
    expect(slide2).toContain('<a:ext cx="12192000" cy="6858000"/>');
    expect(slide2).not.toContain('<a:t>');
    expect(Object.keys(parts).filter((n) => /^ppt\/media\/image\d+\.png$/.test(n))).toHaveLength(3);
  });
});
