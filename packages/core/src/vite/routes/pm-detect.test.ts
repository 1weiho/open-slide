import { mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectPackageManager, installCommand } from './pm-detect.ts';

function makeFixture(setup: (dir: string) => void): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'pm-detect-'));
  setup(dir);
  return dir;
}

describe('detectPackageManager', () => {
  it('honors corepack `packageManager` field in package.json', () => {
    const cwd = makeFixture((dir) => {
      writeFileSync(
        path.join(dir, 'package.json'),
        JSON.stringify({ name: 'x', packageManager: 'pnpm@10.17.0' }),
      );
    });
    expect(detectPackageManager(cwd).name).toBe('pnpm');
  });

  it('detects pnpm via pnpm-lock.yaml', () => {
    const cwd = makeFixture((dir) => {
      writeFileSync(path.join(dir, 'package.json'), '{}');
      writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '');
    });
    expect(detectPackageManager(cwd).name).toBe('pnpm');
  });

  it('detects npm via package-lock.json', () => {
    const cwd = makeFixture((dir) => {
      writeFileSync(path.join(dir, 'package.json'), '{}');
      writeFileSync(path.join(dir, 'package-lock.json'), '{}');
    });
    expect(detectPackageManager(cwd).name).toBe('npm');
  });

  it('detects yarn via yarn.lock', () => {
    const cwd = makeFixture((dir) => {
      writeFileSync(path.join(dir, 'package.json'), '{}');
      writeFileSync(path.join(dir, 'yarn.lock'), '');
    });
    expect(detectPackageManager(cwd).name).toBe('yarn');
  });

  it('detects bun via bun.lockb', () => {
    const cwd = makeFixture((dir) => {
      writeFileSync(path.join(dir, 'package.json'), '{}');
      writeFileSync(path.join(dir, 'bun.lockb'), '');
    });
    expect(detectPackageManager(cwd).name).toBe('bun');
  });

  it('detects bun via bun.lock (current text default)', () => {
    const cwd = makeFixture((dir) => {
      writeFileSync(path.join(dir, 'package.json'), '{}');
      writeFileSync(path.join(dir, 'bun.lock'), '');
    });
    expect(detectPackageManager(cwd).name).toBe('bun');
  });

  it('falls back to pnpm when nothing is found', () => {
    const cwd = makeFixture((dir) => {
      writeFileSync(path.join(dir, 'package.json'), '{}');
    });
    expect(detectPackageManager(cwd).name).toBe('pnpm');
  });
});

describe('installCommand', () => {
  it('emits pnpm form', () => {
    expect(installCommand({ name: 'pnpm' }, '@x/y')).toBe('pnpm add -D @x/y');
  });
  it('emits npm form', () => {
    expect(installCommand({ name: 'npm' }, '@x/y')).toBe('npm install --save-dev @x/y');
  });
  it('emits yarn form', () => {
    expect(installCommand({ name: 'yarn' }, '@x/y')).toBe('yarn add --dev @x/y');
  });
  it('emits bun form', () => {
    expect(installCommand({ name: 'bun' }, '@x/y')).toBe('bun add -d @x/y');
  });
});
