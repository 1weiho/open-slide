import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HELP = `open-slide — author slides, we handle the Vite/React stack

Usage:
  open-slide dev              Start dev server
  open-slide build            Build a static site
  open-slide preview          Preview the production build
  open-slide --help           Show this message
  open-slide --version        Print version
`;

async function readVersion(): Promise<string> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  // dist/cli/bin.js → ../../package.json
  const pkgPath = path.resolve(here, '..', '..', 'package.json');
  const raw = await readFile(pkgPath, 'utf8');
  return (JSON.parse(raw) as { version: string }).version;
}

export async function run(argv: string[]): Promise<void> {
  const [cmd] = argv;

  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    process.stdout.write(HELP);
    return;
  }

  if (cmd === '--version' || cmd === '-v') {
    process.stdout.write(`${await readVersion()}\n`);
    return;
  }

  if (cmd === 'dev') {
    const { dev } = await import('./dev.ts');
    await dev();
    return;
  }

  if (cmd === 'build') {
    const { build } = await import('./build.ts');
    await build();
    return;
  }

  if (cmd === 'preview') {
    const { preview } = await import('./preview.ts');
    await preview();
    return;
  }

  process.stderr.write(`Unknown command: ${cmd}\n\n${HELP}`);
  process.exit(1);
}
