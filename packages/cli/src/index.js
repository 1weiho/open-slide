import { init } from './init.js';

const HELP = `openslide — scaffold an open-slide deck workspace

Usage:
  openslide init [dir]    Create a new open-slide workspace (defaults to .)
  openslide --help        Show this message
  openslide --version     Print version

Flags for \`init\`:
  --force, -f             Overwrite non-empty target directory
  --name <name>           Override package name (defaults to folder name)
`;

async function readVersion() {
  const { readFile } = await import('node:fs/promises');
  const { fileURLToPath } = await import('node:url');
  const { dirname, join } = await import('node:path');
  const here = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(await readFile(join(here, '..', 'package.json'), 'utf8'));
  return pkg.version;
}

export async function run(argv) {
  const [cmd, ...rest] = argv;

  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    process.stdout.write(HELP);
    return;
  }

  if (cmd === '--version' || cmd === '-v') {
    process.stdout.write(`${await readVersion()}\n`);
    return;
  }

  if (cmd === 'init') {
    const opts = parseInitFlags(rest);
    await init(opts);
    return;
  }

  process.stderr.write(`Unknown command: ${cmd}\n\n${HELP}`);
  process.exit(1);
}

function parseInitFlags(args) {
  const opts = { dir: '.', force: false, name: undefined };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--force' || a === '-f') {
      opts.force = true;
    } else if (a === '--name') {
      opts.name = args[++i];
    } else if (a.startsWith('-')) {
      throw new Error(`Unknown flag: ${a}`);
    } else {
      opts.dir = a;
    }
  }
  return opts;
}
