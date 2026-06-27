import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STANDALONE_SLIDE_ID } from '../../editing/slide-ops.ts';
import { resolveSlidePath } from './context.ts';

async function withProject<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-context-'));
  try {
    return await fn(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

describe('resolveSlidePath', () => {
  it('resolves <userCwd>/<slidesDir>/<id>/index.tsx in workspace mode', () => {
    expect(resolveSlidePath('/repo', 'slides', 'cover')).toBe(
      path.resolve('/repo', 'slides', 'cover', 'index.tsx'),
    );
  });

  it('rejects invalid ids', () => {
    expect(resolveSlidePath('/repo', 'slides', '../escape')).toBeNull();
  });

  it('maps the synthetic id to the root index.tsx in standalone mode', () => {
    expect(resolveSlidePath('/repo', 'slides', STANDALONE_SLIDE_ID, 'standalone')).toBe(
      path.join('/repo', 'index.tsx'),
    );
  });

  it('maps the synthetic id to the resolved root entry in standalone mode', async () => {
    await withProject(async (root) => {
      await fs.writeFile(path.join(root, 'index.jsx'), '');
      expect(resolveSlidePath(root, 'slides', STANDALONE_SLIDE_ID, 'standalone')).toBe(
        path.join(root, 'index.jsx'),
      );
    });
  });

  it('rejects any other id in standalone mode', () => {
    expect(resolveSlidePath('/repo', 'slides', 'cover', 'standalone')).toBeNull();
  });
});
