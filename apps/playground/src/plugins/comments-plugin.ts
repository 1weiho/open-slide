import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';
import type { Connect, Plugin, ViteDevServer } from 'vite';

const MARKER_RE =
  /\{\/\*\s*@slide-comment\s+id="(c-[a-f0-9]+)"\s+ts="([^"]+)"\s+text="([A-Za-z0-9_-]+={0,2})"\s*\*\/\}/g;

const DECK_ID_RE = /^[a-z0-9_-]+$/i;

type AddBody = {
  deckId?: string;
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

function resolveSlidePath(root: string, deckId: string): string | null {
  if (!DECK_ID_RE.test(deckId)) return null;
  const slidesRoot = path.resolve(root, 'slides');
  const full = path.resolve(slidesRoot, deckId, 'index.tsx');
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

function isJsxOpeningLine(line: string): boolean {
  const t = line.trimStart();
  if (!t.startsWith('<')) return false;
  if (t.startsWith('</')) return false;
  if (t.startsWith('<!')) return false;
  return true;
}

/**
 * Find the line index to insert a JSX comment above.
 *
 * Babel's `_debugSource.lineNumber/columnNumber` points at the `<` of a JSX
 * opening tag, but the value can go stale (HMR races) or, per reports, point
 * at a line that's not actually a JSX boundary — e.g. inside an inline style
 * object. Verify with the source of truth before committing.
 */
function findSafeInsertLine(
  lines: string[],
  line: number,
  column: number | undefined,
): number | null {
  const idx = line - 1;
  if (idx < 0 || idx >= lines.length) return null;

  if (column !== undefined && lines[idx].charAt(column) === '<') return idx;
  if (isJsxOpeningLine(lines[idx])) return idx;

  const WINDOW = 30;
  for (let i = idx - 1; i >= Math.max(0, idx - WINDOW); i--) {
    if (isJsxOpeningLine(lines[i])) return i;
  }
  for (let i = idx + 1; i < Math.min(lines.length, idx + WINDOW); i++) {
    if (isJsxOpeningLine(lines[i])) return i;
  }
  return null;
}

export function commentsPlugin(): Plugin {
  return {
    name: 'open-slide:comments',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      const root = server.config.root;

      server.middlewares.use('/__comments', async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local');
        const method = req.method ?? 'GET';

        try {
          if (method === 'GET' && url.pathname === '/') {
            const deckId = url.searchParams.get('deckId') ?? '';
            const file = resolveSlidePath(root, deckId);
            if (!file) return json(res, 400, { error: 'invalid deckId' });
            let source: string;
            try {
              source = await fs.readFile(file, 'utf8');
            } catch {
              return json(res, 404, { error: 'deck not found' });
            }
            return json(res, 200, { comments: parseMarkers(source) });
          }

          if (method === 'POST' && url.pathname === '/add') {
            const body = (await readBody(req)) as AddBody;
            const deckId = body.deckId ?? '';
            const file = resolveSlidePath(root, deckId);
            if (!file) return json(res, 400, { error: 'invalid deckId' });
            if (!body.line || body.line < 1) return json(res, 400, { error: 'invalid line' });
            if (!body.text || typeof body.text !== 'string') {
              return json(res, 400, { error: 'missing text' });
            }

            let source: string;
            try {
              source = await fs.readFile(file, 'utf8');
            } catch {
              return json(res, 404, { error: 'deck not found' });
            }

            const lines = source.split('\n');
            const idx = findSafeInsertLine(lines, body.line, body.column);
            if (idx === null) {
              return json(res, 422, {
                error:
                  'could not find a safe JSX boundary near line ' +
                  `${body.line}. Try clicking a different element.`,
              });
            }
            const indent = lines[idx].match(/^\s*/)?.[0] ?? '';

            const id = newId();
            const ts = new Date().toISOString();
            const payload = b64urlEncode(JSON.stringify({ note: body.text, hint: body.hint }));
            const marker = `${indent}{/* @slide-comment id="${id}" ts="${ts}" text="${payload}" */}`;

            lines.splice(idx, 0, marker);
            await fs.writeFile(file, lines.join('\n'), 'utf8');
            return json(res, 200, { id, line: idx + 1 });
          }

          if (method === 'DELETE' && url.pathname.startsWith('/')) {
            const id = url.pathname.slice(1);
            if (!/^c-[a-f0-9]+$/.test(id)) return json(res, 400, { error: 'invalid id' });
            const deckId = url.searchParams.get('deckId') ?? '';
            const file = resolveSlidePath(root, deckId);
            if (!file) return json(res, 400, { error: 'invalid deckId' });

            let source: string;
            try {
              source = await fs.readFile(file, 'utf8');
            } catch {
              return json(res, 404, { error: 'deck not found' });
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
