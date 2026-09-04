import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  coreRoot,
  deleteSlide,
  devScratchDir,
  duplicateSlide,
  readSlideSource,
  slideSourcePath,
  TINY_PNG,
} from './helpers.ts';

test.describe('dev server http api', () => {
  test.afterEach(async ({ request }) => {
    for (const id of ['api-dup', 'api-notes', 'api-design', 'api-comments', 'api-assets']) {
      await deleteSlide(request, id);
    }
    const folders = (await (await request.get('/__folders')).json()) as {
      folders: { id: string }[];
    };
    for (const folder of folders.folders) {
      await request.delete(`/__folders/${folder.id}`);
    }
  });

  test('server status reports a stable execution id', async ({ request }) => {
    const first = await request.get('/__server-status');
    expect(first.status()).toBe(200);
    const body = (await first.json()) as { executionId: string; canRestart: boolean };
    expect(body.executionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.canRestart).toBe(true);

    const second = await (await request.get('/__server-status')).json();
    expect((second as { executionId: string }).executionId).toBe(body.executionId);
  });

  test('update check reports the running core version', async ({ request }) => {
    const pkg = JSON.parse(await fs.readFile(path.join(coreRoot, 'package.json'), 'utf8')) as {
      version: string;
    };
    const res = await request.get('/__update-check');
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { current: string };
    expect(body.current).toBe(pkg.version);
  });

  test('folders can be created, assigned, and deleted', async ({ request }) => {
    const empty = (await (await request.get('/__folders')).json()) as {
      folders: unknown[];
      assignments: Record<string, string>;
    };
    expect(empty).toEqual({ folders: [], assignments: {} });

    const created = await request.post('/__folders', {
      data: { name: 'E2E Folder', icon: { type: 'emoji', value: '🧪' } },
    });
    expect(created.ok()).toBe(true);
    const folder = (await created.json()) as { id: string; name: string };
    expect(folder.id).toMatch(/^f-[a-f0-9]{8}$/);
    expect(folder.name).toBe('E2E Folder');

    const assigned = await request.put('/__folders/assign', {
      data: { slideId: 'alpha', folderId: folder.id },
    });
    expect(assigned.ok()).toBe(true);
    const state = (await (await request.get('/__folders')).json()) as {
      assignments: Record<string, string>;
    };
    expect(state.assignments.alpha).toBe(folder.id);

    const removed = await request.delete(`/__folders/${folder.id}`);
    expect(removed.ok()).toBe(true);
    const after = (await (await request.get('/__folders')).json()) as {
      folders: unknown[];
      assignments: Record<string, string>;
    };
    expect(after.folders).toEqual([]);
    expect(after.assignments).toEqual({});
  });

  test('slides can be duplicated, renamed, and deleted', async ({ request }) => {
    const dup = await request.post('/__slides/edit-target/duplicate', {
      data: { newId: 'api-dup' },
    });
    expect(dup.ok()).toBe(true);
    expect(((await dup.json()) as { slideId: string }).slideId).toBe('api-dup');
    expect(existsSync(slideSourcePath('api-dup'))).toBe(true);

    const conflict = await request.post('/__slides/edit-target/duplicate', {
      data: { newId: 'api-dup' },
    });
    expect(conflict.status()).toBe(409);

    const invalid = await request.post('/__slides/edit-target/duplicate', {
      data: { newId: 'bad id!' },
    });
    expect(invalid.status()).toBe(400);

    const renamed = await request.patch('/__slides/api-dup', { data: { name: 'Renamed via API' } });
    expect(renamed.ok()).toBe(true);
    expect(await readSlideSource('api-dup')).toContain('Renamed via API');

    const deleted = await request.delete('/__slides/api-dup');
    expect(deleted.ok()).toBe(true);
    await expect.poll(() => existsSync(slideSourcePath('api-dup'))).toBe(false);
  });

  test('notes endpoint writes speaker notes into the slide module', async ({ request }) => {
    await duplicateSlide(request, 'edit-target', 'api-notes');
    const res = await request.put('/__notes', {
      data: { slideId: 'api-notes', index: 0, text: 'API speaker note' },
    });
    expect(res.ok()).toBe(true);
    expect((await res.json()) as { ok: boolean }).toMatchObject({ ok: true });

    const source = await readSlideSource('api-notes');
    expect(source).toContain('export const notes');
    expect(source).toContain('API speaker note');
  });

  test('design endpoint creates and resets a design declaration', async ({ request }) => {
    await duplicateSlide(request, 'edit-target', 'api-design');

    const initial = (await (await request.get('/__design?slideId=api-design')).json()) as {
      exists: boolean;
    };
    expect(initial.exists).toBe(false);

    const updated = await request.put('/__design?slideId=api-design', {
      data: { patch: { radius: 12 } },
    });
    expect(updated.ok()).toBe(true);
    expect(await readSlideSource('api-design')).toContain('const design: DesignSystem');

    const reset = await request.post('/__design/reset?slideId=api-design');
    expect(reset.ok()).toBe(true);
  });

  test('comment markers round-trip through the comments api', async ({ request }) => {
    await duplicateSlide(request, 'edit-target', 'api-comments');
    const source = await readSlideSource('api-comments');
    const line = source.split('\n').findIndex((l) => l.includes('<h1')) + 1;
    expect(line).toBeGreaterThan(0);

    const added = await request.post('/__comments/add', {
      data: { slideId: 'api-comments', line, text: 'Make this pop' },
    });
    expect(added.ok()).toBe(true);
    const comment = (await added.json()) as { id: string };
    expect(comment.id).toMatch(/^c-[a-f0-9]+$/);
    expect(await readSlideSource('api-comments')).toContain('@slide-comment');

    const list = (await (await request.get('/__comments/?slideId=api-comments')).json()) as {
      comments: { id: string; note: string }[];
    };
    expect(list.comments).toHaveLength(1);
    expect(list.comments[0]?.note).toBe('Make this pop');

    const removed = await request.delete(`/__comments/${comment.id}?slideId=api-comments`);
    expect(removed.ok()).toBe(true);
    expect(await readSlideSource('api-comments')).not.toContain('@slide-comment');
  });

  test('slide assets can be uploaded, listed, served, renamed, and deleted', async ({
    request,
  }) => {
    await duplicateSlide(request, 'edit-target', 'api-assets');

    const uploaded = await request.post('/__assets/api-assets/dot.png', {
      headers: { 'content-type': 'application/octet-stream' },
      data: TINY_PNG,
    });
    expect(uploaded.ok()).toBe(true);
    expect((await uploaded.json()) as { name: string }).toMatchObject({
      name: 'dot.png',
      mime: 'image/png',
    });

    const conflict = await request.post('/__assets/api-assets/dot.png', {
      headers: { 'content-type': 'application/octet-stream' },
      data: TINY_PNG,
    });
    expect(conflict.status()).toBe(409);

    const list = (await (await request.get('/__assets/api-assets')).json()) as {
      assets: { name: string; unused: boolean }[];
    };
    expect(list.assets).toHaveLength(1);
    expect(list.assets[0]).toMatchObject({ name: 'dot.png', unused: true });

    const served = await request.get('/__assets/api-assets/dot.png');
    expect(served.status()).toBe(200);
    expect(served.headers()['content-type']).toBe('image/png');
    expect(Buffer.compare(await served.body(), TINY_PNG)).toBe(0);

    const renamed = await request.patch('/__assets/api-assets/dot.png', {
      data: { name: 'dot-renamed.png' },
    });
    expect(renamed.ok()).toBe(true);

    const deleted = await request.delete('/__assets/api-assets/dot-renamed.png');
    expect(deleted.ok()).toBe(true);
    expect((await request.get('/__assets/api-assets/dot-renamed.png')).status()).toBe(404);
  });

  test('global assets live in the project assets directory', async ({ request }) => {
    await request.delete('/__assets/@global/logo.png');
    const uploaded = await request.post('/__assets/@global/logo.png', {
      headers: { 'content-type': 'application/octet-stream' },
      data: TINY_PNG,
    });
    expect(uploaded.ok()).toBe(true);
    expect(existsSync(path.join(devScratchDir, 'assets', 'logo.png'))).toBe(true);

    const deleted = await request.delete('/__assets/@global/logo.png');
    expect(deleted.ok()).toBe(true);
  });
});
