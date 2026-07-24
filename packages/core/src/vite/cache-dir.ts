import path from 'node:path';

// Vite defaults its optimize-deps cache to `<nearest package.json>/node_modules/.vite`.
// Our `root` points inside the installed @open-slide/core package, so that default
// lands the cache under node_modules/@open-slide/core/node_modules/.vite — inside the
// very directory the in-app updater swaps out on upgrade, leaving Vite referencing
// chunks that no longer exist. Pin it to the user's project root instead.
export function resolveViteCacheDir(userCwd: string): string {
  return path.join(userCwd, 'node_modules', '.vite');
}
