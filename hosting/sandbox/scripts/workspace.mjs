import { execFile } from 'node:child_process';
import { lstat, mkdir, readFile, realpath, rename, symlink } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const root = '/workspace/project';
const paths = JSON.parse(process.env.CONTENT_PATHS);
if (!Array.isArray(paths) || paths.some((p) => !/^[a-z][a-z0-9-]*$/.test(p))) {
  throw new Error('Invalid content paths');
}
async function git(args, cwd = root) {
  return (await exec('git', ['-c', 'core.hooksPath=/dev/null', ...args], { cwd })).stdout;
}
async function exists(file) {
  try {
    await lstat(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}
async function save() {
  const tracked = (await git(['ls-files'])).split('\n');
  const selected = [];
  for (const dir of paths) {
    if ((await exists(`${root}/${dir}`)) || tracked.some((f) => f.startsWith(`${dir}/`)))
      selected.push(dir);
  }
  if (selected.length) await git(['add', '-A', '--', ...selected]);
  if ((await git(['diff', '--cached', '--name-only'])).trim()) {
    await git([
      '-c',
      'user.name=Autono',
      '-c',
      'user.email=apps@autono.co',
      'commit',
      '-m',
      'Save workspace edits',
    ]);
  }
  await git(['push', 'origin', 'HEAD:main']);
  return (await git(['rev-parse', 'HEAD'])).trim();
}
async function main() {
  const action = process.argv[2];
  if (action === 'init') {
    if (!(await exists(`${root}/.git`))) {
      await mkdir('/workspace', { recursive: true });
      // Clone separately so an interrupted clone never appears initialized.
      const temp = `/workspace/restore-${crypto.randomUUID()}`;
      await git(
        ['clone', '--branch', 'main', '--', process.env.ARTIFACTS_REMOTE, temp],
        '/workspace',
      );
      await rename(temp, root);
    }
    for (const dir of paths) await mkdir(`${root}/${dir}`, { recursive: true });
    if (!(await exists(`${root}/node_modules`)))
      await symlink('/opt/app/node_modules', `${root}/node_modules`);
    return { restored: true, revision: (await git(['rev-parse', 'HEAD'])).trim() };
  }
  if (action === 'save') return { saved: true, revision: await save() };
  if (action === 'resolve') {
    const relative = process.argv[3];
    if (
      !relative ||
      !paths.includes(relative.split('/')[0]) ||
      relative.split('/').some((part) => !part || part === '.' || part === '..') ||
      relative.includes('\\')
    )
      throw new Error('Invalid content path');
    const target = path.join(root, relative);
    let parent = path.dirname(target);
    while (!(await exists(parent))) parent = path.dirname(parent);
    if (!(await realpath(parent)).startsWith(`${root}/`) && (await realpath(parent)) !== root)
      throw new Error('Path escapes workspace');
    if ((await exists(target)) && !(await realpath(target)).startsWith(`${root}/`))
      throw new Error('Path escapes workspace');
    await mkdir(path.dirname(target), { recursive: true });
    return { path: target };
  }
  if (action === 'version')
    return { revision: (await readFile('/opt/app-revision', 'utf8')).trim() };
  throw new Error('Unknown workspace command');
}
main()
  .then((result) => console.log(JSON.stringify(result)))
  .catch((error) => {
    // Git errors can contain authenticated remote URLs; never return raw stderr.
    console.error(`Workspace ${process.argv[2]} failed: ${error.code ?? 'operation_failed'}`);
    process.exitCode = 1;
  });
