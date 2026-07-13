import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const FOLDER_ID_RE = /^f-[a-f0-9]{8}$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export type FolderIcon = { type: 'emoji'; value: string } | { type: 'color'; value: string };

export type Folder = {
  id: string;
  name: string;
  icon: FolderIcon;
};

export type FoldersManifest = {
  folders: Folder[];
  assignments: Record<string, string>;
};

function emptyManifest(): FoldersManifest {
  return { folders: [], assignments: {} };
}

export async function readManifest(file: string): Promise<FoldersManifest> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as Partial<FoldersManifest>;
    return {
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      assignments:
        parsed.assignments && typeof parsed.assignments === 'object'
          ? (parsed.assignments as Record<string, string>)
          : {},
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return emptyManifest();
    throw err;
  }
}

// Serialize writes to the same manifest file so concurrent mutations don't
// physically interleave, and write atomically (temp file + rename) so a crash
// mid-write can't truncate the manifest.
const manifestWriteChains = new Map<string, Promise<unknown>>();

export async function writeManifest(file: string, manifest: FoldersManifest): Promise<void> {
  const prev = manifestWriteChains.get(file) ?? Promise.resolve();
  const run = prev
    .catch(() => {})
    .then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${randomUUID().slice(0, 8)}.tmp`;
      await fs.writeFile(tmp, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
      await fs.rename(tmp, file);
    });
  manifestWriteChains.set(file, run.catch(() => {}));
  return run;
}

export type ManifestMutation = { write: boolean; status: number; body: unknown };

// Run a read-modify-write against a manifest exclusively. Serializing the whole
// read+mutate+write per file (not just the write) closes the lost-update race
// where two handlers both read a stale copy and the later write drops the
// earlier mutation. The mutator decides whether to persist and what to respond.
const manifestUpdateChains = new Map<string, Promise<unknown>>();

export async function updateManifest(
  file: string,
  mutate: (manifest: FoldersManifest) => ManifestMutation,
): Promise<{ status: number; body: unknown }> {
  const prev = manifestUpdateChains.get(file) ?? Promise.resolve();
  const run = prev
    .catch(() => {})
    .then(async () => {
      const manifest = await readManifest(file);
      const { write, status, body } = mutate(manifest);
      if (write) await writeManifest(file, manifest);
      return { status, body };
    });
  manifestUpdateChains.set(file, run.catch(() => {}));
  return run;
}

export function newFolderId(): string {
  return `f-${randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

export function validateName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (trimmed.length < 1 || trimmed.length > 40) return null;
  return trimmed;
}

export function validateReorder(v: unknown, current: Folder[]): string[] | null {
  if (!Array.isArray(v) || v.length !== current.length) return null;
  const known = new Set(current.map((f) => f.id));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of v) {
    if (typeof id !== 'string' || !FOLDER_ID_RE.test(id)) return null;
    if (!known.has(id) || seen.has(id)) return null;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function validateIcon(v: unknown): FolderIcon | null {
  if (!v || typeof v !== 'object') return null;
  const icon = v as { type?: unknown; value?: unknown };
  if (icon.type === 'emoji') {
    if (typeof icon.value !== 'string') return null;
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    const realLength = [...segmenter.segment(icon.value)].length;
    if (realLength < 1 || realLength > 8) return null;
    return { type: 'emoji', value: icon.value };
  }
  if (icon.type === 'color') {
    if (typeof icon.value !== 'string' || !COLOR_RE.test(icon.value)) return null;
    return { type: 'color', value: icon.value };
  }
  return null;
}
