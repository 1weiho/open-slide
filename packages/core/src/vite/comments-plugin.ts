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
    } catch {}
  }
  return comments;
}

function newId(): string {
  return `c-${randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

// We always splice the marker as the first child of a JSX container.
// A JSX-comment-like token outside JSX context (e.g. as the body of
// `() => ( <Foo/> )`) is parsed as an empty object literal and breaks
// the surrounding expression.
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

// Innermost-first list of JSX nodes enclosing the click point.
// Inclusive at start, exclusive at end.
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

// Walk innermost → outermost looking for the first JSX container we
// can insert *inside* (not self-closing). Self-closing elements like
// `<img/>` get hoisted to their nearest non-self-closing ancestor.
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

// `applyEdit` rewrites a slide file in place via minimal text splices
// computed from AST ranges, so unrelated formatting is preserved.

export type EditOp =
  | { kind: 'set-style'; key: string; value: string | null }
  | { kind: 'set-text'; value: string }
  | { kind: 'set-attr-asset'; attr: string; assetPath: string }
  | { kind: 'replace-placeholder-with-image'; assetPath: string };

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

  // Prefer exact `loc.start` match (what `data-slide-loc` sends) so
  // we don't accidentally hit an outer JSX whose range happens to
  // enclose the click point.
  const exact = findJsxByStart(ast, line, column);
  if (exact) return exact;

  // Fallback for fiber-walked clicks whose column may not align with
  // the opening `<`.
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
  // Raw source slices, not parsed values — preserves variables and
  // complex expressions exactly as authored.
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
  // JSXText can't hold `{}<>` and collapses leading/trailing whitespace,
  // so wrap the value in an expression container when it would lose info.
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
    // Replace the whole children span so old surrounding whitespace
    // doesn't leak into the new value.
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

type ImportInfo = { node: AstNode; source: string; defaultIdent: string | null };

function findImports(ast: AstNode): ImportInfo[] {
  const body = (ast as unknown as { program?: { body?: AstNode[] } }).program?.body ?? [];
  const out: ImportInfo[] = [];
  for (const node of body) {
    if (node.type !== 'ImportDeclaration') continue;
    const src = (node as unknown as { source?: { value?: unknown } }).source?.value;
    if (typeof src !== 'string') continue;
    const specs = (node as unknown as { specifiers?: AstNode[] }).specifiers ?? [];
    let def: string | null = null;
    for (const spec of specs) {
      if (spec.type === 'ImportDefaultSpecifier') {
        const local = (spec as unknown as { local?: { name?: string } }).local?.name;
        if (typeof local === 'string') {
          def = local;
          break;
        }
      }
    }
    out.push({ node, source: src, defaultIdent: def });
  }
  return out;
}

function collectTopLevelIdentifiers(ast: AstNode): Set<string> {
  // Only need to avoid colliding with anything resolvable by JSX —
  // import bindings cover the common case. Local consts/lets are
  // handled by source-level identifier scanning below.
  const names = new Set<string>();
  for (const imp of findImports(ast)) {
    if (imp.defaultIdent) names.add(imp.defaultIdent);
    const specs = (imp.node as unknown as { specifiers?: AstNode[] }).specifiers ?? [];
    for (const spec of specs) {
      if (spec.type !== 'ImportDefaultSpecifier') {
        const local = (spec as unknown as { local?: { name?: string } }).local?.name;
        if (typeof local === 'string') names.add(local);
      }
    }
  }
  return names;
}

export function safeAssetIdentifier(filename: string, taken: Set<string>): string {
  const stem = filename.replace(/\.[^.]+$/, '');
  let camel = '';
  let upper = false;
  for (const ch of stem) {
    if (/[A-Za-z0-9]/.test(ch)) {
      camel += upper ? ch.toUpperCase() : ch;
      upper = false;
    } else {
      upper = camel.length > 0;
    }
  }
  let base = camel;
  if (!base || !/^[A-Za-z_$]/.test(base)) {
    base = `asset${base.charAt(0).toUpperCase()}${base.slice(1)}` || 'asset';
  }
  base = base.charAt(0).toLowerCase() + base.slice(1);
  let candidate = base;
  let i = 2;
  while (taken.has(candidate)) {
    candidate = `${base}${i}`;
    i += 1;
  }
  return candidate;
}

function findJsxAttr(opening: AstNode, name: string): AstNode | null {
  const attrs = (opening as unknown as { attributes?: AstNode[] }).attributes ?? [];
  for (const attr of attrs) {
    if (attr.type !== 'JSXAttribute') continue;
    const n = (attr as unknown as { name?: { type?: string; name?: string } }).name;
    if (n?.type === 'JSXIdentifier' && n.name === name) return attr;
  }
  return null;
}

type AssetEditPlan = {
  importSplice: Splice | null;
  attrSplice: Splice;
};

function planAssetAttr(
  ast: AstNode,
  element: AstNode,
  attr: string,
  assetPath: string,
): AssetEditPlan | { error: string } {
  const opening = (element as unknown as { openingElement?: AstNode }).openingElement;
  if (!opening) return { error: 'no opening element' };
  if (!attr || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(attr)) return { error: 'invalid attribute name' };
  if (!assetPath.startsWith('./assets/')) return { error: 'asset path must start with ./assets/' };

  const imports = findImports(ast);
  let identifier: string | null = null;
  for (const imp of imports) {
    if (imp.source === assetPath && imp.defaultIdent) {
      identifier = imp.defaultIdent;
      break;
    }
  }

  let importSplice: Splice | null = null;
  if (!identifier) {
    const filename = assetPath.slice(assetPath.lastIndexOf('/') + 1);
    const taken = collectTopLevelIdentifiers(ast);
    identifier = safeAssetIdentifier(filename, taken);
    const importStmt = `import ${identifier} from '${assetPath.replace(/'/g, "\\'")}';\n`;
    const insertAt = imports.length > 0 ? imports[imports.length - 1].node.end : 0;
    const prefix = imports.length > 0 ? '\n' : '';
    importSplice = { from: insertAt, to: insertAt, text: prefix + importStmt };
  }

  const newAttr = `${attr}={${identifier}}`;
  const existing = findJsxAttr(opening, attr);
  let attrSplice: Splice;
  if (existing) {
    attrSplice = { from: existing.start, to: existing.end, text: newAttr };
  } else {
    const name = (opening as unknown as { name: AstNode }).name;
    attrSplice = { from: name.end, to: name.end, text: ` ${newAttr}` };
  }
  return { importSplice, attrSplice };
}

