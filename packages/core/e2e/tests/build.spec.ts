import type { ChildProcess } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  prepareScratchProject,
  runCli,
  startCliServer,
  stopServer,
  waitForHttpOk,
} from './helpers.ts';

const FLAGS_CONFIG = `import type { OpenSlideConfig } from '@open-slide/core';

const openSlideConfig: OpenSlideConfig = {
  build: { showSlideBrowser: false, showSlideUi: false },
};

export default openSlideConfig;
`;

test.describe('static build and preview', () => {
  const port = 43119;
  const baseUrl = `http://127.0.0.1:${port}`;
  let projectDir: string;
  let preview: ChildProcess | undefined;

  test.beforeAll(async () => {
    test.setTimeout(300_000);
    projectDir = prepareScratchProject('build');
    const res = await runCli(['build'], projectDir);
    expect(res.code, res.stderr).toBe(0);
    preview = startCliServer(
      ['preview', '--host', '127.0.0.1', '--port', String(port)],
      projectDir,
    );
    await waitForHttpOk(`${baseUrl}/`);
  });

  test.afterAll(async () => {
    if (preview) await stopServer(preview);
  });

  test('emits a single-page bundle with per-slide chunks', async () => {
    const dist = path.join(projectDir, 'dist');
    const entries = await fs.readdir(dist);
    expect(entries.filter((name) => name.endsWith('.html'))).toEqual(['index.html']);

    const html = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('<title>open-slide</title>');

    // Each slide is lazily imported, so the deck code-splits into at least one
    // chunk per slide plus the entry chunk. The exact chunk filenames depend on
    // the bundler (Rollup names them after the module basename, `index-*.js`),
    // so assert the split happened rather than pinning a naming convention.
    const slideCount = 4;
    const assets = await fs.readdir(path.join(dist, 'assets'));
    const jsChunks = assets.filter((name) => name.endsWith('.js'));
    expect(jsChunks.length).toBeGreaterThanOrEqual(slideCount + 1);
  });

  test('serves the slide browser from the static bundle', async ({ page }) => {
    await page.goto(`${baseUrl}/`);
    await expect(page.getByText('Alpha Deck')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Steps Deck')).toBeVisible();
  });

  test('deep links resolve through the spa fallback', async ({ page }) => {
    await page.goto(`${baseUrl}/s/steps`);
    await expect(page.locator('main[data-inspector-root]').getByText('Steps page one')).toBeVisible(
      { timeout: 30_000 },
    );
  });

  test('dev-only endpoints fall through to the spa fallback in preview', async ({ request }) => {
    const res = await request.get(`${baseUrl}/__server-status`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/html');
  });
});

test.describe('build flags', () => {
  const port = 43121;
  const baseUrl = `http://127.0.0.1:${port}`;
  let preview: ChildProcess | undefined;

  test.beforeAll(async () => {
    test.setTimeout(300_000);
    const projectDir = prepareScratchProject('build-flags');
    await fs.writeFile(path.join(projectDir, 'open-slide.config.ts'), FLAGS_CONFIG);
    const res = await runCli(['build'], projectDir);
    expect(res.code, res.stderr).toBe(0);
    preview = startCliServer(
      ['preview', '--host', '127.0.0.1', '--port', String(port)],
      projectDir,
    );
    await waitForHttpOk(`${baseUrl}/`);
  });

  test.afterAll(async () => {
    if (preview) await stopServer(preview);
  });

  test('showSlideBrowser false hides the home browser', async ({ page }) => {
    await page.goto(`${baseUrl}/`);
    await expect(page.getByText('Page not found')).toBeVisible();
  });

  test('showSlideUi false serves a bare read-only player', async ({ page }) => {
    await page.goto(`${baseUrl}/s/alpha`);
    await expect(page.getByText('Alpha page one')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('main[data-inspector-root]')).toHaveCount(0);

    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('Alpha page two')).toBeVisible();
  });
});
