import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';
import { parse as babelParse } from '@babel/parser';
import type { Connect, Plugin, ViteDevServer } from 'vite';
import { type AstNode, walkJsx } from './babel-walk.ts';

const MARKER_RE =
  /\{\/\*\s*@slide-comment\s+id="(c-[a-f0-9]+)"\s+ts="([^"]+)"\s+text="([A-Za-z0-9_-]+={0,2})"\s*\*\/\}/g;

const SLIDE_ID_RE = /^[a-z0-9_-]+$/i;

type AddBody = {
  slideId?: string;
  line?: number;
  column?: number;
  text?: string;
  hint?: string;
};
type EditBody = {
  slideId?: string;
  line?: number;
  column?: number;
  ops?: EditOp[];
};
type EditBatchBody = {
  slideId?: string;
  edits?: Array<{ line?: number; column?: number; ops?: EditOp[] }>;
};
type Comment = { id: string; line: number; ts: string; note: string; hint?: string };

export function b64urlEncode(s: string): string {
  return Buffer.from(s, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8');
}

async function readBody(req: Connect.IncomingMessage): Promise<unknown> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

function resolveSlidePath(userCwd: string, slidesDir: string, slideId: string): string | null {
  if (!SLIDE_ID_RE.test(slideId)) return null;
  const slidesRoot = path.resolve(userCwd, slidesDir);
  const full = path.resolve(slidesRoot, slideId, 'index.tsx');
  if (!full.startsWith(slidesRoot + path.sep)) return null;
  return full;
}

export function parseMarkers(source: string): Comment[] {
  const comments: Comment[] = [];
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    MARKER_RE.lastIndex = 0;
    const m = MARKER_RE.exec(line);
    if (!m) continue;
    const [, id, ts, textB64] = m;
    try {
      const payload = JSON.parse(b64urlDecode(textB64)) as { note: string; hint?: string };
      comments.push({ id, line: i + 1, ts, note: payload.note, hint: payload.hint });
    } catch {
      // skip malformed
    }
  }
  return comments;
}

