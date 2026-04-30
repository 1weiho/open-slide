import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CORE_SKILLS = path.resolve(HERE, '..', '..', 'core', 'skills');
const TEMPLATE_SKILLS = path.resolve(HERE, '..', 'template', '.agents', 'skills');

async function main() {
  if (!existsSync(CORE_SKILLS)) {
    throw new Error(`Canonical skills not found at ${CORE_SKILLS}.`);
  }

  const names = (await readdir(CORE_SKILLS, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  await mkdir(TEMPLATE_SKILLS, { recursive: true });
  for (const entry of await readdir(TEMPLATE_SKILLS)) {
    await rm(path.join(TEMPLATE_SKILLS, entry), { recursive: true, force: true });
  }

  for (const name of names) {
    const src = path.join(CORE_SKILLS, name);
    const dst = path.join(TEMPLATE_SKILLS, name);
    await cp(src, dst, { recursive: true });
  }

  process.stdout.write(`Mirrored ${names.length} skills into template/.agents/skills/.\n`);
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
});
