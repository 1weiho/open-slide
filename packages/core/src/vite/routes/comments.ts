import fs from 'node:fs/promises';
import path from 'node:path';
import type { ViteDevServer } from 'vite';
import {
  b64urlEncode,
  findInsertion,
  markerDeleteRegex,
  newCommentId,
  offsetToLine,
  parseMarkers,
} from '../../editing/comments.ts';
import { probeElementSharing } from '../../editing/edit-ops.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import { type ApiContext, json, readBody, resolveSlideSourcePath } from './context.ts';

// GET    /__comments        list markers for ?slideId=…
// POST   /__comments/add    add marker { slideId, line, column?, text, hint? }
// DELETE /__comments/:id    remove marker

type AddCommentBody = {
  slideId?: string;
  sourceFile?: string;
  line?: number;
  column?: number;
  text?: string;
  hint?: string;
};

async function listSlideSourceFiles(
  ctx: ApiContext,
  slideId: string,
): Promise<Array<{ file: string; sourceFile: string }>> {
  const root = resolveSlideSourcePath(ctx, slideId, 'index.tsx');
  if (!root) return [];
  const slideRoot = path.dirname(root);
  const out: Array<{ file: string; sourceFile: string }> = [];
  async function visit(dir: string) {
    let entries: Array<import('node:fs').Dirent>;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await visit(full);
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.tsx') &&
        !entry.name.endsWith('.d.ts') &&
        !entry.name.endsWith('.test.tsx')
      ) {
        out.push({
          file: full,
          sourceFile: path.relative(slideRoot, full).replace(/\\/g, '/'),
        });
      }
    }
  }
  await visit(slideRoot);
  out.sort((a, b) => (a.sourceFile === 'index.tsx' ? -1 : b.sourceFile === 'index.tsx' ? 1 : 0));
  return out;
}

export function registerCommentRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__comments', async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';

    try {
      if (method === 'GET' && url.pathname === '/') {
        const slideId = url.searchParams.get('slideId') ?? '';
        const files = await listSlideSourceFiles(ctx, slideId);
        if (files.length === 0) {
          if (!resolveSlideSourcePath(ctx, slideId, 'index.tsx')) {
            return json(res, 400, { error: 'invalid slideId' });
          }
          return json(res, 404, { error: 'slide not found' });
        }
        const comments = [];
        for (const { file, sourceFile } of files) {
          let source: string;
          try {
            source = await fs.readFile(file, 'utf8');
          } catch {
            continue;
          }
          comments.push(...parseMarkers(source).map((c) => ({ ...c, sourceFile })));
        }
        return json(res, 200, { comments });
      }

      if (method === 'POST' && url.pathname === '/add') {
        const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const body = (await readBody(req)) as AddCommentBody;
        const slideId = body.slideId ?? '';
        const file = resolveSlideSourcePath(ctx, slideId, body.sourceFile);
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

        const sharing = probeElementSharing(source, body.line, body.column ?? 0);
        if (sharing && (sharing.instances > 1 || sharing.viaMap)) {
          const reasons = [];
          if (sharing.instances > 1) {
            reasons.push(`${sharing.instances} rendered instances share this JSX definition`);
          }
          if (sharing.viaMap) reasons.push('the element is rendered from a map body');
          return json(res, 422, {
            error:
              `Cannot add this inspector comment because ${reasons.join(' and ')}. ` +
              'Putting a marker here would make the target page ambiguous. ' +
              'Move the comment to page-specific JSX, or split the shared element first.',
          });
        }

        const plan = findInsertion(source, body.line, body.column);
        if (!plan) {
          return json(res, 422, {
            error:
              'could not find a JSX container around line ' +
              `${body.line}. Try clicking a different element.`,
          });
        }

        const id = newCommentId();
        const ts = new Date().toISOString();
        const payload = b64urlEncode(JSON.stringify({ note: body.text, hint: body.hint }));
        const marker = `\n${plan.indent}{/* @slide-comment id="${id}" ts="${ts}" text="${payload}" */}`;

        const next = source.slice(0, plan.offset) + marker + source.slice(plan.offset);
        await fs.writeFile(file, next, 'utf8');
        const markerLine = offsetToLine(next, plan.offset + 1);
        return json(res, 200, { id, line: markerLine });
      }

      if (method === 'DELETE' && url.pathname.startsWith('/')) {
        const requestCheck = validateMutationRequest(req);
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const id = url.pathname.slice(1);
        if (!/^c-[a-f0-9]+$/.test(id)) return json(res, 400, { error: 'invalid id' });
        const slideId = url.searchParams.get('slideId') ?? '';
        const sourceFile = url.searchParams.get('sourceFile') ?? undefined;
        const files = sourceFile
          ? [{ file: resolveSlideSourcePath(ctx, slideId, sourceFile), sourceFile }]
          : await listSlideSourceFiles(ctx, slideId);
        if (files.length === 0 || files.some((f) => !f.file)) {
          return json(res, 400, { error: 'invalid slideId' });
        }

        const idRe = markerDeleteRegex(id);
        for (const item of files) {
          const file = item.file;
          if (!file) continue;
          let source: string;
          try {
            source = await fs.readFile(file, 'utf8');
          } catch {
            continue;
          }
          const lines = source.split('\n');
          const hit = lines.findIndex((l) => idRe.test(l));
          if (hit === -1) continue;
          lines.splice(hit, 1);
          await fs.writeFile(file, lines.join('\n'), 'utf8');
          return json(res, 200, { ok: true });
        }
        return json(res, 404, { error: 'marker not found' });
      }

      next();
    } catch (err) {
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
