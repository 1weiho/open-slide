import fs from 'node:fs/promises';
import { parse as babelParse } from '@babel/parser';
import * as t from '@babel/types';
import type { Plugin, ViteDevServer } from 'vite';
import { validateMutationRequest } from '../http/request-guard.ts';
import { json, readBody, resolveSlidePath } from './routes/context.ts';

type NotesBody = {
  slideId?: string;
  index?: number;
  text?: string;
};

export type ApplyNotesEditResult =
  | { ok: true; source: string }
  | { ok: false; status: number; error: string };

function parseSource(source: string): t.File | null {
  try {
    return babelParse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    });
  } catch {
    return null;
  }
}

type NotesExport = {
  declStart: number;
  declEnd: number;
  arrayStart: number;
  arrayEnd: number;
  elements: Array<t.Expression | t.SpreadElement | null>;
};

function findNotesExport(ast: t.File): NotesExport | { error: string } | null {
  for (const stmt of ast.program.body) {
    if (!t.isExportNamedDeclaration(stmt)) continue;
    const decl = stmt.declaration;
    if (!decl || !t.isVariableDeclaration(decl)) continue;
    for (const d of decl.declarations) {
      if (!t.isVariableDeclarator(d)) continue;
      if (!t.isIdentifier(d.id) || d.id.name !== 'notes') continue;
      if (!d.init) return { error: '`notes` export has no initializer' };
      if (!t.isArrayExpression(d.init)) {
        return { error: '`notes` export is not an array literal' };
      }
      const arr = d.init;
      if (typeof stmt.start !== 'number' || typeof stmt.end !== 'number') {
        return { error: '`notes` export missing source range' };
      }
      if (typeof arr.start !== 'number' || typeof arr.end !== 'number') {
        return { error: '`notes` array missing source range' };
      }
      return {
        declStart: stmt.start,
        declEnd: stmt.end,
        arrayStart: arr.start,
        arrayEnd: arr.end,
        elements: arr.elements,
      };
    }
  }
  return null;
}

// Render a string as a TS literal. Prefer template literals for multi-line
// strings so the source stays readable; otherwise a JSON-quoted single-line
// string keeps escapes minimal.
export function renderNoteLiteral(text: string): string {
  if (text === '') return 'undefined';
  const hasNewline = /\n/.test(text);
  if (hasNewline) {
    const escaped = text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    return `\`${escaped}\``;
  }
  return JSON.stringify(text);
}

function findInsertionOffset(ast: t.File, source: string): number {
  let lastImportEnd = -1;
  for (const stmt of ast.program.body) {
    if (t.isImportDeclaration(stmt) && typeof stmt.end === 'number') {
      lastImportEnd = Math.max(lastImportEnd, stmt.end);
    }
  }
  if (lastImportEnd >= 0) return lastImportEnd;
  return source.length;
}

export function applyNotesEdit(source: string, index: number, text: string): ApplyNotesEditResult {
  if (!Number.isInteger(index) || index < 0) {
    return { ok: false, status: 400, error: 'invalid index' };
  }

  const ast = parseSource(source);
  if (!ast) return { ok: false, status: 422, error: 'could not parse source' };

  const found = findNotesExport(ast);
  if (found && 'error' in found) {
    return { ok: false, status: 422, error: found.error };
  }

  const literal = renderNoteLiteral(text);

  if (!found) {
    if (text === '') return { ok: true, source };

    const padding = Array.from({ length: index }, () => 'undefined');
    const items = [...padding, literal];
    const block = [
      '',
      '',
      'export const notes: (string | undefined)[] = [',
      ...items.map((s) => `  ${s},`),
      '];',
      '',
    ].join('\n');

    const offset = findInsertionOffset(ast, source);
    const next = source.slice(0, offset) + block + source.slice(offset);
    return { ok: true, source: next };
  }

  const elementTexts: string[] = [];
  for (const el of found.elements) {
    if (el === null) {
      elementTexts.push('undefined');
      continue;
    }
    if (typeof el.start !== 'number' || typeof el.end !== 'number') {
      return { ok: false, status: 422, error: '`notes` element missing source range' };
    }
    elementTexts.push(source.slice(el.start, el.end));
  }

  while (elementTexts.length <= index) elementTexts.push('undefined');
  elementTexts[index] = literal;

  while (elementTexts.length > 0 && elementTexts[elementTexts.length - 1] === 'undefined') {
    elementTexts.pop();
  }

  const replacement =
    elementTexts.length === 0 ? '[]' : `[\n${elementTexts.map((s) => `  ${s},`).join('\n')}\n]`;

  const next = source.slice(0, found.arrayStart) + replacement + source.slice(found.arrayEnd);
  return { ok: true, source: next };
}

export type NotesPluginOptions = {
  userCwd: string;
  slidesDir?: string;
};

export function notesPlugin(opts: NotesPluginOptions): Plugin {
  const userCwd = opts.userCwd;
  const slidesDir = opts.slidesDir ?? 'slides';
  // Suppress HMR for our own writes — RFR bails on the slide's mixed exports
  // and remounts the tree, stealing textarea focus mid-typing.
  const recentWrites = new Map<string, number>();
  const RECENT_WRITE_WINDOW_MS = 1500;

  return {
    name: 'open-slide:notes',
    apply: 'serve',
    handleHotUpdate(ctx) {
      const ts = recentWrites.get(ctx.file);
      if (ts != null && Date.now() - ts < RECENT_WRITE_WINDOW_MS) {
        recentWrites.delete(ctx.file);
        return [];
      }
      return undefined;
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/__notes', async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local');
        const method = req.method ?? 'GET';
        if (method !== 'PUT' || url.pathname !== '/') return next();
        const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
        if (!requestCheck.ok) return json(res, requestCheck.status, { error: requestCheck.error });

        try {
          const body = (await readBody(req)) as NotesBody;
          const slideId = body.slideId ?? '';
          const file = resolveSlidePath(userCwd, slidesDir, slideId);
          if (!file) return json(res, 400, { error: 'invalid slideId' });
          if (typeof body.index !== 'number') return json(res, 400, { error: 'missing index' });
          if (typeof body.text !== 'string') return json(res, 400, { error: 'missing text' });

          let source: string;
          try {
            source = await fs.readFile(file, 'utf8');
          } catch {
            return json(res, 404, { error: 'slide not found' });
          }

          const result = applyNotesEdit(source, body.index, body.text);
          if (!result.ok) return json(res, result.status, { error: result.error });
          const changed = result.source !== source;
          if (changed) {
            recentWrites.set(file, Date.now());
            await fs.writeFile(file, result.source, 'utf8');
          }
          return json(res, 200, { ok: true, changed });
        } catch (err) {
          json(res, 500, { error: String((err as Error).message ?? err) });
        }
      });
    },
  };
}
