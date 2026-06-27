import { existsSync } from 'node:fs';
import path from 'node:path';

const STANDALONE_ENTRY_EXTENSIONS = ['tsx', 'jsx', 'ts', 'js'] as const;

export function standaloneEntryCandidates(userCwd: string): string[] {
  return STANDALONE_ENTRY_EXTENSIONS.map((ext) => path.join(userCwd, `index.${ext}`));
}

export function findStandaloneEntry(userCwd: string): string | null {
  return standaloneEntryCandidates(userCwd).find((file) => existsSync(file)) ?? null;
}

export function resolveStandaloneEntry(userCwd: string): string {
  return findStandaloneEntry(userCwd) ?? path.join(userCwd, 'index.tsx');
}

export function isStandaloneEntryPath(userCwd: string, file: string): boolean {
  const resolvedFile = path.resolve(file);
  return standaloneEntryCandidates(userCwd).some(
    (candidate) => path.resolve(candidate) === resolvedFile,
  );
}

export function standalonePagePath(userCwd: string): string {
  return path.relative(userCwd, resolveStandaloneEntry(userCwd)).split(path.sep).join('/');
}
