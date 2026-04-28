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
export function walkJsx(ast: unknown, visit: (node: AstNode) => void | 'stop'): void {
  let stopped = false;
  const walk = (node: unknown): void => {
    if (stopped || !node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const c of node) walk(c);
      return;
    }
    const n = node as AstNode;
    if (typeof n.type !== 'string') return;
    if (n.type === 'JSXElement' || n.type === 'JSXFragment') {
      if (visit(n) === 'stop') {
        stopped = true;
        return;
      }
    }
    for (const key of Object.keys(n)) {
      if (SKIP_KEYS.has(key)) continue;
      walk((n as Record<string, unknown>)[key]);
    }
  };
  walk(ast);
}