type PlaceholderEditPlan = {
  importSplice: Splice | null;
  elementSplice: Splice;
};

function readJsxStringAttr(opening: AstNode, name: string): string | null {
  const attr = findJsxAttr(opening, name);
  if (!attr) return null;
  const value = (attr as unknown as { value?: AstNode | null }).value ?? null;
  if (!value) return null;
  if (value.type === 'StringLiteral') {
    return (value as unknown as { value: string }).value;
  }
  if (value.type === 'JSXExpressionContainer') {
    const expr = (value as unknown as { expression: AstNode }).expression;
    if (expr.type === 'StringLiteral') return (expr as unknown as { value: string }).value;
  }
  return null;
}

function readJsxNumberAttr(opening: AstNode, name: string): number | null {
  const attr = findJsxAttr(opening, name);
  if (!attr) return null;
  const value = (attr as unknown as { value?: AstNode | null }).value ?? null;
  if (!value || value.type !== 'JSXExpressionContainer') return null;
  const expr = (value as unknown as { expression: AstNode }).expression;
  if (expr.type === 'NumericLiteral') {
    const n = (expr as unknown as { value: number }).value;
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function planReplacePlaceholder(
  ast: AstNode,
  element: AstNode,
  assetPath: string,
): PlaceholderEditPlan | { error: string } {
  const opening = (element as unknown as { openingElement?: AstNode }).openingElement;
  if (!opening) return { error: 'no opening element' };
  const elName = (opening as unknown as { name?: { type?: string; name?: string } }).name;
  if (elName?.type !== 'JSXIdentifier' || elName.name !== 'ImagePlaceholder') {
    return { error: 'not a placeholder' };
  }
  if (!assetPath.startsWith('./assets/')) return { error: 'asset path must start with ./assets/' };

  const hint = readJsxStringAttr(opening, 'hint') ?? '';
  const width = readJsxNumberAttr(opening, 'width');
  const height = readJsxNumberAttr(opening, 'height');

  const imports = findImports(ast);
  let identifier: string | null = null;
  for (const imp of imports) {
    if (imp.source === assetPath && imp.defaultIdent) {
      identifier = imp.defaultIdent;
      break;
    }
  }

  let importSplice: Splice | null = null;
  if (!identifier) {
    const filename = assetPath.slice(assetPath.lastIndexOf('/') + 1);
    const taken = collectTopLevelIdentifiers(ast);
    identifier = safeAssetIdentifier(filename, taken);
    const importStmt = `import ${identifier} from '${assetPath.replace(/'/g, "\\'")}';\n`;
    const insertAt = imports.length > 0 ? imports[imports.length - 1].node.end : 0;
    const prefix = imports.length > 0 ? '\n' : '';
    importSplice = { from: insertAt, to: insertAt, text: prefix + importStmt };
  }

  const styleParts: string[] = [];
  if (width != null) styleParts.push(`width: ${width}`);
  if (height != null) styleParts.push(`height: ${height}`);
  styleParts.push(`objectFit: 'cover'`);
  const styleAttr = ` style={{ ${styleParts.join(', ')} }}`;
  const altAttr = ` alt=${jsString(hint)}`;
  const replacement = `<img src={${identifier}}${altAttr}${styleAttr} />`;

  return {
    importSplice,
    elementSplice: { from: element.start, to: element.end, text: replacement },
  };
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

  const assetOps = ops.flatMap((op) => (op.kind === 'set-attr-asset' ? [op] : []));
  const placeholderOps = ops.flatMap((op) =>
    op.kind === 'replace-placeholder-with-image' ? [op] : [],
  );
  if (assetOps.length > 0 || placeholderOps.length > 0) {
    const ast = parseSource(source);
    if (!ast) return { ok: false, status: 422, error: 'could not parse source' };
    const importSplices: Splice[] = [];
    for (const op of assetOps) {
      const plan = planAssetAttr(ast, element, op.attr, op.assetPath);
      if ('error' in plan) return { ok: false, status: 422, error: plan.error };
      splices.push(plan.attrSplice);
      if (plan.importSplice) importSplices.push(plan.importSplice);
    }
    for (const op of placeholderOps) {
      const plan = planReplacePlaceholder(ast, element, op.assetPath);
      if ('error' in plan) return { ok: false, status: 422, error: plan.error };
      splices.push(plan.elementSplice);
      if (plan.importSplice) importSplices.push(plan.importSplice);
    }
    // Multiple new imports for the same edit must not overlap, but they
    // all anchor to the same offset (end of last existing import). When
    // applied in reverse-`from` order they would land at the same point,
    // so concat their text into a single splice to keep ordering stable.
    if (importSplices.length > 0) {
      const from = importSplices[0].from;
      const to = importSplices[0].to;
      const text = importSplices.map((s) => s.text).join('');
      splices.push({ from, to, text });
    }
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

          // One read-modify-write per batch so a multi-element edit
          // session lands as a single HMR. Per-edit failures are
          // reported but don't abort the batch.
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
