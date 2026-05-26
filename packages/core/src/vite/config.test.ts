import { describe, expect, it } from 'vitest';
import { createViteConfig } from './config.ts';

describe('createViteConfig', () => {
  it('allows the Vite workspace root so pnpm dependency assets can load', async () => {
    const config = await createViteConfig({
      config: {},
      userCwd: process.cwd(),
    });

    expect(config.server?.fs?.allow).toContain(process.cwd());
  });
});
