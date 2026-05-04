import { isJSXElement, isJSXFragment, type Node } from '@babel/types';

// Loose structural type so plugins that hand-cast their way through
// the AST (design-plugin etc.) keep compiling without null-checks on
// every `start`/`end` read. New code should prefer Babel's specific
// node types (`t.JSXElement`, `t.Identifier`, …) at the use site.
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
type Visitor = (node: Node) => void | 'stop';

function walk(ast: unknown, visit: Visitor, accept: (n: Node) => boolean): void {
  let stopped = false;
  const recurse = (node: unknown): void => {
    if (stopped || !node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const c of node) recurse(c);
      return;
    }
    const n = node as Node;
    if (typeof n.type !== 'string') return;
    if (accept(n) && visit(n) === 'stop') {
      stopped = true;
      return;
    }
    for (const key of Object.keys(n)) {
      if (SKIP_KEYS.has(key)) continue;
      recurse((n as unknown as Record<string, unknown>)[key]);
    }
  };
  recurse(ast);
}

const isJsx = (n: Node) => isJSXElement(n) || isJSXFragment(n);
const acceptAll = () => true;

export function walkJsx(ast: unknown, visit: Visitor): void {
  walk(ast, visit, isJsx);
}

export function walkAll(ast: unknown, visit: Visitor): void {
  walk(ast, visit, acceptAll);
}
