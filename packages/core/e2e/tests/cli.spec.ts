import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { coreRoot, fixtureDir, runCli } from './helpers.ts';

test.describe('open-slide cli', () => {
  test('prints the package version', async () => {
    const pkg = JSON.parse(await fs.readFile(path.join(coreRoot, 'package.json'), 'utf8')) as {
      version: string;
    };
    const res = await runCli(['-v'], coreRoot, 30_000);
    expect(res.code).toBe(0);
    expect(res.stdout.trim()).toBe(pkg.version);
  });

  test('lists commands in help output', async () => {
    const res = await runCli(['--help'], coreRoot, 30_000);
    expect(res.code).toBe(0);
    expect(res.stdout).toContain('Start the dev server');
    expect(res.stdout).toContain('Build a static site');
    expect(res.stdout).toContain('Preview the production build');
  });

  test('rejects an invalid port', async () => {
    const res = await runCli(['dev', '-p', 'abc'], fixtureDir, 30_000);
    expect(res.code).toBe(1);
    expect(res.stderr).toContain('Invalid port: abc');
  });
});
