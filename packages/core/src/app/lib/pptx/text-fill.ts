import { gradient } from './effects';
import type { PptxRun } from './model';
import { color, opacity } from './style';

export function textFill(element: Element, root: Element): Partial<PptxRun> {
  for (let current: Element | null = element; current; current = current.parentElement) {
    const style = getComputedStyle(current);
    if (style.backgroundClip === 'text' || style.webkitBackgroundClip === 'text') {
      const box = current.getBoundingClientRect();
      const alpha = opacity(element, root);
      if (style.backgroundImage === 'none') return { color: color(style.backgroundColor, alpha) };
      const fill = gradient(style.backgroundImage, box.width, box.height, alpha);
      return {
        color: fill.stops[0].color,
        gradient: fill,
        gradientBounds: { w: box.width, h: box.height },
      };
    }
    if (current === root) break;
  }
  return {};
}
