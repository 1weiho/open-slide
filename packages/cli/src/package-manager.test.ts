import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { detectPackageManager, PACKAGE_MANAGERS } from './package-manager.ts';

describe('PACKAGE_MANAGERS', () => {
  it('lists every supported package manager', () => {
    expect(PACKAGE_MANAGERS).toEqual(['npm', 'pnpm', 'yarn', 'bun']);
  });
});

describe('detectPackageManager', () => {
  const original = process.env.npm_config_user_agent;

  beforeEach(() => {
    delete process.env.npm_config_user_agent;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.npm_config_user_agent;
    else process.env.npm_config_user_agent = original;
  });

  it('detects pnpm from the user agent', () => {
    process.env.npm_config_user_agent = 'pnpm/9.0.0 npm/? node/v20.0.0 linux x64';
    expect(detectPackageManager()).toBe('pnpm');
  });

  it('detects yarn from the user agent', () => {
    process.env.npm_config_user_agent = 'yarn/1.22.19 npm/? node/v20.0.0 linux x64';
    expect(detectPackageManager()).toBe('yarn');
  });

  it('detects bun from the user agent', () => {
    process.env.npm_config_user_agent = 'bun/1.0.0';
    expect(detectPackageManager()).toBe('bun');
  });

  it('falls back to npm when the user agent is unset', () => {
    expect(detectPackageManager()).toBe('npm');
  });

  it('falls back to npm when the user agent is unrecognized', () => {
    process.env.npm_config_user_agent = 'something-else/1.0.0';
    expect(detectPackageManager()).toBe('npm');
  });
});
