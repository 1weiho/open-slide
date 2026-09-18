export function paintKeys(root: Element): Map<Element, number[]> {
  const elements = [root, ...root.querySelectorAll('*')];
  const indices = new Map(elements.map((element, index) => [element, index]));
  const styles = new Map(elements.map((element) => [element, getComputedStyle(element)]));
  const contexts = new Set(
    elements.filter((element) => {
      if (element === root) return true;
      const style = styles.get(element);
      if (!style) return false;
      const parentDisplay = element.parentElement ? styles.get(element.parentElement)?.display : '';
      return (
        style.isolation === 'isolate' ||
        Number(style.opacity) < 1 ||
        style.transform !== 'none' ||
        style.filter !== 'none' ||
        style.perspective !== 'none' ||
        ['fixed', 'sticky'].includes(style.position) ||
        (style.zIndex !== 'auto' &&
          (style.position !== 'static' ||
            ['flex', 'grid', 'inline-flex', 'inline-grid'].includes(parentDisplay ?? '')))
      );
    }),
  );
  const keys = new Map<Element, number[]>();
  const key = (element: Element): number[] => {
    const saved = keys.get(element);
    if (saved) return saved;
    if (element === root) return [];
    const style = styles.get(element);
    if (style?.display === 'inline' && style.position === 'static' && element.parentElement) {
      const result = key(element.parentElement);
      keys.set(element, result);
      return result;
    }
    let parent = element.parentElement;
    while (parent && !contexts.has(parent)) parent = parent.parentElement;
    const prefix = parent ? key(parent) : [];
    let positioned = style?.position !== 'static';
    for (
      let ancestor = element.parentElement;
      ancestor && ancestor !== parent;
      ancestor = ancestor.parentElement
    ) {
      if (styles.get(ancestor)?.position !== 'static') positioned = true;
    }
    const z = contexts.has(element) ? Number.parseInt(style?.zIndex ?? '0', 10) || 0 : 0;
    const layer = z < 0 ? 1 : z > 0 ? 4 : positioned || contexts.has(element) ? 3 : 2;
    const result = [...prefix, layer, z, indices.get(element) ?? 0];
    keys.set(element, result);
    return result;
  };
  for (const element of elements) key(element);
  return keys;
}

export function comparePaintKeys(a: number[], b: number[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}
