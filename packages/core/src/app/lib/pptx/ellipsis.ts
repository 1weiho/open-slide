import { px } from './style';

export type TextLimit = { node: Text; offset: number };

export function ellipsisLimit(element: Element, nodes: Node[]): TextLimit | undefined {
  const style = getComputedStyle(element);
  if (
    style.whiteSpace !== 'nowrap' ||
    style.textOverflow !== 'ellipsis' ||
    !['hidden', 'clip', 'scroll', 'auto'].includes(style.overflowX)
  )
    return;
  const texts: Text[] = [];
  const visit = (node: Node) => {
    if (node instanceof Text) texts.push(node);
    else if (node instanceof Element) {
      const childStyle = getComputedStyle(node);
      if (
        childStyle.display === 'none' ||
        childStyle.visibility !== 'visible' ||
        Number(childStyle.opacity) === 0
      )
        return;
      for (const child of node.childNodes) visit(child);
    }
  };
  for (const node of nodes) visit(node);
  const range = document.createRange();
  const right =
    element.getBoundingClientRect().right - px(style.borderRightWidth) - px(style.paddingRight);
  const overflows = texts.some((node) => {
    range.selectNodeContents(node);
    return range.getBoundingClientRect().right > right + 0.5;
  });
  if (!overflows) return;
  const context = document.createElement('canvas').getContext('2d');
  if (!context) throw new Error('Cannot measure CSS ellipsis.');
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const limit = right - context.measureText('…').width - px(style.letterSpacing);
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  for (const node of texts) {
    for (const segment of segmenter.segment(node.data)) {
      range.setStart(node, segment.index);
      range.setEnd(node, segment.index + segment.segment.length);
      if (range.getBoundingClientRect().right > limit) return { node, offset: segment.index };
    }
  }
}
