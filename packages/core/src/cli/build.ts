import path from 'node:path';
import { mergeConfig, build as viteBuild } from 'vite';
import { createViteConfig } from '../vite/config.ts';
import { createCliLogger, printHeader } from './ui.ts';

export interface BuildOptions {
  outDir?: string;
}

export async function build(opts: BuildOptions = {}): Promise<void> {
  printHeader('building for production');
  const base = await createViteConfig({ userCwd: process.cwd(), mode: 'build' });
  const config = mergeConfig(base, {
    customLogger: createCliLogger(),
    build: {
      ...(opts.outDir !== undefined ? { outDir: path.resolve(process.cwd(), opts.outDir) } : {}),
    },
  });
  await viteBuild(config);
}
