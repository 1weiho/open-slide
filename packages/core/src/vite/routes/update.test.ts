import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { detectPackageManager, updateCommandFor } from './update.ts';

async function tempProject(): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-update-'));
}

describe('update routes helpers', () => {
  const originalUserAgent = process.env.npm_config_user_agent;

  afterEach(() => {
    if (originalUserAgent === undefined) {
      delete process.env.npm_config_user_agent;
    } else {
      process.env.npm_config_user_agent = originalUserAgent;
    }
  });

  it('detects package managers from npm user agent first', async () => {
    const cwd = await tempProject();
    await fs.writeFile(path.join(cwd, 'pnpm-lock.yaml'), '');
    process.env.npm_config_user_agent = 'yarn/1.22.22 npm/? node/? darwin x64';

    await expect(detectPackageManager(cwd)).resolves.toBe('yarn');
  });

  it('detects package managers from lockfiles', async () => {
    const cwd = await tempProject();
    delete process.env.npm_config_user_agent;

    await fs.writeFile(path.join(cwd, 'pnpm-lock.yaml'), '');
    await expect(detectPackageManager(cwd)).resolves.toBe('pnpm');

    await fs.rm(path.join(cwd, 'pnpm-lock.yaml'));
    await fs.writeFile(path.join(cwd, 'bun.lock'), '');
    await expect(detectPackageManager(cwd)).resolves.toBe('bun');

    await fs.rm(path.join(cwd, 'bun.lock'));
    await fs.writeFile(path.join(cwd, 'package-lock.json'), '');
    await expect(detectPackageManager(cwd)).resolves.toBe('npm');
  });

  it('uses fixed update commands for each package manager', () => {
    expect(updateCommandFor('pnpm')).toEqual({
      cmd: 'pnpm',
      args: ['add', '@open-slide/core@latest'],
    });
    expect(updateCommandFor('yarn')).toEqual({
      cmd: 'yarn',
      args: ['add', '@open-slide/core@latest'],
    });
    expect(updateCommandFor('bun')).toEqual({
      cmd: 'bun',
      args: ['add', '@open-slide/core@latest'],
    });
    expect(updateCommandFor('npm')).toEqual({
      cmd: 'npm',
      args: ['install', '@open-slide/core@latest'],
    });
  });
});
