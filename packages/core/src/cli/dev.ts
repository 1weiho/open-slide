import { createServer } from 'vite';
import { createViteConfig } from '../vite/config.ts';

export async function dev(): Promise<void> {
  const config = await createViteConfig({ userCwd: process.cwd() });
  const server = await createServer(config);
  await server.listen();
  server.printUrls();
  server.bindCLIShortcuts({ print: true });
}
