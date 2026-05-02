import path from 'node:path';
import { mergeConfig, build as viteBuild } from 'vite';
import { createViteConfig } from '../vite/config.ts';

export interface BuildOptions {
  outDir?: string;
}

export async function build(opts: BuildOptions = {}): Promise<void> {
  const base = await createViteConfig({ userCwd: process.cwd(), mode: 'build' });
  const config = mergeConfig(base, {
    build: {
      ...(opts.outDir !== undefined ? { outDir: path.resolve(process.cwd(), opts.outDir) } : {}),
    },
  });
  await viteBuild(config);
}