function newId(): string {
  return `c-${randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

// Insertion plan: where to splice the marker into the source.
//
// We always insert the marker *inside* a JSX container (as its first child),
// never as a JSX-comment sibling. A JSX-comment-like token written outside
// JSX context (e.g. as the body of `() => ( <Foo/> )`) is parsed as an empty
// object literal and breaks the surrounding expression. Children of a
// JSXElement / JSXFragment are unambiguously JSX context, so the marker is
// always valid there.
//
// `offset` is the character index where a fresh `\n<indent><marker>` should
// be spliced in; `indent` is the indentation to apply to the marker line.
type InsertionPlan = { offset: number; indent: string };

function lineToOffset(source: string, line: number): number {
  let off = 0;
  for (let l = 1; l < line; l++) {
    const nl = source.indexOf('\n', off);
    if (nl === -1) return source.length;
    off = nl + 1;
  }
  return off;
}

function lineIndent(source: string, lineNumber: number): string {
  const start = lineToOffset(source, lineNumber);
  const m = source.slice(start, start + 200).match(/^[ \t]*/);
  return m?.[0] ?? '';
}

/**
 * Collect every JSXElement/JSXFragment whose location encloses the click
 * point, ordered innermost-first. "Encloses" is inclusive at the start
 * and exclusive at the end. Used as a fallback when an exact start
 * match isn't available (e.g., the client sent a fiber-derived line/col
 * that doesn't quite line up with the JSX opening `<`).
 */
function findJsxAncestors(ast: AstNode, line: number, column: number): AstNode[] {
  const hits: { node: AstNode; size: number }[] = [];
  walkJsx(ast, (n) => {
    if (!n.loc) return;
    const s = n.loc.start;
    const e = n.loc.end;
    const afterStart = line > s.line || (line === s.line && column >= s.column);
    const beforeEnd = line < e.line || (line === e.line && column < e.column);
    if (afterStart && beforeEnd) hits.push({ node: n, size: n.end - n.start });
  });
  hits.sort((a, b) => a.size - b.size);
  return hits.map((h) => h.node);
}

function planInsertion(source: string, target: AstNode): InsertionPlan | null {
  if (target.type === 'JSXFragment') {
    const opening = target.openingFragment as AstNode | undefined;
    if (!opening) return null;
    const startLine = target.loc?.start.line ?? 1;
    return {
      offset: opening.end,
      indent: `${lineIndent(source, startLine)}  `,
    };
  }
  if (target.type === 'JSXElement') {
    const opening = target.openingElement as (AstNode & { selfClosing?: boolean }) | undefined;
    if (!opening || opening.selfClosing) return null;
    const startLine = target.loc?.start.line ?? 1;
    return {
      offset: opening.end,
      indent: `${lineIndent(source, startLine)}  `,
    };
  }
  return null;
}

/**
 * Resolve a click on the slide page (line/col from React fiber's
 * `_debugSource`) to an in-source offset where we can safely splice a
 * `@slide-comment` marker.
 *
 * Strategy: parse the file, find every JSX container around the click, and
 * walk innermost → outermost looking for the first one we can insert *inside*
 * (i.e. not self-closing). Self-closing elements like `<img/>` get hoisted to
 * their nearest non-self-closing ancestor.
 */
function findInsertion(
  source: string,
  line: number,
  column: number | undefined,
): InsertionPlan | null {
  let ast: AstNode;
  try {
    ast = babelParse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    }) as unknown as AstNode;
  } catch {
    return null;
  }

  const col = column ?? 0;
  const ancestors = findJsxAncestors(ast, line, col);
  if (ancestors.length === 0) return null;

  for (const node of ancestors) {
    const plan = planInsertion(source, node);
    if (plan) return plan;
  }
  return null;
}

function offsetToLine(source: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < source.length; i++) {
    if (source[i] === '\n') line++;
  }
  return line;
}

// =====================================================================
// Visual editor
//
// `applyEdit` mutates a slide source file in-place: it locates the
// innermost JSXElement at a click point and rewrites either its
// `style={{...}}` prop or its single text child. The mutation is a
// minimal text splice computed from AST ranges, so unrelated formatting
// is preserved.
// =====================================================================

export type EditOp =
  | { kind: 'set-style'; key: string; value: string | null }
  | { kind: 'set-text'; value: string };

export type ApplyEditResult =
  | { ok: true; source: string }
  | { ok: false; status: number; error: string };

type Splice = { from: number; to: number; text: string };

function parseSource(source: string): AstNode | null {
  try {
    return babelParse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    }) as unknown as AstNode;
  } catch {
    return null;
  }
}

function findInnermostJsxElement(source: string, line: number, column: number): AstNode | null {
  const ast = parseSource(source);
  if (!ast) return null;

  // Prefer an exact match on `loc.start` — this is what the client
  // sends when reading from `data-slide-loc`, and matching exactly
  // avoids accidentally targeting an outer JSX whose loc happens to
  // enclose a click point.
  const exact = findJsxByStart(ast, line, column);
  if (exact) return exact;

  // Fallback: any JSXElement that encloses (line, column), innermost
  // first. Covers fiber-walked clicks where the column may not be
  // perfectly aligned with the JSX opening `<`.
  const ancestors = findJsxAncestors(ast, line, column);
  for (const n of ancestors) {
    if (n.type === 'JSXElement') return n;
  }
  return null;
}

function findJsxByStart(ast: AstNode, line: number, column: number): AstNode | null {
  let hit: AstNode | null = null;
  walkJsx(ast, (n) => {
    if (n.type !== 'JSXElement' || !n.loc) return;
    const s = n.loc.start;
    if (s.line === line && s.column === column) {
      hit = n;
      return 'stop';
    }
  });
  return hit;
}

function jsString(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

type StyleAttr = AstNode & { value?: AstNode | null };

function findStyleAttr(opening: AstNode): StyleAttr | null {
  const attrs = (opening as unknown as { attributes?: AstNode[] }).attributes ?? [];
  for (const attr of attrs) {
    if (attr.type !== 'JSXAttribute') continue;
    const name = (attr as unknown as { name?: { type?: string; name?: string } }).name;
    if (name?.type === 'JSXIdentifier' && name.name === 'style') {
      return attr as StyleAttr;
    }
  }
  return null;
}

function buildStyleSplice(
  source: string,
  element: AstNode,
  ops: Array<{ key: string; value: string | null }>,
): Splice | { error: string } | null {
  const opening = (element as unknown as { openingElement?: AstNode }).openingElement;
  if (!opening) return { error: 'no opening element' };

  const existing = findStyleAttr(opening);
  // key → raw source slice of the value (preserves variables, complex exprs)
  const style = new Map<string, string>();

  if (existing) {
    const value = existing.value;
    if (!value || value.type !== 'JSXExpressionContainer') {
      return { error: 'style attribute has unsupported form' };
    }
    const expr = (value as unknown as { expression: AstNode }).expression;
    if (expr.type !== 'ObjectExpression') {
      return { error: 'style is not a literal object' };
    }
    const properties = (expr as unknown as { properties: AstNode[] }).properties;
    for (const prop of properties) {
      if (prop.type !== 'ObjectProperty') {
        return { error: 'style contains spread or method' };
      }
      const p = prop as unknown as {
        computed?: boolean;
        shorthand?: boolean;
        key: { type?: string; name?: string; value?: string };
        value: AstNode;
      };
      if (p.computed) return { error: 'style has computed key' };
      let keyName: string | null = null;
      if (p.key.type === 'Identifier' && p.key.name) keyName = p.key.name;
      else if (p.key.type === 'StringLiteral' && typeof p.key.value === 'string') {
        keyName = p.key.value;
      }
      if (!keyName) return { error: 'style has unsupported key' };
      style.set(keyName, source.slice(p.value.start, p.value.end));
    }
  }

  for (const op of ops) {
    if (op.value === null) style.delete(op.key);
    else style.set(op.key, jsString(op.value));
  }

  if (style.size === 0) {
    if (!existing) return null;
    let from = existing.start;
    if (from > 0 && source[from - 1] === ' ') from -= 1;
    return { from, to: existing.end, text: '' };
  }

  const propsText = Array.from(style.entries())
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  const newAttr = `style={{ ${propsText} }}`;

  if (existing) {
    return { from: existing.start, to: existing.end, text: newAttr };
  }

  const name = (opening as unknown as { name: AstNode }).name;
  return { from: name.end, to: name.end, text: ` ${newAttr}` };
}

function formatJsxText(value: string): string {
  // JSXText cannot contain `{`, `}`, `<`, `>`. If the value has any of
  // those (or starts/ends with whitespace, which JSX collapses), emit as
  // a JSXExpressionContainer wrapping a string literal.
  if (/[{}<>]/.test(value) || /^\s|\s$/.test(value) || value === '') {
    return `{${jsString(value)}}`;
  }
  return value;
}

function buildTextSplice(element: AstNode, value: string): Splice | { error: string } {
  const children = (element as unknown as { children?: AstNode[] }).children ?? [];
  if (children.length === 0) {
    return { error: 'element has no children to edit' };
  }

  const meaningful = children.filter((c) => {
    if (c.type === 'JSXText') {
      const v = (c as unknown as { value: string }).value;
      return v.trim() !== '';
    }
    return true;
  });

  if (meaningful.length !== 1) {
    return { error: 'element has complex children' };
  }

  const child = meaningful[0];

  if (child.type === 'JSXText') {
    // Replace the entire children span (incl. surrounding whitespace) so
    // we don't leave dangling whitespace from the old layout.
    const first = children[0];
    const last = children[children.length - 1];
    return { from: first.start, to: last.end, text: formatJsxText(value) };
  }

  if (child.type === 'JSXExpressionContainer') {
    const expr = (child as unknown as { expression: AstNode }).expression;
    if (expr.type === 'StringLiteral' || expr.type === 'NumericLiteral') {
      return {
        from: child.start,
        to: child.end,
        text: `{${jsString(value)}}`,
      };
    }
    return { error: 'element has dynamic expression child' };
  }

  return { error: 'element has complex children' };
}

export function applyEdit(
  source: string,
  line: number,
  column: number,
  ops: EditOp[],
): ApplyEditResult {
  if (ops.length === 0) return { ok: true, source };

  const element = findInnermostJsxElement(source, line, column);
  if (!element) return { ok: false, status: 422, error: 'no JSX element at location' };

  const splices: Splice[] = [];

  const styleOps = ops.flatMap((op) =>
    op.kind === 'set-style' ? [{ key: op.key, value: op.value }] : [],
  );
  if (styleOps.length > 0) {
    const result = buildStyleSplice(source, element, styleOps);
    if (result && 'error' in result) {
      return { ok: false, status: 422, error: result.error };
    }
    if (result) splices.push(result);
  }

  for (const op of ops) {
    if (op.kind !== 'set-text') continue;
    const result = buildTextSplice(element, op.value);
    if ('error' in result) return { ok: false, status: 422, error: result.error };
    splices.push(result);
  }

  if (splices.length === 0) return { ok: true, source };

  splices.sort((a, b) => b.from - a.from);
  let next = source;
  for (const sp of splices) {
    next = next.slice(0, sp.from) + sp.text + next.slice(sp.to);
  }
  return { ok: true, source: next };
}

export type CommentsPluginOptions = {
  userCwd: string;
  slidesDir?: string;
};

export function commentsPlugin(opts: CommentsPluginOptions): Plugin {
  const userCwd = opts.userCwd;
  const slidesDir = opts.slidesDir ?? 'slides';
  return {
    name: 'open-slide:comments',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/__edit', async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local');
        const method = req.method ?? 'GET';
        if (method !== 'POST') return next();

        try {
          if (url.pathname === '/') {
            const body = (await readBody(req)) as EditBody;
            const slideId = body.slideId ?? '';
            const file = resolveSlidePath(userCwd, slidesDir, slideId);
            if (!file) return json(res, 400, { error: 'invalid slideId' });
            if (!body.line || body.line < 1) return json(res, 400, { error: 'invalid line' });
            if (!Array.isArray(body.ops)) return json(res, 400, { error: 'missing ops' });

            let source: string;
            try {
              source = await fs.readFile(file, 'utf8');
            } catch {
              return json(res, 404, { error: 'slide not found' });
            }

            const result = applyEdit(source, body.line, body.column ?? 0, body.ops);
            if (!result.ok) return json(res, result.status, { error: result.error });
            const changed = result.source !== source;
            if (changed) await fs.writeFile(file, result.source, 'utf8');
            return json(res, 200, { ok: true, changed });
          }

          // Apply many edits to one file in a single read-modify-write
          // cycle, so a session of edits across multiple elements only
          // triggers one HMR. Edits are applied in order; per-edit
          // failures are reported in the response without aborting the
          // batch, since each edit is independent.
          if (url.pathname === '/batch') {
            const body = (await readBody(req)) as EditBatchBody;
            const slideId = body.slideId ?? '';
            const file = resolveSlidePath(userCwd, slidesDir, slideId);
            if (!file) return json(res, 400, { error: 'invalid slideId' });
            if (!Array.isArray(body.edits)) return json(res, 400, { error: 'missing edits' });

            let source: string;
            try {
              source = await fs.readFile(file, 'utf8');
            } catch {
              return json(res, 404, { error: 'slide not found' });
            }

            const original = source;
            const results: Array<{ ok: boolean; error?: string }> = [];
            for (const edit of body.edits) {
              if (!edit.line || edit.line < 1 || !Array.isArray(edit.ops)) {
                results.push({ ok: false, error: 'invalid edit' });
                continue;
              }
              const r = applyEdit(source, edit.line, edit.column ?? 0, edit.ops);
              if (r.ok) {
                source = r.source;
                results.push({ ok: true });
              } else {
                results.push({ ok: false, error: r.error });
              }
            }
            const changed = source !== original;
            if (changed) await fs.writeFile(file, source, 'utf8');
            return json(res, 200, { ok: true, changed, results });
          }

          return next();
        } catch (err) {
          json(res, 500, { error: String((err as Error).message ?? err) });
        }
      });

      server.middlewares.use('/__comments', async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local');
        const method = req.method ?? 'GET';

        try {
          if (method === 'GET' && url.pathname === '/') {
            const slideId = url.searchParams.get('slideId') ?? '';
            const file = resolveSlidePath(userCwd, slidesDir, slideId);
            if (!file) return json(res, 400, { error: 'invalid slideId' });
            let source: string;
            try {
              source = await fs.readFile(file, 'utf8');
            } catch {
              return json(res, 404, { error: 'slide not found' });
            }
            return json(res, 200, { comments: parseMarkers(source) });
          }

          if (method === 'POST' && url.pathname === '/add') {
            const body = (await readBody(req)) as AddBody;
            const slideId = body.slideId ?? '';
            const file = resolveSlidePath(userCwd, slidesDir, slideId);
            if (!file) return json(res, 400, { error: 'invalid slideId' });
            if (!body.line || body.line < 1) return json(res, 400, { error: 'invalid line' });
            if (!body.text || typeof body.text !== 'string') {
              return json(res, 400, { error: 'missing text' });
            }

            let source: string;
            try {
              source = await fs.readFile(file, 'utf8');
            } catch {
              return json(res, 404, { error: 'slide not found' });
            }

            const plan = findInsertion(source, body.line, body.column);
            if (!plan) {
              return json(res, 422, {
                error:
                  'could not find a JSX container around line ' +
                  `${body.line}. Try clicking a different element.`,
              });
            }

            const id = newId();
            const ts = new Date().toISOString();
            const payload = b64urlEncode(JSON.stringify({ note: body.text, hint: body.hint }));
            const marker = `\n${plan.indent}{/* @slide-comment id="${id}" ts="${ts}" text="${payload}" */}`;

            const next = source.slice(0, plan.offset) + marker + source.slice(plan.offset);
            await fs.writeFile(file, next, 'utf8');
            const markerLine = offsetToLine(next, plan.offset + 1);
            return json(res, 200, { id, line: markerLine });
          }

          if (method === 'DELETE' && url.pathname.startsWith('/')) {
            const id = url.pathname.slice(1);
            if (!/^c-[a-f0-9]+$/.test(id)) return json(res, 400, { error: 'invalid id' });
            const slideId = url.searchParams.get('slideId') ?? '';
            const file = resolveSlidePath(userCwd, slidesDir, slideId);
            if (!file) return json(res, 400, { error: 'invalid slideId' });

            let source: string;
            try {
              source = await fs.readFile(file, 'utf8');
            } catch {
              return json(res, 404, { error: 'slide not found' });
            }

            const lines = source.split('\n');
            const idRe = new RegExp(
              `\\{\\/\\*\\s*@slide-comment\\s+id="${id}"\\s+ts="[^"]+"\\s+text="[A-Za-z0-9_\\-]+={0,2}"\\s*\\*\\/\\}`,
            );
            const hit = lines.findIndex((l) => idRe.test(l));
            if (hit === -1) return json(res, 404, { error: 'marker not found' });
            lines.splice(hit, 1);
            await fs.writeFile(file, lines.join('\n'), 'utf8');
            return json(res, 200, { ok: true });
          }

          next();
        } catch (err) {
          json(res, 500, { error: String((err as Error).message ?? err) });
        }
      });
    },
  };
}
