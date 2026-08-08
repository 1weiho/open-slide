import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findViteMismatch, formatViteMismatch } from './preflight.ts';

let root: string;

function addPackage(rel: string, version: string): void {
  const dir = path.join(root, 'node_modules', rel);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: rel, version }));
}

function coreDir(): string {
  const dir = path.join(root, 'node_modules', '@open-slide', 'core', 'dist', 'cli');
  mkdirSync(dir, { recursive: true });
  return dir;
}

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'open-slide-preflight-'));
  addPackage('@open-slide/core', '2.0.0');
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('findViteMismatch', () => {
  it('flags a hoisted plugin that resolves a different vite than core', () => {
    addPackage('vite', '5.4.21');
    addPackage('@vitejs/plugin-react', '6.1.1');
    addPackage('@open-slide/core/node_modules/vite', '8.2.2');

    const mismatch = findViteMismatch(coreDir());
    expect(mismatch).not.toBeNull();
    expect(mismatch?.consumer).toBe('@vitejs/plugin-react');
    expect(mismatch?.coreVite.version).toBe('8.2.2');
    expect(mismatch?.consumerVite.version).toBe('5.4.21');
  });

  it('passes when the plugin is nested next to core vite', () => {
    addPackage('vite', '5.4.21');
    addPackage('@open-slide/core/node_modules/vite', '8.2.2');
    addPackage('@open-slide/core/node_modules/@vitejs/plugin-react', '6.1.1');

    expect(findViteMismatch(coreDir())).toBeNull();
  });

  it('passes when everything is hoisted onto a single vite', () => {
    addPackage('vite', '8.2.2');
    addPackage('@vitejs/plugin-react', '6.1.1');
    addPackage('@tailwindcss/vite', '4.3.3');

    expect(findViteMismatch(coreDir())).toBeNull();
  });

  it('passes when two copies of the same vite version coexist', () => {
    addPackage('vite', '8.2.2');
    addPackage('@vitejs/plugin-react', '6.1.1');
    addPackage('@open-slide/core/node_modules/vite', '8.2.2');

    expect(findViteMismatch(coreDir())).toBeNull();
  });

  it('checks every consumer, not just the first', () => {
    addPackage('vite', '5.4.21');
    addPackage('@tailwindcss/vite', '4.3.3');
    addPackage('@open-slide/core/node_modules/vite', '8.2.2');
    addPackage('@open-slide/core/node_modules/@vitejs/plugin-react', '6.1.1');

    expect(findViteMismatch(coreDir())?.consumer).toBe('@tailwindcss/vite');
  });

  it('passes when vite cannot be located at all', () => {
    expect(findViteMismatch(coreDir())).toBeNull();
  });
});

describe('formatViteMismatch', () => {
  it('names both copies relative to the workspace and links the guide', () => {
    addPackage('vite', '5.4.21');
    addPackage('@vitejs/plugin-react', '6.1.1');
    addPackage('@open-slide/core/node_modules/vite', '8.2.2');

    const mismatch = findViteMismatch(coreDir());
    if (!mismatch) throw new Error('expected a mismatch');
    const message = formatViteMismatch(mismatch, root);

    expect(message).toContain('@vitejs/plugin-react resolves vite@5.4.21');
    expect(message).toContain(path.join('node_modules', 'vite'));
    expect(message).toContain('@open-slide/core ships vite@8.2.2');
    expect(message).toContain('migrate-to-v2');
  });
});
