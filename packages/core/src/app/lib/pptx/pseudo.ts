export function materializePseudoElements(root: HTMLElement): () => void {
  const generated: {
    parent: HTMLElement;
    pseudo: string;
    style: [string, string][];
    text: string;
  }[] = [];
  for (const parent of root.querySelectorAll<HTMLElement>('*')) {
    if (!(parent instanceof HTMLElement)) continue;
    for (const pseudo of ['::before', '::after']) {
      const style = getComputedStyle(parent, pseudo);
      if (['none', 'normal'].includes(style.content) || style.display === 'none') continue;
      if (!/^(["']).*\1$/.test(style.content)) continue;
      const text = style.content
        .slice(1, -1)
        .replace(/\\([0-9a-f]{1,6})\s?/gi, (_, hex) =>
          String.fromCodePoint(Number.parseInt(hex, 16)),
        )
        .replace(/\\([\\"'])/g, '$1');
      generated.push({
        parent,
        pseudo,
        text,
        style: Array.from(style, (key) => [key, style.getPropertyValue(key)]),
      });
    }
  }
  if (!generated.length) return () => {};
  const rule = document.createElement('style');
  rule.textContent =
    '[data-osd-pptx-pseudo-before]::before,[data-osd-pptx-pseudo-after]::after{content:none!important;display:none!important}';
  root.append(rule);
  const nodes: HTMLElement[] = [];
  for (const { parent, pseudo, style, text } of generated) {
    const node = document.createElement('span');
    node.dataset.osdPptxGenerated = pseudo;
    node.textContent = text;
    for (const [key, value] of style) node.style.setProperty(key, value);
    node.style.setProperty('animation', 'none', 'important');
    node.style.setProperty('transition', 'none', 'important');
    node.style.setProperty('content', 'normal');
    parent.setAttribute(`data-osd-pptx-pseudo-${pseudo.slice(2)}`, '');
    if (pseudo === '::before') parent.prepend(node);
    else parent.append(node);
    nodes.push(node);
  }
  return () => {
    for (const node of nodes) node.remove();
    for (const { parent, pseudo } of generated)
      parent.removeAttribute(`data-osd-pptx-pseudo-${pseudo.slice(2)}`);
    rule.remove();
  };
}
