let context: CanvasRenderingContext2D | null = null;

export function firstTextBaseline(nodes: Node[], origin: DOMRect): number | undefined {
  context ??= document.createElement('canvas').getContext('2d');
  if (!context) return;
  const measure = context;
  const visit = (node: Node): number | undefined => {
    if (node instanceof Text && node.parentElement) {
      const style = getComputedStyle(node.parentElement);
      const range = document.createRange();
      let offset = 0;
      for (const character of node.data) {
        range.setStart(node, offset);
        offset += character.length;
        range.setEnd(node, offset);
        const rect = range.getBoundingClientRect();
        if (!character.trim() || !rect.width || !rect.height) continue;
        return withCanvasTextStyle(measure, style, textLanguage(node.parentElement), () => {
          setCanvasFont(measure, canvasFont(style, style.fontWeight, style.fontFamily));
          return rect.top - origin.top + measure.measureText(character).fontBoundingBoxAscent;
        });
      }
    } else if (node instanceof Element) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) === 0)
        return;
      for (const child of node.childNodes) {
        const baseline = visit(child);
        if (baseline !== undefined) return baseline;
      }
    }
  };
  for (const node of nodes) {
    const baseline = visit(node);
    if (baseline !== undefined) return baseline;
  }
}

export function officeTextTop(baseline: number, lineHeight: number): number {
  // PowerPoint positions an exact-spaced first line around 3/4 of its line box;
  // the browser Range starts at the font's ascent box instead. Native PDF fixtures
  // bound the remaining renderer rounding to a few canvas pixels.
  return baseline - lineHeight * 0.75 - 0.72;
}

import { canvasFont, setCanvasFont, textLanguage, withCanvasTextStyle } from './style';
