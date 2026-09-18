import fs from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';
import {
  deleteSlide,
  devServerUrl,
  duplicateSlide,
  editorCanvas,
  openSlide,
  refreshSlidesModule,
  slideSourcePath,
} from './helpers';

const editableDecks = ['alpha', 'steps'] as const;
const slowDeckId = 'editable-pptx-ui-slow';
const failureDeckId = 'editable-pptx-ui-failure';

const slowDeckSource = `import React from 'react';
const Slow = () => <div data-waitfor=".ready" style={{width:'100%',height:'100%',padding:120,fontSize:48}}>Slow export fixture</div>;
export default [Slow];`;

const failureDeckSource = `import React from 'react';
const Unsupported = () => <div style={{width:'100%',height:'100%',padding:120,fontSize:48}}>Failure export fixture<canvas width={200} height={100} /></div>;
export default [Unsupported];`;

async function openDeckWithText(
  page: Parameters<typeof openSlide>[0],
  slideId: string,
  text: string,
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await openSlide(page, slideId);
    if ((await editorCanvas(page).getByText(text, { exact: false }).count()) > 0) return;
    await page.reload();
  }
  await expect(editorCanvas(page)).toContainText(text);
}

async function seedDeck(
  request: Parameters<typeof duplicateSlide>[0],
  slideId: string,
  source: string,
  marker: string,
): Promise<void> {
  await duplicateSlide(request, 'alpha', slideId);
  const sourcePath = slideSourcePath(slideId);
  const temporaryPath = `${sourcePath}.tmp`;
  await fs.writeFile(temporaryPath, source);
  await fs.rename(temporaryPath, sourcePath);
  await refreshSlidesModule(slideId);
  await expect
    .poll(
      async () => {
        const response = await fetch(`${devServerUrl}/@fs/${sourcePath}?t=0`);
        return response.ok ? response.text() : '';
      },
      { timeout: 15_000 },
    )
    .toContain(marker);
  await new Promise((resolve) => setTimeout(resolve, 300));
}

