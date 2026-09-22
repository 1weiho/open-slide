import fs from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import {
  deleteSlide,
  duplicateSlide,
  editorCanvas,
  openSlide,
  readSlideSource,
  slideSourcePath,
} from './helpers.ts';

const source = `export const meta = { title: 'Inline props' };
const Card = ({ title }: { title: string }) => <h2>{title}</h2>;
export default [() => (
  <div style={{ padding: 120, fontSize: 40 }}>
    <Card title="Alpha" />
    <Card title="Beta" />
  </div>
)];
`;

test.describe('inline prop text', () => {
  const slideId = 'inline-prop-regression';

  test.beforeEach(async ({ page, request }) => {
    await duplicateSlide(request, 'edit-target', slideId);
    await fs.writeFile(slideSourcePath(slideId), source);
    await openSlide(page, slideId);
  });

  test.afterEach(async ({ request }) => {
    await deleteSlide(request, slideId);
  });

  test('keeps the source value through typing, a failed save, and retry', async ({ page }) => {
    const alpha = editorCanvas(page).getByText('Alpha', { exact: true });
    await alpha.click();
    await expect(alpha).toHaveAttribute('contenteditable', 'true');
    await page.keyboard.press('End');
    await page.keyboard.type(' edited');
    await page.keyboard.press('Escape');

    await page.route('**/__edit/batch', (route) => route.abort(), { times: 1 });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText(/Couldn't save/)).toBeVisible();
    expect(await readSlideSource(slideId)).toBe(source);

    const edited = editorCanvas(page).getByText('Alpha edited', { exact: true });
    await edited.click();
    await expect(edited).toHaveAttribute('contenteditable', 'true');
    await page.keyboard.press('End');
    await page.keyboard.type(' again');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect.poll(() => readSlideSource(slideId)).toContain('title="Alpha edited again"');
    expect(await readSlideSource(slideId)).toContain('title="Beta"');
    await page.reload();
    await expect(editorCanvas(page).getByText('Alpha edited again', { exact: true })).toBeVisible();
    await expect(editorCanvas(page).getByText('Beta', { exact: true })).toBeVisible();
  });

  test('discard restores the text from before the first input event', async ({ page }) => {
    const alpha = editorCanvas(page).getByText('Alpha', { exact: true });
    await alpha.click();
    await expect(alpha).toHaveAttribute('contenteditable', 'true');
    await page.keyboard.press('End');
    await page.keyboard.type(' edited');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Discard', exact: true }).click();
    await expect(editorCanvas(page).getByText('Alpha', { exact: true })).toBeVisible();
    await expect(editorCanvas(page).getByText('Beta', { exact: true })).toBeVisible();
    expect(await readSlideSource(slideId)).toBe(source);
  });

  test('keeps the original value while composing text', async ({ page }) => {
    const alpha = editorCanvas(page).getByText('Alpha', { exact: true });
    await alpha.click();
    await expect(alpha).toHaveAttribute('contenteditable', 'true');
    await alpha.evaluate((element) => {
      element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      for (const value of ['Alpha z', 'Alpha zh', 'Alpha 中文']) {
        element.dispatchEvent(
          new InputEvent('beforeinput', {
            bubbles: true,
            inputType: 'insertCompositionText',
            isComposing: true,
          }),
        );
        element.textContent = value;
        element.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
      }
      element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect.poll(() => readSlideSource(slideId)).toContain('title="Alpha 中文"');
    expect(await readSlideSource(slideId)).toContain('title="Beta"');
  });
});
