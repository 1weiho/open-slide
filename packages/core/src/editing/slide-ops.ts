import fs from 'node:fs/promises';
import path from 'node:path';
import { parse as babelParse } from '@babel/parser';
import * as t from '@babel/types';
import { parseSource, walkAll } from './babel-walk.ts';
import { applySplices, type Splice } from './edit-ops.ts';

export const SLIDE_ID_RE = /^[a-z0-9_-]+$/i;

type MetaTitleRead =
  | { kind: 'found'; title: string }
  | { kind: 'missing' }
  | { kind: 'unsupported' };

export function validateSlideName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (trimmed.length < 1 || trimmed.length > 80) return null;
  return trimmed;
}

function unwrapExpression(
  node: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  let current = node;
  while (
    current &&
    (current.type === 'TSAsExpression' || current.type === 'TSSatisfiesExpression')
  ) {
    current = current.expression as Record<string, unknown> | undefined;
  }
  return current;
}

function readMetaTitleInSource(source: string): MetaTitleRead {
  let ast: unknown;
  try {
    ast = babelParse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    });
  } catch {
    return { kind: 'unsupported' };
  }

  const body = (ast as { program?: { body?: Array<Record<string, unknown>> } }).program?.body ?? [];
  for (const stmt of body) {
    if (stmt.type !== 'ExportNamedDeclaration') continue;
    const decl = stmt.declaration as Record<string, unknown> | undefined;
    if (decl?.type !== 'VariableDeclaration') continue;
    const declarations = (decl.declarations as Array<Record<string, unknown>> | undefined) ?? [];
    for (const d of declarations) {
      const id = d.id as Record<string, unknown> | undefined;
      if (id?.type !== 'Identifier' || id.name !== 'meta') continue;
      const init = unwrapExpression(d.init as Record<string, unknown> | undefined);
      if (init?.type !== 'ObjectExpression') return { kind: 'unsupported' };
      const properties = (init.properties as Array<Record<string, unknown>> | undefined) ?? [];
      for (const property of properties) {
        if (property.type !== 'ObjectProperty' || property.computed) continue;
        const key = property.key as Record<string, unknown> | undefined;
        const keyName =
          key?.type === 'Identifier'
            ? key.name
            : key?.type === 'StringLiteral'
              ? key.value
              : undefined;
        if (keyName !== 'title') continue;

        const value = property.value as Record<string, unknown> | undefined;
        if (value?.type === 'StringLiteral' && typeof value.value === 'string') {
          return { kind: 'found', title: value.value };
        }
        if (value?.type === 'TemplateLiteral') {
          const expressions = (value.expressions as unknown[] | undefined) ?? [];
          const quasis = (value.quasis as Array<Record<string, unknown>> | undefined) ?? [];
          const firstValue = quasis[0]?.value as Record<string, unknown> | undefined;
          const cooked = firstValue?.cooked;
          const raw = firstValue?.raw;
          if (expressions.length === 0 && typeof (cooked ?? raw) === 'string') {
            return { kind: 'found', title: (cooked ?? raw) as string };
          }
        }
        return { kind: 'unsupported' };
      }
      return { kind: 'missing' };
    }
  }

  return { kind: 'missing' };
}

