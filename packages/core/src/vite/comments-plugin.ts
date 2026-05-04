import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';
import { parse as babelParse } from '@babel/parser';
import * as t from '@babel/types';
import type { Connect, Plugin, ViteDevServer } from 'vite';
import { walkAll, walkJsx } from './babel-walk.ts';

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

type JsxContainer = t.JSXElement | t.JSXFragment;

// Innermost-first list of JSX nodes enclosing the click point.
// Inclusive at start, exclusive at end.
function findJsxAncestors(ast: t.Node, line: number, column: number): JsxContainer[] {
  const hits: { node: JsxContainer; size: number }[] = [];
  walkJsx(ast, (n) => {
    if (!n.loc || (!t.isJSXElement(n) && !t.isJSXFragment(n))) return;
    const s = n.loc.start;
    const e = n.loc.end;
    const afterStart = line > s.line || (line === s.line && column >= s.column);
    const beforeEnd = line < e.line || (line === e.line && column < e.column);
    if (afterStart && beforeEnd) {
      hits.push({ node: n, size: (n.end ?? 0) - (n.start ?? 0) });
    }
  });
  hits.sort((a, b) => a.size - b.size);
  return hits.map((h) => h.node);
}

function planInsertion(source: string, target: JsxContainer): InsertionPlan | null {
  if (t.isJSXFragment(target)) {
    const opening = target.openingFragment;
    const startLine = target.loc?.start.line ?? 1;
    return {
      offset: opening.end ?? 0,
      indent: `${lineIndent(source, startLine)}  `,
    };
  }
  if (t.isJSXElement(target)) {
    const opening = target.openingElement;
    if (opening.selfClosing) return null;
    const startLine = target.loc?.start.line ?? 1;
    return {
      offset: opening.end ?? 0,
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
  const ast = parseSource(source);
  if (!ast) return null;

  const col = column ?? 0;
  const ancestors = findJsxAncestors(ast, line, col);
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
  | { kind: 'set-text'; value: string; prevText?: string }
  | { kind: 'set-attr-asset'; attr: string; assetPath: string }
  | { kind: 'replace-placeholder-with-image'; assetPath: string };

export type ApplyEditResult =
  | { ok: true; source: string }
  | { ok: false; status: number; error: string };

type Splice = { from: number; to: number; text: string };

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

function findInnermostJsxElement(ast: t.Node, line: number, column: number): t.JSXElement | null {
  // Prefer exact `loc.start` match (what `data-slide-loc` sends) so
  // we don't accidentally hit an outer JSX whose range happens to
  // enclose the click point.
  const exact = findJsxByStart(ast, line, column);
  if (exact) return exact;

  // Fallback for fiber-walked clicks whose column may not align with
  // the opening `<`.
  for (const n of findJsxAncestors(ast, line, column)) {
    if (t.isJSXElement(n)) return n;
  }
  return null;
}

function findJsxByStart(ast: t.Node, line: number, column: number): t.JSXElement | null {
  let hit: t.JSXElement | null = null;
  walkJsx(ast, (n) => {
    if (!t.isJSXElement(n) || !n.loc) return;
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

function jsxAttrName(attr: t.JSXAttribute): string | null {
  return t.isJSXIdentifier(attr.name) ? attr.name.name : null;
}

function findJsxAttr(opening: t.JSXOpeningElement, name: string): t.JSXAttribute | null {
  for (const attr of opening.attributes) {
    if (t.isJSXAttribute(attr) && jsxAttrName(attr) === name) return attr;
  }
  return null;
}

function buildStyleSplice(
  source: string,
  element: t.JSXElement,
  ops: Array<{ key: string; value: string | null }>,
): Splice | { error: string } | null {
  const opening = element.openingElement;
  const existing = findJsxAttr(opening, 'style');
  // Raw source slices, not parsed values — preserves variables and
  // complex expressions exactly as authored.
  const style = new Map<string, string>();

  if (existing) {
    const value = existing.value;
    if (!value || !t.isJSXExpressionContainer(value)) {
      return { error: 'style attribute has unsupported form' };
    }
    const expr = value.expression;
    if (!t.isObjectExpression(expr)) {
      return { error: 'style is not a literal object' };
    }
    for (const prop of expr.properties) {
      if (!t.isObjectProperty(prop)) {
        return { error: 'style contains spread or method' };
      }
      if (prop.computed) return { error: 'style has computed key' };
      let keyName: string | null = null;
      if (t.isIdentifier(prop.key)) keyName = prop.key.name;
      else if (t.isStringLiteral(prop.key)) keyName = prop.key.value;
      if (!keyName) return { error: 'style has unsupported key' };
      const v = prop.value;
      if (typeof v.start !== 'number' || typeof v.end !== 'number') {
        return { error: 'style value missing source range' };
      }
      style.set(keyName, source.slice(v.start, v.end));
    }
  }

  for (const op of ops) {
    if (op.value === null) style.delete(op.key);
    else style.set(op.key, jsString(op.value));
  }

  if (style.size === 0) {
    if (!existing) return null;
    let from = existing.start ?? 0;
    if (from > 0 && source[from - 1] === ' ') from -= 1;
    return { from, to: existing.end ?? 0, text: '' };
  }

  const propsText = Array.from(style.entries())
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  const newAttr = `style={{ ${propsText} }}`;

  if (existing) {
    return { from: existing.start ?? 0, to: existing.end ?? 0, text: newAttr };
  }
  return { from: opening.name.end ?? 0, to: opening.name.end ?? 0, text: ` ${newAttr}` };
}

function formatJsxText(value: string): string {
  // JSXText can't hold `{}<>` and collapses leading/trailing whitespace,
  // so wrap the value in an expression container when it would lose info.
  if (/[{}<>]/.test(value) || /^\s|\s$/.test(value) || value === '') {
    return `{${jsString(value)}}`;
  }
  return value;
}

type TextCandidate = {
  // Normalized current text the candidate represents — what an
  // unambiguous DOM `textContent` would render here. Used to match
  // against the client-supplied `prevText` when there's more than one.
  current: string;
  splice: (value: string) => Splice;
};

type JsxParent = t.JSXElement | t.JSXFragment;

function meaningfulChildren(parent: JsxParent): t.Node[] {
  return parent.children.filter((c) => {
    if (t.isJSXText(c)) return c.value.trim() !== '';
    return true;
  });
}

// Wrap-style splice: rewrite the whole children span of `parent`. Used
// when the candidate is the parent's only meaningful child, so old
// surrounding whitespace nodes don't leak into the new value.
function wrapSplice(parent: JsxParent, text: string): Splice {
  const first = parent.children[0];
  const last = parent.children[parent.children.length - 1];
  return { from: first.start ?? 0, to: last.end ?? 0, text };
}

function collectTextCandidates(element: JsxParent, out: TextCandidate[]): void {
  const meaningful = meaningfulChildren(element);
  const isSole = meaningful.length === 1;
  for (const child of meaningful) {
    if (t.isJSXText(child)) {
      const current = child.value.trim();
      if (!current) continue;
      out.push({
        current,
        splice: (v) =>
          isSole
            ? wrapSplice(element, formatJsxText(v))
            : { from: child.start ?? 0, to: child.end ?? 0, text: formatJsxText(v) },
      });
    } else if (t.isJSXExpressionContainer(child)) {
      const expr = child.expression;
      if (t.isStringLiteral(expr) || t.isNumericLiteral(expr)) {
        const current = String(expr.value);
        out.push({
          current,
          splice: (v) =>
            isSole
              ? wrapSplice(element, `{${jsString(v)}}`)
              : { from: child.start ?? 0, to: child.end ?? 0, text: `{${jsString(v)}}` },
        });
      }
    } else if (t.isJSXElement(child) || t.isJSXFragment(child)) {
      collectTextCandidates(child, out);
    }
  }
}

// `<Wrap>{children}</Wrap>` and `<h2>{title}</h2>` — sole child is a
// JSXExpressionContainer wrapping a bare Identifier. Returns the identifier
// name; callers branch on `'children'` vs. a generic prop passthrough.
function propPassthroughName(element: t.JSXElement): string | null {
  const meaningful = meaningfulChildren(element);
  if (meaningful.length !== 1) return null;
  const child = meaningful[0];
  if (!t.isJSXExpressionContainer(child)) return null;
  return t.isIdentifier(child.expression) ? child.expression.name : null;
}

type EnclosingComponent = {
  name: string;
  fn: t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression;
};

// Smallest top-level capitalized function whose body covers `target`.
function findEnclosingComponent(ast: t.File, target: t.Node): EnclosingComponent | null {
  let best: EnclosingComponent | null = null;
  let bestSize = Number.POSITIVE_INFINITY;
  const targetStart = target.start ?? 0;
  const targetEnd = target.end ?? 0;
  const consider = (name: string, fn: EnclosingComponent['fn']) => {
    if (!/^[A-Z]/.test(name)) return;
    const fnStart = fn.start ?? 0;
    const fnEnd = fn.end ?? 0;
    if (fnStart > targetStart || fnEnd < targetEnd) return;
    const size = fnEnd - fnStart;
    if (size < bestSize) {
      best = { name, fn };
      bestSize = size;
    }
  };
  const visitDecl = (decl: t.Statement) => {
    if (t.isFunctionDeclaration(decl) && decl.id) {
      consider(decl.id.name, decl);
    } else if (t.isVariableDeclaration(decl)) {
      for (const d of decl.declarations) {
        if (!t.isVariableDeclarator(d) || !t.isIdentifier(d.id) || !d.init) continue;
        if (t.isArrowFunctionExpression(d.init) || t.isFunctionExpression(d.init)) {
          consider(d.id.name, d.init);
        }
      }
    }
  };
  for (const decl of ast.program.body) {
    visitDecl(decl);
    if (t.isExportNamedDeclaration(decl) || t.isExportDefaultDeclaration(decl)) {
      const inner = decl.declaration;
      if (inner && (t.isStatement(inner) || t.isFunctionDeclaration(inner))) {
        visitDecl(inner as t.Statement);
      }
    }
  }
  return best;
}

function componentDestructuresProp(fn: EnclosingComponent['fn'], propName: string): boolean {
  if (fn.params.length === 0) return false;
  let first: t.Node = fn.params[0];
  // Handle `({ title }: Props = defaults)` — strip the default-value wrapper.
  if (t.isAssignmentPattern(first)) first = first.left;
  if (!t.isObjectPattern(first)) return false;
  for (const prop of first.properties) {
    if (!t.isObjectProperty(prop)) continue;
    if (t.isIdentifier(prop.key) && prop.key.name === propName) return true;
    if (t.isStringLiteral(prop.key) && prop.key.value === propName) return true;
  }
  return false;
}

function collectCallSiteCandidates(ast: t.Node, componentName: string): TextCandidate[] {
  const out: TextCandidate[] = [];
  walkJsx(ast, (n) => {
    if (!t.isJSXElement(n)) return;
    const elName = n.openingElement.name;
    if (t.isJSXIdentifier(elName) && elName.name === componentName) {
      collectTextCandidates(n, out);
    }
  });
  return out;
}

// Emit a JSX attribute value: `"foo"` when the value is round-trip-safe
// inside double quotes; otherwise wrap in `{...}` so escapes work.
function formatJsxAttrValue(value: string): string {
  if (/^[^"\\<>&{}\n\r]*$/.test(value)) return `"${value}"`;
  return `{${jsString(value)}}`;
}

function spliceRange(node: t.Node, text: string): Splice {
  return { from: node.start ?? 0, to: node.end ?? 0, text };
}

function collectPropCallSiteCandidates(
  ast: t.Node,
  componentName: string,
  propName: string,
): TextCandidate[] {
  const out: TextCandidate[] = [];
  walkJsx(ast, (n) => {
    if (!t.isJSXElement(n)) return;
    const elName = n.openingElement.name;
    if (!t.isJSXIdentifier(elName) || elName.name !== componentName) return;
    const attr = findJsxAttr(n.openingElement, propName);
    if (!attr?.value) return; // shorthand-true: not editable text.
    const v = attr.value;
    if (t.isStringLiteral(v)) {
      out.push({
        current: v.value,
        splice: (s) => spliceRange(v, formatJsxAttrValue(s)),
      });
    } else if (t.isJSXExpressionContainer(v)) {
      const expr = v.expression;
      if (t.isStringLiteral(expr) || t.isNumericLiteral(expr)) {
        out.push({
          current: String(expr.value),
          splice: (s) => spliceRange(v, formatJsxAttrValue(s)),
        });
      }
    }
  });
  return out;
}

// Smallest enclosing `arr.map((p) => …)` callback (or `.flatMap`) that
// covers `target`. Returns the callback fn plus the array argument node.
function findEnclosingMapCallback(
  ast: t.Node,
  target: t.Node,
): { fn: t.ArrowFunctionExpression | t.FunctionExpression; arrayArg: t.Expression } | null {
  type Best = {
    fn: t.ArrowFunctionExpression | t.FunctionExpression;
    arrayArg: t.Expression;
    size: number;
  };
  let best: Best | null = null;
  const targetStart = target.start ?? 0;
  const targetEnd = target.end ?? 0;
  walkAll(ast, (node) => {
    if (!t.isCallExpression(node)) return;
    const callee = node.callee;
    if (!t.isMemberExpression(callee) || callee.computed) return;
    if (!t.isIdentifier(callee.property)) return;
    if (callee.property.name !== 'map' && callee.property.name !== 'flatMap') return;
    const fn = node.arguments[0];
    if (!fn || (!t.isArrowFunctionExpression(fn) && !t.isFunctionExpression(fn))) return;
    const fnStart = fn.start ?? 0;
    const fnEnd = fn.end ?? 0;
    if (fnStart > targetStart || fnEnd < targetEnd) return;
    if (!t.isExpression(callee.object)) return;
    const size = fnEnd - fnStart;
    if (!best || size < best.size) best = { fn, arrayArg: callee.object, size };
  });
  if (!best) return null;
  const found: Best = best;
  return { fn: found.fn, arrayArg: found.arrayArg };
}

type ArrayElement = t.Expression | t.SpreadElement;

// `[ {...}, {...} ]` literal, either inline or via a `const x = [ ... ]`
// declaration the receiver resolves to. Returns the ArrayExpression's
// element list, or null if we can't resolve to a literal.
function resolveArrayLiteralElements(ast: t.Node, expr: t.Expression): ArrayElement[] | null {
  const dropHoles = (arr: t.ArrayExpression): ArrayElement[] =>
    arr.elements.filter((e): e is ArrayElement => e != null);
  if (t.isArrayExpression(expr)) return dropHoles(expr);
  if (!t.isIdentifier(expr)) return null;
  const name = expr.name;
  const useStart = expr.start ?? 0;
  let init: t.ArrayExpression | null = null;
  walkAll(ast, (node) => {
    if (!t.isVariableDeclarator(node)) return;
    if (!t.isIdentifier(node.id) || node.id.name !== name) return;
    if (!node.init || !t.isArrayExpression(node.init)) return;
    // Must be declared before the use site; pick the most local match.
    if ((node.init.start ?? 0) > useStart) return;
    init = node.init;
  });
  return init ? dropHoles(init) : null;
}

function findObjectProperty(obj: t.Node, name: string): t.ObjectProperty | null {
  if (!t.isObjectExpression(obj)) return null;
  for (const prop of obj.properties) {
    if (!t.isObjectProperty(prop) || prop.computed) continue;
    if (t.isIdentifier(prop.key) && prop.key.name === name) return prop;
    if (t.isStringLiteral(prop.key) && prop.key.value === name) return prop;
  }
  return null;
}

// Decode `{p.field}` (MemberExpression) or `{field}` (Identifier
// destructured from the callback param) into a single field name.
function decodeMapPassthrough(
  element: t.JSXElement,
  callbackParam: t.Node | undefined,
): string | null {
  const meaningful = meaningfulChildren(element);
  if (meaningful.length !== 1) return null;
  const child = meaningful[0];
  if (!t.isJSXExpressionContainer(child)) return null;
  const expr = child.expression;

  if (t.isMemberExpression(expr)) {
    if (expr.computed) return null;
    if (!t.isIdentifier(expr.object) || !t.isIdentifier(expr.property)) return null;
    if (!callbackParam || !t.isIdentifier(callbackParam)) return null;
    if (callbackParam.name !== expr.object.name) return null;
    return expr.property.name;
  }

  if (t.isIdentifier(expr)) {
    const fieldName = expr.name;
    // Param is `{ field, ... }` destructuring — the identifier names the
    // destructured property. Skip alias/rename forms (`{ field: alias }`).
    if (!callbackParam || !t.isObjectPattern(callbackParam)) return null;
    for (const prop of callbackParam.properties) {
      if (!t.isObjectProperty(prop) || prop.computed) continue;
      if (!t.isIdentifier(prop.key) || prop.key.name !== fieldName) continue;
      // Shorthand `{ field }` → value is also an Identifier with same name.
      // Aliased `{ field: other }` → value is a different identifier; skip.
      return t.isIdentifier(prop.value) && prop.value.name === fieldName ? fieldName : null;
    }
  }

  return null;
}

function collectArrayMapCandidates(ast: t.Node, element: t.JSXElement): TextCandidate[] {
  const ctx = findEnclosingMapCallback(ast, element);
  if (!ctx) return [];
  const fieldName = decodeMapPassthrough(element, ctx.fn.params[0]);
  if (!fieldName) return [];
  const elements = resolveArrayLiteralElements(ast, ctx.arrayArg);
  if (!elements) return [];
  const out: TextCandidate[] = [];
  for (const obj of elements) {
    const prop = findObjectProperty(obj, fieldName);
    if (!prop) continue;
    const v = prop.value;
    if (t.isStringLiteral(v)) {
      out.push({ current: v.value, splice: (s) => spliceRange(v, jsString(s)) });
    } else if (t.isNumericLiteral(v)) {
      out.push({ current: String(v.value), splice: (s) => spliceRange(v, jsString(s)) });
    }
  }
  return out;
}

function buildTextSplice(
  ast: t.File,
  element: t.JSXElement,
  value: string,
  prevText?: string,
): Splice | { error: string } {
  const candidates: TextCandidate[] = [];
  collectTextCandidates(element, candidates);
  if (candidates.length === 0) {
    const passthrough = propPassthroughName(element);
    const enclosing = passthrough ? findEnclosingComponent(ast, element) : null;
    if (passthrough === 'children' && enclosing) {
      candidates.push(...collectCallSiteCandidates(ast, enclosing.name));
    } else if (
      // `<h2>{title}</h2>` — route to the matching prop literal at each
      // call site so reused components are independently editable.
      passthrough &&
      enclosing &&
      componentDestructuresProp(enclosing.fn, passthrough)
    ) {
      candidates.push(...collectPropCallSiteCandidates(ast, enclosing.name, passthrough));
    }
  }
  if (candidates.length === 0) {
    // `surfaces.map((s) => <div>{s.label}</div>)` and the destructured
    // form `({ label }) => <div>{label}</div>` — text lives in the
    // matching object literal of the iterated array.
    candidates.push(...collectArrayMapCandidates(ast, element));
  }
  if (candidates.length === 0) {
    return { error: 'element has no editable text' };
  }
  if (candidates.length === 1) {
    return candidates[0].splice(value);
  }
  if (prevText === undefined) {
    return { error: 'element has multiple text candidates; missing prevText' };
  }
  // Trim: JSX collapses surrounding whitespace at render time, so the
  // DOM `prevText` won't have leading/trailing space the source might.
  const norm = prevText.trim();
  const matches = candidates.filter((c) => c.current === norm);
  if (matches.length === 0) {
    return { error: 'no text candidate matches the current value' };
  }
  if (matches.length > 1) {
    return { error: 'multiple text candidates share the same value; cannot disambiguate' };
  }
  return matches[0].splice(value);
}

type ImportInfo = { node: t.ImportDeclaration; source: string; defaultIdent: string | null };

function findImports(ast: t.File): ImportInfo[] {
  const out: ImportInfo[] = [];
  for (const node of ast.program.body) {
    if (!t.isImportDeclaration(node)) continue;
    let def: string | null = null;
    for (const spec of node.specifiers) {
      if (t.isImportDefaultSpecifier(spec)) {
        def = spec.local.name;
        break;
      }
    }
    out.push({ node, source: node.source.value, defaultIdent: def });
  }
  return out;
}

function collectTopLevelIdentifiers(ast: t.File): Set<string> {
  // Only need to avoid colliding with anything resolvable by JSX —
  // import bindings cover the common case. Local consts/lets are
  // handled by source-level identifier scanning below.
  const names = new Set<string>();
  for (const imp of findImports(ast)) {
    if (imp.defaultIdent) names.add(imp.defaultIdent);
    for (const spec of imp.node.specifiers) {
      if (!t.isImportDefaultSpecifier(spec)) names.add(spec.local.name);
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

type AssetEditPlan = {
  importSplice: Splice | null;
  attrSplice: Splice;
};

function planAssetImport(
  ast: t.File,
  assetPath: string,
): { identifier: string; importSplice: Splice | null } {
  const imports = findImports(ast);
  for (const imp of imports) {
    if (imp.source === assetPath && imp.defaultIdent) {
      return { identifier: imp.defaultIdent, importSplice: null };
    }
  }
  const filename = assetPath.slice(assetPath.lastIndexOf('/') + 1);
  const identifier = safeAssetIdentifier(filename, collectTopLevelIdentifiers(ast));
  const importStmt = `import ${identifier} from '${assetPath.replace(/'/g, "\\'")}';\n`;
  const last = imports[imports.length - 1];
  const insertAt = last ? (last.node.end ?? 0) : 0;
  const prefix = last ? '\n' : '';
  return { identifier, importSplice: { from: insertAt, to: insertAt, text: prefix + importStmt } };
}

function planAssetAttr(
  ast: t.File,
  element: t.JSXElement,
  attr: string,
  assetPath: string,
): AssetEditPlan | { error: string } {
  if (!attr || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(attr)) return { error: 'invalid attribute name' };
  if (!assetPath.startsWith('./assets/')) return { error: 'asset path must start with ./assets/' };

  const { identifier, importSplice } = planAssetImport(ast, assetPath);
  const opening = element.openingElement;
  const newAttr = `${attr}={${identifier}}`;
  const existing = findJsxAttr(opening, attr);
  const attrSplice: Splice = existing
    ? { from: existing.start ?? 0, to: existing.end ?? 0, text: newAttr }
    : { from: opening.name.end ?? 0, to: opening.name.end ?? 0, text: ` ${newAttr}` };
  return { importSplice, attrSplice };
}

type PlaceholderEditPlan = {
  importSplice: Splice | null;
  elementSplice: Splice;
};

function readJsxStringAttr(opening: t.JSXOpeningElement, name: string): string | null {
  const attr = findJsxAttr(opening, name);
  const v = attr?.value;
  if (!v) return null;
  if (t.isStringLiteral(v)) return v.value;
  if (t.isJSXExpressionContainer(v) && t.isStringLiteral(v.expression)) return v.expression.value;
  return null;
}

function readJsxNumberAttr(opening: t.JSXOpeningElement, name: string): number | null {
  const attr = findJsxAttr(opening, name);
  const v = attr?.value;
  if (!v || !t.isJSXExpressionContainer(v)) return null;
  if (!t.isNumericLiteral(v.expression)) return null;
  const n = v.expression.value;
  return Number.isFinite(n) ? n : null;
}

function planReplacePlaceholder(
  ast: t.File,
  element: t.JSXElement,
  assetPath: string,
): PlaceholderEditPlan | { error: string } {
  const opening = element.openingElement;
  if (!t.isJSXIdentifier(opening.name) || opening.name.name !== 'ImagePlaceholder') {
    return { error: 'not a placeholder' };
  }
  if (!assetPath.startsWith('./assets/')) return { error: 'asset path must start with ./assets/' };

  const hint = readJsxStringAttr(opening, 'hint') ?? '';
  const width = readJsxNumberAttr(opening, 'width');
  const height = readJsxNumberAttr(opening, 'height');

  const { identifier, importSplice } = planAssetImport(ast, assetPath);

  const styleParts: string[] = [];
  if (width != null) styleParts.push(`width: ${width}`);
  if (height != null) styleParts.push(`height: ${height}`);
  styleParts.push(`objectFit: 'cover'`);
  const replacement =
    `<img src={${identifier}} alt=${jsString(hint)} ` + `style={{ ${styleParts.join(', ')} }} />`;

  return { importSplice, elementSplice: spliceRange(element, replacement) };
}

export function applyEdit(
  source: string,
  line: number,
  column: number,
  ops: EditOp[],
): ApplyEditResult {
  if (ops.length === 0) return { ok: true, source };

  const ast = parseSource(source);
  if (!ast) return { ok: false, status: 422, error: 'could not parse source' };
  const element = findInnermostJsxElement(ast, line, column);
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
    const result = buildTextSplice(ast, element, op.value, op.prevText);
    if ('error' in result) return { ok: false, status: 422, error: result.error };
    splices.push(result);
  }

  const assetOps = ops.flatMap((op) => (op.kind === 'set-attr-asset' ? [op] : []));
  const placeholderOps = ops.flatMap((op) =>
    op.kind === 'replace-placeholder-with-image' ? [op] : [],
  );
  if (assetOps.length > 0 || placeholderOps.length > 0) {
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
