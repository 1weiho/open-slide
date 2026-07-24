import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveViteCacheDir } from './cache-dir.ts';

describe('resolveViteCacheDir', () => {
  it('points at the user project root, not the installed core package', () => {
    const cwd = path.join(path.sep, 'Users', 'david', 'slides');
    expect(resolveViteCacheDir(cwd)).toBe(path.join(cwd, 'node_modules', '.vite'));
  });
});
