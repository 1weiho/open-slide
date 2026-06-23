import React from 'react';

export type PrimRecord = {
  id: string;
  name: string;
  props: Record<string, any>;
};

export type InstrumentResult = {
  tree: React.ReactNode;
  primitives: PrimRecord[];
};

function nameOf(t: any): string {
  if (!t) return 'Anon';
  return (
    t.displayName ||
    t.name ||
    t?.type?.displayName ||
    t?.type?.name ||
    t?.render?.displayName ||
    t?.render?.name ||
    'Anon'
  );
}

export function instrumentTree(
  root: React.ReactNode,
  idPrefix = 'p',
  options: { skipRoot?: boolean } = {},
): InstrumentResult {
  let counter = 0;
  const primitives: PrimRecord[] = [];

  const mkId = (name: string) => `${idPrefix}-${name}-${counter++}`;

  function walk(node: React.ReactNode, isRoot: boolean): React.ReactNode {
    if (node == null || typeof node === 'boolean') return node;
    if (typeof node === 'string' || typeof node === 'number') return node;
    if (Array.isArray(node)) return node.map((n) => walk(n, false));
    if (!React.isValidElement(node)) return node;
    const el = node as React.ReactElement<any>;
    const { type, props } = el;

    if (typeof type === 'function') {
      const name = nameOf(type);
      // Skip the root Page wrapper — otherwise every slide becomes one giant group.
      if (isRoot && options.skipRoot) {
        let rendered: React.ReactNode;
        try {
          rendered = (type as any)(props);
        } catch {
          return null;
        }
        return walk(rendered, false);
      }
      const id = mkId(name);
      const stash: Record<string, any> = {};
      for (const k of Object.keys(props)) {
        if (k === 'children') continue;
        stash[k] = (props as any)[k];
      }
      primitives.push({ id, name, props: stash });
      let rendered: React.ReactNode;
      try {
        rendered = (type as any)(props);
      } catch {
        return null;
      }
      if (rendered == null) return null;
      const walked = walk(rendered, false);
      if (!React.isValidElement(walked)) return walked;
      return React.cloneElement(
        walked as React.ReactElement<any>,
        {
          'data-prim-id': id,
          'data-prim-name': name,
        } as any,
      );
    }

    if (typeof type === 'string') {
      const children = walk((props as any)?.children, false);
      return React.cloneElement(el, {}, children as any);
    }

    return node;
  }

  const tree = walk(root, true);
  return { tree, primitives };
}
