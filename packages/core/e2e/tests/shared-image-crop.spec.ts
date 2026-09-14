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

const image = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="orange"/></svg>',
).toString('base64')}`;
const source = `export const meta = { title: 'Shared crop' };
const Picture = ({ label }: { label: string }) => (
  <img src="${image}" alt={label} style={{ width: 400, height: 300, objectFit: 'contain' }} />
);
export default [
  () => <div style={{ padding: 120 }}><Picture label="First picture" /></div>,
  () => <div style={{ padding: 120 }}><Picture label="Second picture" /></div>,
];
`;

test.describe('shared image crop confirmation', () => {
  const slideId = 'shared-crop-regression';

  test.beforeEach(async ({ page, request }) => {
    await duplicateSlide(request, 'edit-target', slideId);
    await fs.writeFile(slideSourcePath(slideId), source);
    await openSlide(page, slideId);
    await page.getByTitle('Inspect').click();
    await editorCanvas(page).getByRole('img', { name: 'First picture' }).dblclick();
  });

  test.afterEach(async ({ request }) => {
    await deleteSlide(request, slideId);
  });

  test('requires fresh consent each time and leaves the file untouched on cancel', async ({
    page,
  }) => {
    const dialog = page.getByRole('dialog', { name: 'Crop image' });
    const apply = dialog.getByRole('button', { name: 'Apply', exact: true });
    const consent = dialog.getByRole('checkbox', { name: /shared component/ });
    await expect(apply).toBeDisabled();
    await consent.focus();
    await page.keyboard.press('Space');
    await expect(apply).toBeEnabled();
    await page.keyboard.press('Space');
    await expect(apply).toBeDisabled();
    await consent.check();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(await readSlideSource(slideId)).toBe(source);

    await editorCanvas(page).getByRole('img', { name: 'First picture' }).dblclick();
    await expect(consent).not.toBeChecked();
    await expect(apply).toBeDisabled();
  });

  test('applies the shared crop only after consent, including on another page', async ({
    page,
  }) => {
    const dialog = page.getByRole('dialog', { name: 'Crop image' });
    await dialog.getByRole('button', { name: 'Fill', exact: true }).click();
    await dialog.getByRole('checkbox', { name: /shared component/ }).check();
    await dialog.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect.poll(() => readSlideSource(slideId)).toContain("objectFit: 'cover'");
    await openSlide(page, slideId, '?p=2');
    await expect(editorCanvas(page).getByRole('img', { name: 'Second picture' })).toHaveCSS(
      'object-fit',
      'cover',
    );
  });
});
