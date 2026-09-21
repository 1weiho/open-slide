import { writeFile } from 'node:fs/promises';
import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import {
  deleteSlide,
  duplicateSlide,
  editorCanvas,
  openSlide,
  slideSourcePath,
} from './helpers.ts';

test.describe('inspector history target resolution', () => {
  const createdSlides: string[] = [];

  test.afterEach(async ({ page, request }) => {
    await page.close();
    for (const id of createdSlides.splice(0)) await deleteSlide(request, id);
  });

  async function openHistoryFixture(page: Page, request: APIRequestContext, slideId: string) {
    createdSlides.push(slideId);
    await duplicateSlide(request, 'edit-target', slideId);
    await writeFile(
      slideSourcePath(slideId),
      `import { createElement, useRef } from 'react';
import { type Page, type SlideMeta, useIsActivePage } from '@open-slide/core';
import { useHistory } from '@/components/history-provider';
import { useInspector } from '@/components/inspector/inspector-provider';
import type { EditOp } from '@/lib/inspector/use-editor';
export const meta: SlideMeta = { title: 'Inspector history', createdAt: '2026-01-01T00:00:00.000Z' };
function Harness() {
  const childRef = useRef<HTMLSpanElement>(null);
  const { bufferOps } = useInspector();
  const { undo, redo } = useHistory();
  const edit = (op: EditOp) => {
    const child = childRef.current;
    const parent = child?.parentElement;
    if (!child || !parent?.dataset.slideLoc) throw new Error('Missing history fixture target');
    const [line, column] = parent.dataset.slideLoc.split(':').map(Number);
    bufferOps(line, column, child, [op]);
  };
  return (
    <div style={{ padding: 80, fontFamily: 'system-ui', fontSize: 32, fontWeight: 400 }}>
      <p data-testid="history-text">Before {createElement('span', { ref: childRef }, 'tail')}</p>
      <div data-inspector-ui style={{ display: 'flex', gap: 24 }}>
        <button type="button" onClick={() => edit({ kind: 'set-text', value: 'After tail', prevText: 'Before tail' })}>Change text</button>
        <button type="button" onClick={() => edit({ kind: 'set-text-range-style', start: 0, end: 6, key: 'fontWeight', value: '700' })}>Format prefix</button>
        <button type="button" onClick={undo}>Undo fixture edit</button>
        <button type="button" onClick={redo}>Redo fixture edit</button>
      </div>
    </div>
  );
}
const Only: Page = () => useIsActivePage() ? <Harness /> : null;
export default [Only] satisfies Page[];
`,
    );
    await openSlide(page, slideId);
    const text = editorCanvas(page).getByTestId('history-text');
    await expect(text).toHaveText('Before tail');
    await page.waitForLoadState('networkidle');
    return text;
  }

  test('text redo uses the resolved parent when buffering from an untagged child', async ({
    page,
    request,
  }) => {
    const text = await openHistoryFixture(page, request, 'history-resolved-text');

    await editorCanvas(page).getByRole('button', { name: 'Change text', exact: true }).click();
    await expect(text).toHaveText('After tail');
    await expect(text.locator('span')).toHaveText('tail');

    await editorCanvas(page)
      .getByRole('button', { name: 'Undo fixture edit', exact: true })
      .click();
    await expect(text).toHaveText('Before tail');
    await editorCanvas(page)
      .getByRole('button', { name: 'Redo fixture edit', exact: true })
      .click();
    await expect(text).toHaveText('After tail');
    await expect(text.locator('span')).toHaveText('tail');
  });

  test('range-style redo restores the same parent text range', async ({ page, request }) => {
    const text = await openHistoryFixture(page, request, 'history-resolved-range-style');
    const prefix = text.getByText('Before', { exact: true });
    const tail = text.getByText('tail', { exact: true });

    await editorCanvas(page).getByRole('button', { name: 'Format prefix', exact: true }).click();
    await expect(prefix).toHaveCSS('font-weight', '700');
    await expect(tail).toHaveCSS('font-weight', '400');

    await editorCanvas(page)
      .getByRole('button', { name: 'Undo fixture edit', exact: true })
      .click();
    await expect(text.locator('[style]')).toHaveCount(0);
    await editorCanvas(page)
      .getByRole('button', { name: 'Redo fixture edit', exact: true })
      .click();
    await expect(prefix).toHaveCSS('font-weight', '700');
    await expect(tail).toHaveCSS('font-weight', '400');
    await expect(text).toHaveText('Before tail');
  });
});
