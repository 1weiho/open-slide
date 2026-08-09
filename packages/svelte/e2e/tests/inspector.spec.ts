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
      await page.getByRole('button', { name: 'Go to page 1' }).click();
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
});
