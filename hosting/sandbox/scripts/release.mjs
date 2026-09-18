import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('..', import.meta.url));
const dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' });
if (dirty.trim())
  throw new Error(
    'Commit the release before deploying; image revisions must identify the exact source',
  );
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('A full commit SHA is required');
const config = JSON.parse(readFileSync(`${dir}/wrangler.jsonc`, 'utf8'));
config.containers[0].image_vars = { APP_REVISION: revision };
writeFileSync(`${dir}/wrangler.release.json`, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Staging release: ${revision}`);
execFileSync(
  'pnpm',
  ['exec', 'wrangler', 'deploy', '--config', 'wrangler.release.json', ...process.argv.slice(2)],
  { cwd: dir, stdio: 'inherit' },
);
