// Visits every JSXElement/JSXFragment; return `'stop'` to short-circuit.

export type Loc = { line: number; column: number };
export type AstNode = {
  type: string;
  start: number;
  end: number;
  loc?: { start: Loc; end: Loc };
  [k: string]: unknown;
};

const SKIP_KEYS = new Set([
  'loc',
  'start',
  'end',
  'type',
  'extra',
  'leadingComments',
  'trailingComments',
  'innerComments',
]);

// biome-ignore lint/suspicious/noConfusingVoidType: callers return void or 'stop' to short-circuit traversal.
type Visitor = (node: AstNode) => void | 'stop';

function walk(ast: unknown, visit: Visitor, accept: (n: AstNode) => boolean): void {
  let stopped = false;
  const recurse = (node: unknown): void => {
    if (stopped || !node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const c of node) recurse(c);
      return;
    }
    const n = node as AstNode;
    if (typeof n.type !== 'string') return;
    if (accept(n) && visit(n) === 'stop') {
      stopped = true;
      return;
    }
    for (const key of Object.keys(n)) {
      if (SKIP_KEYS.has(key)) continue;
      recurse((n as Record<string, unknown>)[key]);
    }
  };
  recurse(ast);
}

const isJsx = (n: AstNode) => n.type === 'JSXElement' || n.type === 'JSXFragment';
const acceptAll = () => true;

export function walkJsx(ast: unknown, visit: Visitor): void {
  walk(ast, visit, isJsx);
}

export function walkAll(ast: unknown, visit: Visitor): void {
  walk(ast, visit, acceptAll);
}
