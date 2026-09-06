import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import {
  deleteSlide,
  duplicateSlide,
  editorCanvas,
  openSlide,
  slideSourcePath,
} from './helpers.ts';

const fixtures = [
  ...(['pre', 'pre-wrap', 'break-spaces'] as const).map((whiteSpace) => ({
    name: `inherited-${whiteSpace}`,
    whiteSpace,
    content: '{"alpha  target   omega"}',
    original: 'alpha  target   omega',
    rendered: 'alpha  target   omega',
  })),
  {
    name: 'nested-css-contexts',
    whiteSpace: 'normal',
    content:
      '{"alpha "}<span className="preserve">{"nested  target   "}<span className="collapse">{"plain    tail"}</span></span>{" end"}',
    original: 'alpha nested  target   plain    tail end',
    rendered: 'alpha nested  target   plain tail end',
  },
  {
    name: 'preserved-line-break-spacing',
    whiteSpace: 'pre-wrap',
    content: '{"alpha  "}<br />{"  target   omega"}',
    original: 'alpha    target   omega',
    rendered: 'alpha  \n  target   omega',
  },
];

test.describe('editor whitespace replay', () => {
  const createdSlides: string[] = [];

  test.afterEach(async ({ page, request }) => {
    await page.close();
    for (const id of createdSlides.splice(0)) await deleteSlide(request, id);
  });

  for (const fixture of fixtures) {
    test(`range styles preserve ${fixture.name} through text edits and history`, async ({
      page,
      request,
    }) => {
      const slideId = `whitespace-${fixture.name}`;
      createdSlides.push(slideId);
      await duplicateSlide(request, 'edit-target', slideId);
      await writeFile(
        slideSourcePath(slideId),
        `import { useRef, useState } from 'react';
import { type Page, type SlideMeta, useIsActivePage } from '@open-slide/core';
import { useHistory } from '@/components/history-provider';
import { readEditableText, useInspector } from '@/components/inspector/inspector-provider';
export const meta: SlideMeta = { title: 'Whitespace replay', createdAt: '2026-01-01T00:00:00.000Z' };
function Harness() {
  const ref = useRef<HTMLParagraphElement>(null);
  const [text, setText] = useState('');
  const { bufferOps, cancelEdits } = useInspector();
  const { undo, redo } = useHistory();
  const edit = (kind: 'bold' | 'italic' | 'text') => {
    const anchor = ref.current;
    if (!anchor?.dataset.slideLoc) throw new Error('Missing whitespace fixture target');
    const [line, column] = anchor.dataset.slideLoc.split(':').map(Number);
    const prevText = readEditableText(anchor);
    const start = prevText.indexOf('target');
    bufferOps(line, column, anchor, [kind === 'text'
      ? { kind: 'set-text', value: prevText + ' suffix', prevText }
      : { kind: 'set-text-range-style', start, end: start + 6,
          key: kind === 'bold' ? 'fontWeight' : 'fontStyle',
          value: kind === 'bold' ? '700' : 'italic', prevText }]);
    setText(readEditableText(anchor));
  };
  return (
    <div style={{ padding: 80, fontFamily: 'system-ui', fontSize: 32, fontWeight: 400 }}>
      <style>{'.preserve { white-space: break-spaces; } .collapse { white-space: normal; }'}</style>
      <section style={{ whiteSpace: '${fixture.whiteSpace}' }}>
        <p ref={ref} data-testid="whitespace-text">${fixture.content}</p>
      </section>
      <output data-testid="rendered-text">{text}</output>
      <div data-inspector-ui style={{ display: 'flex', gap: 24 }}>
        <button type="button" onClick={() => edit('bold')}>Bold word</button>
        <button type="button" onClick={() => edit('italic')}>Italic word</button>
        <button type="button" onClick={() => edit('text')}>Append text</button>
        <button type="button" onClick={undo}>Undo fixture edit</button>
        <button type="button" onClick={redo}>Redo fixture edit</button>
        <button type="button" onClick={cancelEdits}>Discard fixture edits</button>
      </div>
    </div>
  );
}
const Only: Page = () => useIsActivePage() ? <Harness /> : null;
export default [Only] satisfies Page[];
`,
      );
      await openSlide(page, slideId);
      const canvas = editorCanvas(page);
      const text = canvas.getByTestId('whitespace-text');
      await expect(text).toBeVisible();
      await page.waitForLoadState('networkidle');
      const initialHtml = await text.innerHTML();

      await canvas.getByRole('button', { name: 'Bold word', exact: true }).click();
      await expect(text.locator('[style*="font-weight"]')).toHaveText('target');
      await expect.poll(() => text.textContent()).toBe(fixture.original);
      await expect
        .poll(() => canvas.getByTestId('rendered-text').textContent())
        .toBe(fixture.rendered);

      await canvas.getByRole('button', { name: 'Append text', exact: true }).click();
      await canvas.getByRole('button', { name: 'Italic word', exact: true }).click();
      await expect(text.locator('[style*="font-style"]')).toHaveText('target');
      await expect(text.getByText('target', { exact: true })).toHaveCSS('font-weight', '700');
      await expect
        .poll(() => canvas.getByTestId('rendered-text').textContent())
        .toBe(`${fixture.rendered} suffix`);

      await canvas.getByRole('button', { name: 'Undo fixture edit', exact: true }).click();
      await expect(text.locator('[style*="font-style"]')).toHaveCount(0);
      await canvas.getByRole('button', { name: 'Redo fixture edit', exact: true }).click();
      await expect(text.locator('[style*="font-style"]')).toHaveText('target');
      await expect(text.getByText('target', { exact: true })).toHaveCSS('font-weight', '700');
      await canvas.getByRole('button', { name: 'Discard fixture edits', exact: true }).click();
      await expect.poll(() => text.innerHTML()).toBe(initialHtml);

      if (fixture.name.startsWith('inherited-')) {
        await canvas.getByRole('button', { name: 'Bold word', exact: true }).click();
        await canvas.getByRole('button', { name: 'Append text', exact: true }).click();
        await canvas.getByRole('button', { name: 'Italic word', exact: true }).click();
        const saved = page.waitForResponse(
          (response) =>
            response.url().includes('/__edit') && response.request().method() === 'POST',
        );
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        const response = await saved;
        expect(response.status()).toBe(200);
        const result = (await response.json()) as { results: { ok: boolean; error?: string }[] };
        expect(result.results.filter((entry) => !entry.ok)).toEqual([]);
        await page.reload();
        await expect.poll(() => text.textContent()).toBe(`${fixture.original} suffix`);
        await expect(text.getByText('target', { exact: true })).toHaveCSS('font-weight', '700');
        await expect(text.getByText('target', { exact: true })).toHaveCSS('font-style', 'italic');
      }
    });
  }
});
