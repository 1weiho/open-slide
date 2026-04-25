import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';
import { parse as babelParse } from '@babel/parser';
import type { Connect, Plugin, ViteDevServer } from 'vite';

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
type Comment = { id: string; line: number; ts: string; note: string; hint?: string };

function b64urlEncode(s: string): string {
  return Buffer.from(s, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(s: string): string {
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

function parseMarkers(source: string): Comment[] {
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

type Loc = { line: number; column: number };
type AstNode = {
  type: string;
  start: number;
  end: number;
  loc?: { start: Loc; end: Loc };
  [k: string]: unknown;
};

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
 * Walk the AST, collect every JSXElement/JSXFragment whose location encloses
 * the click point, ordered innermost-first.
 *
 * "Encloses" here is inclusive at the start (so a click on the opening `<`
 * counts as inside) and exclusive at the end. We deliberately don't trust
 * Babel's `_debugSource` line/column to be exact — HMR or upstream transforms
 * can shift it slightly — so we treat the click as a probe and pick the
 * tightest JSX container around it.
 */
function findJsxAncestors(ast: AstNode, line: number, column: number): AstNode[] {
  const hits: { node: AstNode; size: number }[] = [];

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const c of node) walk(c);
      return;
    }
    const n = node as AstNode;
    if (typeof n.type !== 'string') return;

    if ((n.type === 'JSXElement' || n.type === 'JSXFragment') && n.loc) {
      const s = n.loc.start;
      const e = n.loc.end;
      const afterStart = line > s.line || (line === s.line && column >= s.column);
      const beforeEnd = line < e.line || (line === e.line && column < e.column);
      if (afterStart && beforeEnd) {
        hits.push({ node: n, size: n.end - n.start });
      }
    }

    for (const key of Object.keys(n)) {
      if (
        key === 'loc' ||
        key === 'start' ||
        key === 'end' ||
        key === 'type' ||
        key === 'extra' ||
        key === 'leadingComments' ||
        key === 'trailingComments' ||
        key === 'innerComments'
      ) {
        continue;
      }
      walk((n as Record<string, unknown>)[key]);
    }
  };

  walk(ast);
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
