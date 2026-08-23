import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { devApiUrl, joinBase } from './dev-api.ts';

describe('joinBase', () => {
  it('leaves paths untouched for the root base', () => {
    expect(joinBase('/', '/__folders')).toBe('/__folders');
    expect(joinBase('/', '/__slides/intro')).toBe('/__slides/intro');
  });

  it('prefixes paths with a nested base', () => {
    expect(joinBase('/my-slides/', '/__folders')).toBe('/my-slides/__folders');
    expect(joinBase('/my-slides/', '/__slides/intro/reorder')).toBe(
      '/my-slides/__slides/intro/reorder',
    );
  });

  it('handles a nested base without a trailing slash', () => {
    expect(joinBase('/my-slides', '/__folders')).toBe('/my-slides/__folders');
  });

  it('handles a deeply nested base', () => {
    expect(joinBase('/team/decks/', '/__edit')).toBe('/team/decks/__edit');
  });

  it('falls back to root for empty or relative bases', () => {
    expect(joinBase('', '/__folders')).toBe('/__folders');
    expect(joinBase('./', '/__folders')).toBe('/__folders');
  });

  it('preserves query strings', () => {
    expect(joinBase('/my-slides/', '/__design?slideId=a')).toBe('/my-slides/__design?slideId=a');
  });
});

describe('devApiUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns root-absolute URLs when BASE_URL is /', () => {
    vi.stubEnv('BASE_URL', '/');
    expect(devApiUrl('/__folders')).toBe('/__folders');
  });

  it('keeps URLs beneath a configured base', () => {
    vi.stubEnv('BASE_URL', '/my-slides/');
    expect(devApiUrl('/__folders')).toBe('/my-slides/__folders');
    expect(devApiUrl('/__edit')).toBe('/my-slides/__edit');
    expect(devApiUrl('/__notes')).toBe('/my-slides/__notes');
  });
});

describe('app sources', () => {
  it('never fetch root-absolute /__ dev API URLs directly', async () => {
    const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const offenders: string[] = [];
    const walk = async (dir: string): Promise<void> => {
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
          const source = await fs.readFile(full, 'utf8');
          if (/fetch\(\s*['"`]\/__/.test(source)) {
            offenders.push(path.relative(appRoot, full));
          }
        }
      }
    };
    await walk(appRoot);
    expect(offenders, 'route these fetches through devApiUrl() so they honor BASE_URL').toEqual([]);
  });
});
