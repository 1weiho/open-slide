import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createViteConfig } from './config.ts';

type VirtualExternalsPlugin = {
  name: string;
  resolveId?: (id: string) => { id: string; external: true } | undefined;
};

describe('createViteConfig', () => {
  it('uses native optimizeDeps.rolldownOptions and excludes virtual modules', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-vite-config-'));
    try {
      await fs.mkdir(path.join(root, 'slides'), { recursive: true });
      const config = await createViteConfig({ userCwd: root });
      const optimizeDeps = config.optimizeDeps;

      expect(optimizeDeps).toBeDefined();
      expect(optimizeDeps).not.toHaveProperty('esbuildOptions');

      const plugins = optimizeDeps?.rolldownOptions?.plugins;
      expect(Array.isArray(plugins)).toBe(true);

      const plugin = (plugins as VirtualExternalsPlugin[]).find(
        (entry) => entry?.name === 'open-slide:virtual-externals',
      );
      expect(plugin).toBeDefined();
      expect(plugin?.resolveId?.('virtual:open-slide/slides')).toEqual({
        id: 'virtual:open-slide/slides',
        external: true,
      });
      expect(plugin?.resolveId?.('virtual:open-slide/config')).toEqual({
        id: 'virtual:open-slide/config',
        external: true,
      });
      expect(plugin?.resolveId?.('react')).toBeUndefined();
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
