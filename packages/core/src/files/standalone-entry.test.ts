import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findStandaloneEntry,
  isStandaloneEntryPath,
  standaloneEntryCandidates,
  standalonePagePath,
} from './standalone-entry.ts';

function withTempProject(fn: (dir: string) => void) {
  const dir = mkdtempSync(path.join(tmpdir(), 'open-slide-entry-'));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('standalone entry helpers', () => {
  it('finds the first supported root entry by extension priority', () => {
    withTempProject((dir) => {
      writeFileSync(path.join(dir, 'index.jsx'), '');
      writeFileSync(path.join(dir, 'index.ts'), '');

      expect(findStandaloneEntry(dir)).toBe(path.join(dir, 'index.jsx'));
      expect(standalonePagePath(dir)).toBe('index.jsx');
    });
  });

  it('matches all supported standalone entry paths for watcher events', () => {
    withTempProject((dir) => {
      expect(standaloneEntryCandidates(dir)).toEqual([
        path.join(dir, 'index.tsx'),
        path.join(dir, 'index.jsx'),
        path.join(dir, 'index.ts'),
        path.join(dir, 'index.js'),
      ]);
      expect(isStandaloneEntryPath(dir, path.join(dir, 'index.js'))).toBe(true);
      expect(isStandaloneEntryPath(dir, path.join(dir, 'slides', 'cover', 'index.tsx'))).toBe(
        false,
      );
    });
  });
});