export async function rmSlideDir(slidesRoot: string, slideId: string): Promise<boolean> {
  if (!SLIDE_ID_RE.test(slideId)) return false;
  const dir = path.resolve(slidesRoot, slideId);
  if (!dir.startsWith(slidesRoot + path.sep)) return false;
  try {
    await fs.rm(dir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

export async function duplicateSlideDir(
  slidesRoot: string,
  slideId: string,
  desiredId?: string,
): Promise<{ ok: true; slideId: string } | { ok: false; status: number; error: string }> {
  if (!SLIDE_ID_RE.test(slideId)) return { ok: false, status: 400, error: 'invalid slideId' };

  const root = path.resolve(slidesRoot);
  const srcDir = path.resolve(root, slideId);
  if (!srcDir.startsWith(root + path.sep)) {
    return { ok: false, status: 400, error: 'invalid slideId' };
  }

  try {
    await fs.access(path.join(srcDir, 'index.tsx'));
  } catch {
    return { ok: false, status: 404, error: 'slide not found' };
  }

  let newId: string;
  if (desiredId !== undefined) {
    if (!SLIDE_ID_RE.test(desiredId)) return { ok: false, status: 400, error: 'invalid newId' };
    newId = desiredId;
    const dstDir = path.resolve(root, newId);
    if (!dstDir.startsWith(root + path.sep)) {
      return { ok: false, status: 400, error: 'invalid newId' };
    }
    try {
      await fs.access(dstDir);
      return { ok: false, status: 409, error: 'slide already exists' };
    } catch {}
  } else {
    let suffix = 1;
    while (true) {
      newId = suffix === 1 ? `${slideId}-copy` : `${slideId}-copy-${suffix}`;
      try {
        await fs.access(path.resolve(root, newId));
        suffix++;
      } catch {
        break;
      }
    }
  }

  const dstDir = path.resolve(root, newId);
  if (!dstDir.startsWith(root + path.sep)) {
    return { ok: false, status: 400, error: 'invalid newId' };
  }

  const srcEntry = path.join(srcDir, 'index.tsx');
  let copiedEntrySource: string;
  try {
    const source = await fs.readFile(srcEntry, 'utf8');
    const metaTitle = readMetaTitleInSource(source);
    if (metaTitle.kind === 'unsupported') {
      return { ok: false, status: 422, error: 'could not update copied slide title' };
    }
    const title = metaTitle.kind === 'found' ? metaTitle.title : slideId;
    const updated = updateMetaTitleInSource(source, `${title} (copy)`);
    if (updated === null) {
      return { ok: false, status: 422, error: 'could not update copied slide title' };
    }
    copiedEntrySource = updated;
  } catch {
    return { ok: false, status: 404, error: 'slide not found' };
  }

  try {
    await fs.cp(srcDir, dstDir, { recursive: true, errorOnExist: true, force: false });
    await fs.writeFile(path.join(dstDir, 'index.tsx'), copiedEntrySource, 'utf8');
    return { ok: true, slideId: newId };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
      return { ok: false, status: 409, error: 'slide already exists' };
    }
    return { ok: false, status: 500, error: String((err as Error).message ?? err) };
  }
}

export function resolveSlideEntry(slidesRoot: string, slideId: string): string | null {
  if (!SLIDE_ID_RE.test(slideId)) return null;
  const dir = path.resolve(slidesRoot, slideId);
  if (!dir.startsWith(slidesRoot + path.sep)) return null;
  // The SlideMeta contract says every slide has slides/<id>/index.tsx; we only
  // edit that file to keep the write surface tiny and predictable.
  return path.join(dir, 'index.tsx');
}

function escapeSingleQuoted(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Rewrite (or insert) the `title` field in the slide module's `export const meta`.
 *
 * Strategy:
 *   1. Find `export const meta` and brace-match its object literal.
 *   2. If the object already has a `title: '...'` entry, replace the literal.
 *   3. If the object exists but has no title, inject a new `title: '...'` line
 *      as the first property (preserving the author's surrounding indentation).
 *   4. If there is no `meta` export at all, insert a fresh one right before
 *      `export default`.
 *
 * Returns the rewritten source, or `null` if the file shape was too surprising
 * to touch safely (e.g. `export default` missing when we'd need to inject meta).
 */
export function updateMetaTitleInSource(source: string, title: string): string | null {
  const newLiteral = `'${escapeSingleQuoted(title)}'`;

  const metaStart = source.search(/export\s+const\s+meta\b/);
  if (metaStart !== -1) {
    const eqIdx = source.indexOf('=', metaStart);
    if (eqIdx === -1) return null;
    const openBrace = source.indexOf('{', eqIdx);
    if (openBrace === -1) return null;

    let depth = 0;
    let closeBrace = -1;
    for (let i = openBrace; i < source.length; i++) {
      const ch = source[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          closeBrace = i;
          break;
        }
      }
    }
    if (closeBrace === -1) return null;

    const body = source.slice(openBrace + 1, closeBrace);
    const titleRe = /(^|[\s,{])(title\s*:\s*)(['"`])((?:\\.|(?!\3).)*)\3/;
    const match = body.match(titleRe);
    if (match) {
      const newBody = body.replace(titleRe, `${match[1]}${match[2]}${newLiteral}`);
      return source.slice(0, openBrace + 1) + newBody + source.slice(closeBrace);
    }

    // No title yet — inject as the first property, copying the indentation of
    // the first existing property (or a sensible default for an empty object).
    const firstIndentMatch = body.match(/\n([ \t]+)\S/);
    const indent = firstIndentMatch ? firstIndentMatch[1] : '  ';
    const trimmedBody = body.replace(/^\s*\n?/, '');
    const needsSeparator = trimmedBody.trim().length > 0;
    const insertion = `\n${indent}title: ${newLiteral}${needsSeparator ? ',' : ''}`;
    return source.slice(0, openBrace + 1) + insertion + body + source.slice(closeBrace);
  }

  const exportDefaultIdx = source.search(/export\s+default\b/);
  if (exportDefaultIdx === -1) return null;
  const insertion = `export const meta: SlideMeta = { title: ${newLiteral} };\n\n`;
  return source.slice(0, exportDefaultIdx) + insertion + source.slice(exportDefaultIdx);
}

type ArrayElementRange = { start: number; end: number };

function findDefaultExportArray(
  source: string,
): { elements: ArrayElementRange[]; arrayStart: number; arrayEnd: number } | null {
  let ast: unknown;
  try {
    ast = babelParse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    });
  } catch {
    return null;
  }
  const body = (ast as { program?: { body?: Array<Record<string, unknown>> } }).program?.body ?? [];
  for (const node of body) {
    if (node.type !== 'ExportDefaultDeclaration') continue;
    let inner = node.declaration as Record<string, unknown> | undefined;
    while (inner && (inner.type === 'TSAsExpression' || inner.type === 'TSSatisfiesExpression')) {
      inner = inner.expression as Record<string, unknown> | undefined;
    }
    if (inner?.type !== 'ArrayExpression') return null;
    const arrayStart = inner.start as number;
    const arrayEnd = inner.end as number;
    const rawElements = (inner.elements as Array<Record<string, unknown> | null>) ?? [];
    const elements: ArrayElementRange[] = [];
    for (const el of rawElements) {
      if (!el || typeof el.start !== 'number' || typeof el.end !== 'number') return null;
      elements.push({ start: el.start as number, end: el.end as number });
    }
    return { elements, arrayStart, arrayEnd };
  }
  return null;
}

/**
 * Rewrite `export default [...]` so its elements appear in the requested order.
 *
 * `order[i]` is the original index that should land at new position `i`. The
 * function preserves each element's exact source slice (including any inline
 * comments that hug an identifier) and keeps the inter-element separator slots
 * in their original positions, so a 3-page array `[A, B, C]` reordered to
 * `[2, 0, 1]` becomes `[C, A, B]` with the same indentation and trailing
 * commas the author wrote.
 *
 * Returns `null` when the file's default export isn't an array literal, or the
 * order is not a valid permutation of `[0, n-1]`.
 */
export function reorderDefaultExportPagesInSource(source: string, order: number[]): string | null {
  const found = findDefaultExportArray(source);
  if (!found) return null;
  const { elements, arrayStart, arrayEnd } = found;
  const n = elements.length;
  if (order.length !== n) return null;
  const seen = new Set<number>();
  for (const idx of order) {
    if (!Number.isInteger(idx) || idx < 0 || idx >= n) return null;
    if (seen.has(idx)) return null;
    seen.add(idx);
  }
  if (n === 0) return source;

  let identity = true;
  for (let i = 0; i < n; i++) {
    if (order[i] !== i) {
      identity = false;
      break;
    }
  }
  if (identity) return source;

  const prefix = source.slice(arrayStart, elements[0].start);
  const suffix = source.slice(elements[n - 1].end, arrayEnd);
  const separators: string[] = [];
  for (let i = 0; i < n - 1; i++) {
    separators.push(source.slice(elements[i].end, elements[i + 1].start));
  }
  const elementText = elements.map((el) => source.slice(el.start, el.end));

  let rebuilt = prefix + elementText[order[0]];
  for (let i = 1; i < n; i++) {
    rebuilt += separators[i - 1] + elementText[order[i]];
  }
  rebuilt += suffix;

  return source.slice(0, arrayStart) + rebuilt + source.slice(arrayEnd);
}

type NotesArrayInfo = {
  arrayStart: number;
  arrayEnd: number;
  elementTexts: string[];
};

function findNotesArray(source: string): NotesArrayInfo | null | 'invalid' {
  let ast: unknown;
  try {
    ast = babelParse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    });
  } catch {
    return 'invalid';
  }
  const body = (ast as { program?: { body?: Array<Record<string, unknown>> } }).program?.body ?? [];
  for (const stmt of body) {
    if (stmt.type !== 'ExportNamedDeclaration') continue;
    const decl = stmt.declaration as Record<string, unknown> | undefined;
    if (decl?.type !== 'VariableDeclaration') continue;
    const declarations = (decl.declarations as Array<Record<string, unknown>> | undefined) ?? [];
    for (const d of declarations) {
      const id = d.id as Record<string, unknown> | undefined;
      if (id?.type !== 'Identifier' || id.name !== 'notes') continue;
      const init = d.init as Record<string, unknown> | undefined;
      if (init?.type !== 'ArrayExpression') return 'invalid';
      const arrayStart = init.start as number | undefined;
      const arrayEnd = init.end as number | undefined;
      if (typeof arrayStart !== 'number' || typeof arrayEnd !== 'number') return 'invalid';
      const rawElements = (init.elements as Array<Record<string, unknown> | null>) ?? [];
      const elementTexts: string[] = [];
      for (const el of rawElements) {
        if (el === null) {
          elementTexts.push('undefined');
          continue;
        }
        if (el.type === 'SpreadElement') return 'invalid';
        const start = el.start as number | undefined;
        const end = el.end as number | undefined;
        if (typeof start !== 'number' || typeof end !== 'number') return 'invalid';
        elementTexts.push(source.slice(start, end));
      }
      return { arrayStart, arrayEnd, elementTexts };
    }
  }
  return null;
}

/**
 * Reorder `export const notes = [...]` to follow the page-array reorder.
 *
 * `order[i]` is the original page index that should land at new position `i`.
 * The notes array is index-aligned with the pages array but may be shorter
 * (trailing `undefined` slots are routinely trimmed). Missing elements are
 * treated as `undefined`, and trailing `undefined` is trimmed again after
 * reordering to keep the file tidy.
 *
 * Returns the rewritten source, the original source if no `notes` export
 * exists or the reorder is a no-op, or `null` if the `notes` export's shape
 * is too surprising to touch safely.
 */
export function reorderNotesArrayInSource(source: string, order: number[]): string | null {
  for (const idx of order) {
    if (!Number.isInteger(idx) || idx < 0) return null;
  }
  const found = findNotesArray(source);
  if (found === 'invalid') return null;
  if (found === null) return source;

  const { arrayStart, arrayEnd, elementTexts } = found;
  const pick = (i: number): string =>
    i >= 0 && i < elementTexts.length ? elementTexts[i] : 'undefined';
  return rebuildNotesArray(source, arrayStart, arrayEnd, order.map(pick));
}

/**
 * Remove the note aligned with the page at `index` so the `notes` export stays
 * index-aligned with `export default [...]` after a page deletion. Mirrors
 * {@link removePageFromDefaultExportInSource}.
 *
 * Returns the rewritten source, the original source if no `notes` export exists
 * or the index falls past the recorded notes, or `null` if the `notes` export's
 * shape is too surprising to touch safely.
 */
export function removeNotesElementInSource(source: string, index: number): string | null {
  if (!Number.isInteger(index) || index < 0) return null;
  const found = findNotesArray(source);
  if (found === 'invalid') return null;
  if (found === null) return source;

  const { arrayStart, arrayEnd, elementTexts } = found;
  if (index >= elementTexts.length) return source;
  const next = elementTexts.slice();
  next.splice(index, 1);
  return rebuildNotesArray(source, arrayStart, arrayEnd, next);
}

/**
 * Duplicate the note aligned with the page at `index`, inserting the copy right
 * after it so the `notes` export stays index-aligned with `export default [...]`
 * after a page duplication. Mirrors {@link duplicatePageInDefaultExportInSource}.
 *
 * Returns the rewritten source, the original source if no `notes` export exists
 * or the index falls past the recorded notes (the new slot and everything after
 * it are absent, so nothing shifts), or `null` if the shape is too surprising.
 */
export function duplicateNotesElementInSource(source: string, index: number): string | null {
  if (!Number.isInteger(index) || index < 0) return null;
  const found = findNotesArray(source);
  if (found === 'invalid') return null;
  if (found === null) return source;

  const { arrayStart, arrayEnd, elementTexts } = found;
  if (index >= elementTexts.length) return source;
  const next = elementTexts.slice();
  next.splice(index + 1, 0, next[index]);
  return rebuildNotesArray(source, arrayStart, arrayEnd, next);
}

function rebuildNotesArray(
  source: string,
  arrayStart: number,
  arrayEnd: number,
  elements: string[],
): string {
  const trimmed = elements.slice();
  while (trimmed.length > 0 && trimmed[trimmed.length - 1] === 'undefined') {
    trimmed.pop();
  }
  const replacement =
    trimmed.length === 0 ? '[]' : `[\n${trimmed.map((s) => `  ${s},`).join('\n')}\n]`;
  if (replacement === source.slice(arrayStart, arrayEnd)) return source;
  return source.slice(0, arrayStart) + replacement + source.slice(arrayEnd);
}

/**
 * Remove the element at `index` from `export default [...]`.
 *
 * Preserves the source slice of every other element, dropping the separator
 * immediately following the removed element (or the preceding one when the
 * removed element is the last). Returns `null` when the default export isn't
 * an array literal or `index` is out of range.
 */
export function removePageFromDefaultExportInSource(source: string, index: number): string | null {
  const found = findDefaultExportArray(source);
  if (!found) return null;
  const { elements, arrayStart, arrayEnd } = found;
  const n = elements.length;
  if (!Number.isInteger(index) || index < 0 || index >= n) return null;

  if (n === 1) {
    return `${source.slice(0, arrayStart)}[]${source.slice(arrayEnd)}`;
  }

  const prefix = source.slice(arrayStart, elements[0].start);
  const suffix = source.slice(elements[n - 1].end, arrayEnd);
  const separators: string[] = [];
  for (let i = 0; i < n - 1; i++) {
    separators.push(source.slice(elements[i].end, elements[i + 1].start));
  }
  const elementText = elements.map((el) => source.slice(el.start, el.end));

  const keptElements: string[] = [];
  const keptSeparators: string[] = [];
  for (let i = 0; i < n; i++) {
    if (i === index) continue;
    keptElements.push(elementText[i]);
  }
  for (let i = 0; i < n - 1; i++) {
    // Drop the separator that follows the removed element. When the removed
    // element is the last one, the separator preceding it (i = index-1) is
    // the trailing separator and gets dropped instead.
    if (index === n - 1 ? i === n - 2 : i === index) continue;
    keptSeparators.push(separators[i]);
  }

  let rebuilt = prefix + keptElements[0];
  for (let i = 1; i < keptElements.length; i++) {
    rebuilt += keptSeparators[i - 1] + keptElements[i];
  }
  rebuilt += suffix;

  return source.slice(0, arrayStart) + rebuilt + source.slice(arrayEnd);
}

function chooseInsertSeparator(prefix: string, existingSeparators: string[]): string {
  const sample = existingSeparators.find((s) => s.includes(','));
  if (sample) return sample;
  if (prefix.includes('\n')) {
    const m = prefix.match(/\n([ \t]*)$/);
    const indent = m ? m[1] : '  ';
    return `,\n${indent}`;
  }
  return ', ';
}

/**
 * Duplicate the element at `index` in `export default [...]`, inserting the
 * copy immediately after the original. Reuses an existing inter-element
 * separator when one is available so the cloned entry matches the surrounding
 * indentation. Returns `null` when the default export isn't an array literal
 * or `index` is out of range.
 */
export function duplicatePageInDefaultExportInSource(source: string, index: number): string | null {
  const found = findDefaultExportArray(source);
  if (!found) return null;
  const { elements, arrayStart, arrayEnd } = found;
  const n = elements.length;
  if (!Number.isInteger(index) || index < 0 || index >= n) return null;

  const prefix = source.slice(arrayStart, elements[0].start);
  const suffix = source.slice(elements[n - 1].end, arrayEnd);
  const separators: string[] = [];
  for (let i = 0; i < n - 1; i++) {
    separators.push(source.slice(elements[i].end, elements[i + 1].start));
  }
  const elementText = elements.map((el) => source.slice(el.start, el.end));

  const insertSep = chooseInsertSeparator(prefix, separators);

  const newElements: string[] = [];
  const newSeparators: string[] = [];
  for (let i = 0; i < n; i++) {
    newElements.push(elementText[i]);
    if (i === index) {
      newElements.push(elementText[i]);
      newSeparators.push(insertSep);
    }
    if (i < n - 1) newSeparators.push(separators[i]);
  }

  let rebuilt = prefix + newElements[0];
  for (let i = 1; i < newElements.length; i++) {
    rebuilt += newSeparators[i - 1] + newElements[i];
  }
  rebuilt += suffix;

  return source.slice(0, arrayStart) + rebuilt + source.slice(arrayEnd);
}

export type AddPageResult =
  | { ok: true; source: string; index: number; name: string }
  | { ok: false; status: number; error: string };

const BLANK_PAGE_BODY = "() => <div style={{ width: '100%', height: '100%' }} />";

function refuse(error: string): AddPageResult {
  return { ok: false, status: 422, error };
}

function unwrapTsExpression(node: t.Node | null | undefined): t.Node | null | undefined {
  let current = node;
  while (current && (t.isTSAsExpression(current) || t.isTSSatisfiesExpression(current))) {
    current = current.expression;
  }
  return current;
}

function declaredNames(stmt: t.Statement): string[] {
  const decl = t.isExportNamedDeclaration(stmt) ? stmt.declaration : stmt;
  if (t.isFunctionDeclaration(decl) && decl.id) return [decl.id.name];
  if (t.isVariableDeclaration(decl)) {
    return decl.declarations.flatMap((d) => (t.isIdentifier(d.id) ? [d.id.name] : []));
  }
  return [];
}

function findNotesArrayNode(body: t.Statement[]): t.ArrayExpression | null | 'invalid' {
  for (const stmt of body) {
    if (!t.isExportNamedDeclaration(stmt) || !t.isVariableDeclaration(stmt.declaration)) continue;
    for (const d of stmt.declaration.declarations) {
      if (!t.isIdentifier(d.id) || d.id.name !== 'notes') continue;
      const init = unwrapTsExpression(d.init);
      return t.isArrayExpression(init) ? init : 'invalid';
    }
  }
  return null;
}

function separatorsBetween(source: string, nodes: t.Node[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    out.push(source.slice(nodes[i].end ?? 0, nodes[i + 1].start ?? 0));
  }
  return out;
}

// Existing gaps can hold section comments (`A,\n  // Part two\n  B`); the
// new separator keeps only their line break and indentation so no comment is
// duplicated onto the inserted entry.
function commentFreeSeparator(sample: string): string {
  const lastBreak = sample.lastIndexOf('\n');
  if (lastBreak === -1) return ', ';
  const eol = sample[lastBreak - 1] === '\r' ? '\r\n' : '\n';
  const indent = sample.slice(lastBreak + 1).match(/^[ \t]*/)?.[0] ?? '';
  return `,${eol}${indent}`;
}

// Splice `text` into an array literal so it lands at position `index`, reusing
// the array's own separator style. Returns null for an empty array whose
// brackets hold anything but whitespace (a comment we would have to straddle).
function insertIntoArraySplice(
  source: string,
  array: t.ArrayExpression,
  elements: t.Node[],
  index: number,
  text: string,
): Splice | null {
  const arrayStart = array.start ?? 0;
  const arrayEnd = array.end ?? 0;
  if (elements.length === 0) {
    if (source.slice(arrayStart + 1, arrayEnd - 1).trim() !== '') return null;
    return { from: arrayStart, to: arrayEnd, text: `[${text}]` };
  }
  const prefix = source.slice(arrayStart, elements[0].start ?? 0);
  const sep = commentFreeSeparator(
    chooseInsertSeparator(prefix, separatorsBetween(source, elements)),
  );
  if (index < elements.length) {
    const at = elements[index].start ?? 0;
    return { from: at, to: at, text: `${text}${sep}` };
  }
  const at = elements[elements.length - 1].end ?? 0;
  return { from: at, to: at, text: `${sep}${text}` };
}

// Follow the deck's own numbering when its page identifiers share a
// `<prefix><n>` shape (Page1, Slide02…); otherwise fall back to `Page<n>`.
function choosePageName(pageNames: string[], used: Set<string>, position: number): string {
  const groups = new Map<string, { max: number; width: number; count: number }>();
  for (const name of pageNames) {
    const m = name.match(/^([A-Za-z_$][\w$]*?)(\d+)$/);
    if (!m) continue;
    const [, prefix, digits] = m;
    const g = groups.get(prefix) ?? { max: 0, width: 0, count: 0 };
    g.max = Math.max(g.max, Number(digits));
    if (digits.length > 1 && digits.startsWith('0')) g.width = Math.max(g.width, digits.length);
    g.count++;
    groups.set(prefix, g);
  }
  let best: [string, { max: number; width: number; count: number }] | null = null;
  for (const entry of groups) {
    if (!best || entry[1].count > best[1].count) best = entry;
  }
  const [prefix, width, start] =
    best && (best[1].count >= 2 || best[1].count === pageNames.length)
      ? [best[0], best[1].width, best[1].max + 1]
      : ['Page', 0, position + 1];
  for (let n = start; ; n++) {
    const candidate = `${prefix}${String(n).padStart(width, '0')}`;
    if (!used.has(candidate)) return candidate;
  }
}

function lineEndAfter(source: string, pos: number): number {
  const nl = source.indexOf('\n', pos);
  const lineEnd = nl === -1 ? source.length : nl;
  const rest = source.slice(pos, lineEnd).replace(/\r$/, '');
  return /^[ \t]*(\/\/.*)?$/.test(rest) ? lineEnd - (source[lineEnd - 1] === '\r' ? 1 : 0) : pos;
}

// Babel also lists the previous statement's same-line trailing comment as a
// leading comment here; only comments that open their own line belong to it.
function statementStart(source: string, stmt: t.Statement): number {
  const own = stmt.leadingComments?.find((c) => {
    const lineStart = source.lastIndexOf('\n', (c.start ?? 0) - 1) + 1;
    return source.slice(lineStart, c.start ?? 0).trim() === '';
  });
  return own?.start ?? stmt.start ?? 0;
}

/**
 * Insert a blank page after the page at `afterIndex` (`-1` inserts at the
 * front): a new top-level `const <Name>: Page = () => <div … />;` next to its
 * neighbour's declaration, its identifier in `export default [...]`, and an
 * `undefined` slot in `export const notes` when the notes reach past the
 * insertion point. Every change is a byte splice on the original source; the
 * result is reparsed before it is returned.
 */
export function addPageToDefaultExportInSource(source: string, afterIndex: number): AddPageResult {
  const ast = parseSource(source);
  if (!ast) return refuse('could not add page — index.tsx does not parse');
  const body = ast.program.body;

  const exportIdx = body.findIndex((s) => t.isExportDefaultDeclaration(s));
  if (exportIdx === -1) return refuse('could not add page — no `export default` in index.tsx');
  const exportStmt = body[exportIdx] as t.ExportDefaultDeclaration;
  const array = unwrapTsExpression(exportStmt.declaration);
  if (!t.isArrayExpression(array)) {
    return refuse('could not add page — `export default` is not an array literal');
  }
  const elements: t.Node[] = [];
  for (const el of array.elements) {
    if (!el || t.isSpreadElement(el)) {
      return refuse('could not add page — `export default` array has holes or spreads');
    }
    elements.push(el);
  }
  const n = elements.length;
  if (!Number.isInteger(afterIndex) || afterIndex < -1 || afterIndex >= n) {
    return refuse('could not add page — index out of range');
  }
  const index = afterIndex + 1;

  const used = new Set<string>();
  walkAll(ast, (node) => {
    if (t.isIdentifier(node) || t.isJSXIdentifier(node)) used.add(node.name);
  });
  const pageNames = elements.flatMap((el) => (t.isIdentifier(el) ? [el.name] : []));
  const name = choosePageName(pageNames, used, index);

  const pageType = body.some(
    (s) =>
      t.isImportDeclaration(s) &&
      s.source.value === '@open-slide/core' &&
      s.specifiers.some((sp) => t.isImportSpecifier(sp) && sp.local.name === 'Page'),
  )
    ? ': Page'
    : '';
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const declText = `const ${name}${pageType} = ${BLANK_PAGE_BODY};`;

  const declaringStatement = (el: t.Node | undefined): t.Statement | undefined => {
    if (!t.isIdentifier(el)) return undefined;
    const i = body.findIndex((s, k) => k < exportIdx && declaredNames(s).includes(el.name));
    return i === -1 ? undefined : body[i];
  };
  const splices: Splice[] = [];
  const prevDecl = declaringStatement(elements[afterIndex]);
  const nextDecl = declaringStatement(elements[index]);
  if (prevDecl) {
    const at = lineEndAfter(source, prevDecl.end ?? 0);
    splices.push({ from: at, to: at, text: `${eol}${eol}${declText}` });
  } else {
    const at = statementStart(source, nextDecl ?? exportStmt);
    splices.push({ from: at, to: at, text: `${declText}${eol}${eol}` });
  }

  const arraySplice = insertIntoArraySplice(source, array, elements, index, name);
  if (!arraySplice) {
    return refuse('could not add page — `export default` array contains only a comment');
  }
  splices.push(arraySplice);

  const notes = findNotesArrayNode(body);
  if (notes === 'invalid') {
    return refuse('could not add page — `notes` export is not an array literal');
  }
  if (notes && index < notes.elements.length) {
    const noteElements: t.Node[] = [];
    for (const el of notes.elements) {
      if (!el || t.isSpreadElement(el)) {
        return refuse('could not add page — `notes` array has holes or spreads');
      }
      noteElements.push(el);
    }
    const notesSplice = insertIntoArraySplice(source, notes, noteElements, index, 'undefined');
    if (notesSplice) splices.push(notesSplice);
  }

  const applied = applySplices(source, splices);
  if (!applied.ok) return applied;
  return { ok: true, source: applied.source, index, name };
}
