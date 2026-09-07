import fs from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test.describe('Svelte inspector', () => {
  test('edits speaker notes through the shared notes API', async ({ page, request }) => {
    const original = 'Alpha speaker note';
    const entryUrl = new URL('../fixture/slides/alpha/index.ts', import.meta.url);
    const originalSource = await fs.readFile(entryUrl, 'utf8');
    try {
      await page.goto('/s/alpha');
      await page.getByRole('button', { name: 'Inspector' }).click();
      const notes = page.getByLabel('Speaker notes');
      await expect(notes).toHaveValue(original);
      await notes.fill('Updated from Svelte inspector');
      const saved = page.waitForResponse(
        (response) => response.url().endsWith('/__notes') && response.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Save notes' }).click();
      expect((await saved).status()).toBe(200);

      await page.getByRole('button', { name: 'Go to page 2' }).click();
      await expect(
        page.locator('.viewport').getByRole('heading', { name: 'Alpha page two' }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Go to page 1' }).click();
      await expect(
        page.locator('.viewport').getByRole('heading', { name: 'Alpha page one' }),
      ).toBeVisible();
      await expect(notes).toHaveValue('Updated from Svelte inspector');
    } finally {
      await request.put('/__notes', {
        data: { slideId: 'alpha', index: 0, text: original },
      });
      await fs.writeFile(entryUrl, originalSource);
    }
  });

  test('edits the shared design system and applies its CSS variables', async ({ page }) => {
    const entryUrl = new URL('../fixture/slides/alpha/index.ts', import.meta.url);
    const originalSource = await fs.readFile(entryUrl, 'utf8');
    try {
      await page.goto('/s/alpha');
      await page.getByRole('button', { name: 'Inspector' }).click();
      const accent = page.getByLabel('Design accent');
      await expect(accent).toHaveValue('#6d4cff');
      const saved = page.waitForResponse(
        (response) =>
          response.url().includes('/__design?') && response.request().method() === 'PUT',
      );
      await accent.fill('#123456');
      await accent.press('Tab');
      expect((await saved).status()).toBe(200);
      await expect(page.locator('.viewport .canvas')).toHaveAttribute(
        'style',
        /--osd-accent: #123456/,
      );
    } finally {
      await fs.writeFile(entryUrl, originalSource);
    }
  });

  test('edits direct Svelte element text using compiler source locations', async ({ page }) => {
    const sourceUrl = new URL('../fixture/slides/alpha/01-one.svelte', import.meta.url);
    const originalSource = await fs.readFile(sourceUrl, 'utf8');
    try {
      await page.goto('/s/alpha');
      await page.getByRole('button', { name: 'Inspector' }).click();
      await page.locator('.viewport').getByRole('heading', { name: 'Alpha page one' }).click();
      const text = page.getByLabel('Selected element text');
      await expect(text).toHaveValue('Alpha page one');
      await text.fill('Edited Svelte heading');
      const saved = page.waitForResponse(
        (response) =>
          response.url().endsWith('/__svelte-edit') && response.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Save element' }).click();
      expect((await saved).status()).toBe(200);
      await expect(page.locator('.viewport').getByText('Edited Svelte heading')).toBeVisible();
    } finally {
      await fs.writeFile(sourceUrl, originalSource);
    }
  });

  test('adds and removes source-backed comments on Svelte elements', async ({ page }) => {
    const sourceUrl = new URL('../fixture/slides/alpha/01-one.svelte', import.meta.url);
    const originalSource = await fs.readFile(sourceUrl, 'utf8');
    try {
      await page.goto('/s/alpha');
      await page.getByRole('button', { name: 'Inspector' }).click();
      await page.locator('.viewport').getByRole('heading', { name: 'Alpha page one' }).click();
      await page.getByLabel('Element comment').fill('Make this heading shorter');
      const added = page.waitForResponse(
        (response) =>
          response.url().endsWith('/__comments/add') && response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Add comment' }).click();
      expect((await added).status()).toBe(200);
      await expect(page.getByRole('list', { name: 'Slide comments' })).toContainText(
        'Make this heading shorter',
      );
      expect(await fs.readFile(sourceUrl, 'utf8')).toContain('@slide-comment');

      const removed = page.waitForResponse(
        (response) =>
          response.url().includes('/__comments/c-') && response.request().method() === 'DELETE',
      );
      await page.getByRole('button', { name: 'Delete comment Make this heading shorter' }).click();
      expect((await removed).status()).toBe(200);
      await expect(page.getByRole('list', { name: 'Slide comments' })).toHaveCount(0);
      expect(await fs.readFile(sourceUrl, 'utf8')).not.toContain('@slide-comment');
    } finally {
      await fs.writeFile(sourceUrl, originalSource);
    }
  });

  test('saves, discards, undoes, and redoes element styles', async ({ page }) => {
    const sourceUrl = new URL('../fixture/slides/alpha/01-one.svelte', import.meta.url);
    const originalSource = await fs.readFile(sourceUrl, 'utf8');
    try {
      await page.goto('/s/alpha');
      await page.getByRole('button', { name: 'Inspector' }).click();
      const heading = page.locator('.viewport').getByRole('heading', { name: 'Alpha page one' });
      await heading.click();
      await expect(page.getByLabel('Font size')).toHaveValue('96');
      await page.getByLabel('Font size').fill('72');
      await expect(heading).toHaveCSS('font-size', '72px');

      const saved = page.waitForResponse(
        (response) =>
          response.url().endsWith('/__svelte-edit') && response.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Save element' }).click();
      expect((await saved).status()).toBe(200);
      await expect(heading).toHaveCSS('font-size', '72px');
      expect(await fs.readFile(sourceUrl, 'utf8')).toContain('style="font-size: 72px"');

      await page.getByLabel('Font size').fill('54');
      await expect(heading).toHaveCSS('font-size', '54px');
      await page.getByRole('button', { name: 'Discard' }).click();
      await expect(heading).toHaveCSS('font-size', '72px');

      const undone = page.waitForResponse(
        (response) =>
          response.url().endsWith('/__svelte-edit') && response.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Undo' }).click();
      expect((await undone).status()).toBe(200);
      await expect(heading).toHaveCSS('font-size', '96px');

      const redone = page.waitForResponse(
        (response) =>
          response.url().endsWith('/__svelte-edit') && response.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Redo' }).click();
      expect((await redone).status()).toBe(200);
      await expect(heading).toHaveCSS('font-size', '72px');
    } finally {
      await fs.writeFile(sourceUrl, originalSource);
    }
  });

  test('replaces a Svelte image placeholder with a deck asset', async ({ page, request }) => {
    const sourceUrl = new URL('../fixture/slides/beta/01-main.svelte', import.meta.url);
    const originalSource = await fs.readFile(sourceUrl, 'utf8');
    const assetName = 'replacement.svg';
    try {
      const uploaded = await request.post(`/__assets/beta/${assetName}`, {
        headers: { 'content-type': 'image/svg+xml' },
        data: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="18"><rect width="32" height="18" fill="red"/></svg>',
        ),
      });
      expect(uploaded.ok()).toBe(true);

      await page.goto('/s/beta');
      await page.getByRole('button', { name: 'Inspector' }).click();
      await page.locator('.viewport').getByRole('img', { name: 'Beta chart' }).click();
      await expect(page.getByText('Replace “Beta chart”')).toBeVisible();
      await page.getByRole('button', { name: assetName }).click();
      await expect(
        page.locator('.viewport').getByRole('img', { name: 'Beta chart' }),
      ).toBeVisible();
      const source = await fs.readFile(sourceUrl, 'utf8');
      expect(source).toContain("import replacement from './assets/replacement.svg'");
      expect(source).toContain('<img src={replacement} alt="Beta chart"');
    } finally {
      await fs.writeFile(sourceUrl, originalSource);
      await request.delete(`/__assets/beta/${assetName}`);
    }
  });
});