test.describe('editable PPTX UI', () => {
  for (const slideId of editableDecks) {
    test(`exports ${slideId} through the shared export menu with a real PPTX download`, async ({
      page,
    }, testInfo) => {
      await openSlide(page, slideId);
      const downloadPromise = page.waitForEvent('download');
      if (slideId === 'alpha') {
        await page.getByRole('button', { name: 'Download' }).click();
        await expect(page.getByRole('menuitem', { name: 'Export as editable PPTX' })).toBeVisible();
        await page.getByRole('menuitem', { name: 'Export as editable PPTX' }).click();
      } else {
        await page.keyboard.press('ControlOrMeta+k');
        const input = page.getByPlaceholder('Search this deck or run a command');
        await expect(input).toBeVisible();
        await input.fill('export as editable pptx');
        await expect(page.getByRole('option', { name: 'Export as editable PPTX' })).toBeVisible();
        await page.getByRole('option', { name: 'Export as editable PPTX' }).click();
      }
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toBe(`${slideId}-editable.pptx`);
      const outputPath = testInfo.outputPath(`${slideId}-editable.pptx`);
      await download.saveAs(outputPath);
      const zip = unzipSync(await fs.readFile(outputPath));
      expect(zip['ppt/presentation.xml']).toBeDefined();
      expect(zip['ppt/slides/slide1.xml']).toBeDefined();
      expect(strFromU8(zip['ppt/slides/slide1.xml'])).toContain(
        slideId === 'alpha' ? 'Alpha page one' : 'Steps page one',
      );
      await expect(page.getByText('File generated, download started')).toBeVisible();
      await expect(page.getByText('Export failed. No file was downloaded.')).toBeHidden();
      const summary = page.getByTestId('editable-pptx-quality-summary');
      await expect(summary).toBeVisible();
      const reportDownload = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download JSON', exact: true }).click();
      const reportPath = testInfo.outputPath(`${slideId}.report.json`);
      await (await reportDownload).saveAs(reportPath);
      const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
      const slideXml = Object.entries(zip)
        .filter(([name]) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
        .map(([, bytes]) => strFromU8(bytes))
        .join('');
      expect(report.quality.totals.nativeLeafObjects).toBe(
        (slideXml.match(/<p:(?:sp|pic|graphicFrame)>/g) ?? []).length,
      );
      expect(report.quality.totals.groupContainers).toBe(
        (slideXml.match(/<p:grpSp>/g) ?? []).length,
      );
      await expect(summary).toContainText(`${report.pages.length} pages`);
      await page.getByRole('button', { name: 'Show export details', exact: true }).click();
      await expect(page.getByText('Windows support is not verified.')).toBeVisible();
    });
  }

  test('offers quality JSON after a clean success with no diagnostics', async ({
    page,
    request,
  }, testInfo) => {
    const id = 'editable-pptx-quality-clean';
    await seedDeck(
      request,
      id,
      `import React from 'react';
      export const FixtureReact=React;
      const Clean=()=> <div style={{width:'100%',height:'100%',background:'#fff'}}><div style={{width:400,height:200,background:'#258'}} /></div>;
      export default [Clean];`,
      'Clean',
    );
    try {
      await openSlide(page, id);
      const downloaded = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download', exact: true }).click();
      await page.getByRole('menuitem', { name: 'Export as editable PPTX', exact: true }).click();
      await downloaded;
      await expect(page.getByTestId('editable-pptx-quality-summary')).toBeVisible();
      const reportDownload = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download JSON', exact: true }).click();
      const reportPath = testInfo.outputPath('clean.report.json');
      await (await reportDownload).saveAs(reportPath);
      const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
      expect(report.diagnostics).toEqual([]);
      expect(report.quality.totals.shapes).toBe(2);
      expect(report.quality.totals.fontSubstitutionSources).toBe(0);
    } finally {
      await page.goto('about:blank');
      await deleteSlide(request, id);
    }
  });

  test('keeps HTML, PDF, image PPTX, and editable PPTX in both export menus', async ({ page }) => {
    await openSlide(page, 'alpha');
    const labels = [
      'Export as HTML',
      'Export as PDF',
      'Export as image PPTX',
      'Export as editable PPTX',
    ];

    await page.getByRole('button', { name: 'Download' }).click();
    for (const label of labels) {
      await expect(page.getByRole('menuitem', { name: label })).toBeVisible();
    }
    await page.keyboard.press('Escape');

    await page.keyboard.press('ControlOrMeta+k');
    const input = page.getByPlaceholder('Search this deck or run a command');
    await input.fill('export');
    for (const label of labels) {
      await expect(page.getByRole('option', { name: label })).toBeVisible();
    }
  });

  test.describe('cancellation and stale route results', () => {
    test.beforeEach(async ({ request, page }) => {
      await seedDeck(request, slowDeckId, slowDeckSource, 'Slow export fixture');
      await openDeckWithText(page, slowDeckId, 'Slow export fixture');
    });

    test.afterEach(async ({ request, page }) => {
      await page.goto('about:blank');
      await deleteSlide(request, slowDeckId);
    });

    test('cancels without downloading a PPTX', async ({ page }) => {
      let pptxDownloads = 0;
      page.on('download', (download) => {
        if (download.suggestedFilename().endsWith('.pptx')) pptxDownloads += 1;
      });

      await page.getByRole('button', { name: 'Download' }).click();
      await page.getByRole('menuitem', { name: 'Export as editable PPTX' }).click();
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
      await page.getByRole('button', { name: 'Cancel' }).click();

      await expect(page.getByText('Export cancelled. No file was downloaded.')).toBeVisible();
      await expect(page.getByText('File generated, download started')).toBeHidden();
      expect(pptxDownloads).toBe(0);
    });

    test('drops the in-flight export when navigating to another deck', async ({ page }) => {
      const downloadedPptx: string[] = [];
      page.on('download', (download) => {
        if (download.suggestedFilename().endsWith('.pptx')) {
          downloadedPptx.push(download.suggestedFilename());
        }
      });

      await page.getByRole('button', { name: 'Download' }).click();
      await page.getByRole('menuitem', { name: 'Export as editable PPTX' }).click();
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

      await openSlide(page, 'alpha');
      await expect(page.getByText('Exporting editable PPTX')).toBeHidden();
      await page.waitForTimeout(500);
      expect(downloadedPptx).toEqual([]);
      await expect(page.getByText('File generated, download started')).toBeHidden();
      await expect(page.getByText('Export failed. No file was downloaded.')).toBeHidden();
    });
  });

  test.describe('diagnostics and retry', () => {
    test.beforeEach(async ({ request, page }) => {
      await seedDeck(request, failureDeckId, failureDeckSource, 'Failure export fixture');
      await openDeckWithText(page, failureDeckId, 'Failure export fixture');
    });

    test.afterEach(async ({ request, page }) => {
      await page.goto('about:blank');
      await deleteSlide(request, failureDeckId);
    });

    test('shows diagnostics, downloads the report JSON, and retries', async ({
      page,
    }, testInfo) => {
      let pptxDownloads = 0;
      page.on('download', (download) => {
        if (download.suggestedFilename().endsWith('.pptx')) pptxDownloads += 1;
      });

      await page.getByRole('button', { name: 'Download' }).click();
      await page.getByRole('menuitem', { name: 'Export as editable PPTX' }).click();
      await expect(page.getByText('Export failed. No file was downloaded.')).toBeVisible();
      await expect(page.getByText('File generated, download started')).toBeHidden();
      await expect(page.getByRole('button', { name: 'Show diagnostics' })).toBeVisible();
      await page.getByRole('button', { name: 'Show diagnostics' }).click();
      await expect(page.getByText('unsupported-element')).toBeVisible();

      const reportDownloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download JSON' }).click();
      const reportDownload = await reportDownloadPromise;
      expect(reportDownload.suggestedFilename()).toBe(`${failureDeckId}-editable-report.json`);
      const reportPath = testInfo.outputPath(`${failureDeckId}-editable-report.json`);
      await reportDownload.saveAs(reportPath);
      const report = JSON.parse(await fs.readFile(reportPath, 'utf8')) as {
        slideId: string;
        diagnostics: { code: string }[];
      };
      expect(report.slideId).toBe(failureDeckId);
      expect(report.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
        'unsupported-element',
      );

      await page.getByRole('button', { name: 'Try again' }).click();
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
      await expect(page.getByText('Export failed. No file was downloaded.')).toBeVisible();
      expect(pptxDownloads).toBe(0);
    });
  });
});
