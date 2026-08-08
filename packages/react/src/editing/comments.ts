import * as t from '@babel/types';
import { shortId } from '../files/short-id.ts';
import { findJsxAncestors, type JsxContainer, parseSource } from './babel-walk.ts';

const MARKER_RE =
  /\{\/\*\s*@slide-comment\s+id="(c-[a-f0-9]+)"\s+ts="([^"]+)"\s+text="([A-Za-z0-9_-]+={0,2})"\s*\*\/\}/;

export type Comment = { id: string; line: number; ts: string; note: string; hint?: string };

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

export function parseMarkers(source: string): Comment[] {
  const comments: Comment[] = [];
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(MARKER_RE);
    if (!m) continue;
    const [, id, ts, textB64] = m;
    try {
      const payload = JSON.parse(b64urlDecode(textB64)) as { note: string; hint?: string };
      comments.push({ id, line: i + 1, ts, note: payload.note, hint: payload.hint });
    } catch {}
  }
  return comments;
}

export function newCommentId(): string {
  return shortId('c');
}

export function markerDeleteRegex(id: string): RegExp {
  return new RegExp(
    `\\{\\/\\*\\s*@slide-comment\\s+id="${id}"\\s+ts="[^"]+"\\s+text="[A-Za-z0-9_\\-]+={0,2}"\\s*\\*\\/\\}`,
  );
}

// We always splice the marker as the first child of a JSX container.
// A JSX-comment-like token outside JSX context (e.g. as the body of
// `() => ( <Foo/> )`) is parsed as an empty object literal and breaks
// the surrounding expression.
export type InsertionPlan = { offset: number; indent: string };

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

function planInsertion(source: string, target: JsxContainer): InsertionPlan | null {
  if (t.isJSXElement(target) && target.openingElement.selfClosing) return null;
  const opening = t.isJSXFragment(target) ? target.openingFragment : target.openingElement;
  return {
    offset: opening.end ?? 0,
    indent: `${lineIndent(source, target.loc?.start.line ?? 1)}  `,
  };
}

// Walk innermost → outermost looking for the first JSX container we
// can insert *inside* (not self-closing). Self-closing elements like
// `<img/>` get hoisted to their nearest non-self-closing ancestor.
export function findInsertion(
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

export function offsetToLine(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}
