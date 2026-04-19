import { build as viteBuild } from 'vite';
import { createViteConfig } from '../vite/config.ts';

export async function build(): Promise<void> {
  const config = await createViteConfig({ userCwd: process.cwd(), mode: 'build' });
  await viteBuild(config);
}
