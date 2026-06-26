import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeContext, resolveSlideSourcePath } from './context.ts';

describe('resolveSlideSourcePath', () => {
  const ctx = makeContext({
    userCwd: '/repo',
    coreVersion: '0.0.0',
  });

  it('resolves index.tsx by default', () => {
    expect(resolveSlideSourcePath(ctx, 'deck')).toBe(path.resolve('/repo/slides/deck/index.tsx'));
  });

  it('resolves nested slide-local TSX files', () => {
    expect(resolveSlideSourcePath(ctx, 'deck', 'components/Card.tsx')).toBe(
      path.resolve('/repo/slides/deck/components/Card.tsx'),
    );
  });

  it('rejects traversal and non-source files', () => {
    expect(resolveSlideSourcePath(ctx, 'deck', '../other/index.tsx')).toBeNull();
    expect(resolveSlideSourcePath(ctx, 'deck', '/tmp/file.tsx')).toBeNull();
    expect(resolveSlideSourcePath(ctx, 'deck', 'index.test.tsx')).toBeNull();
    expect(resolveSlideSourcePath(ctx, 'deck', 'notes.ts')).toBeNull();
  });
});
