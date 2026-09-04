import { expect, test } from '@playwright/test';

test.describe('theme detail', () => {
  test('navigates demo pages and expands the prompt', async ({ page }) => {
    await page.goto('/themes/plain');
    await expect(page.getByText('Theme demo one')).toBeVisible({ timeout: 30_000 });

    const prev = page.getByRole('button', { name: 'Previous page' });
    const next = page.getByRole('button', { name: 'Next page' });
    await expect(prev).toBeDisabled();

    await next.click();
    await expect(page.getByText('Theme demo two')).toBeVisible();
    await expect(next).toBeDisabled();

    await prev.click();
    await expect(page.getByText('Theme demo one')).toBeVisible();

    const expand = page.getByRole('button', { name: 'Expand prompt' });
    await expand.click();
    await expect(page.getByRole('button', { name: 'Collapse prompt' })).toBeVisible();
  });
});
