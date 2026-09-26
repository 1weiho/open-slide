import type { Decoration } from './effects';
import { roundPath } from './effects';
import type { PptxPathCommand, PptxStroke } from './model';
import { color, opacity, px, visible } from './style';

export function svgPath(value: string): PptxPathCommand[] {
  const tokens = value.match(/[a-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi) ?? [];
  const counts: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7 };
  const path: PptxPathCommand[] = [];
  let i = 0,
    command = '',
    previous = '',
    x = 0,
    y = 0,
    sx = 0,
    sy = 0,
    cx = 0,
    cy = 0;
  while (i < tokens.length) {
    if (/^[a-z]$/i.test(tokens[i])) command = tokens[i++];
    const kind = command.toUpperCase(),
      relative = command !== kind;
    if (kind === 'Z') {
      path.push({ type: 'close' });
      x = sx;
      y = sy;
      command = '';
      previous = kind;
      continue;
    }
    const count = counts[kind];
    if (!count || i + count > tokens.length) throw new Error('Invalid SVG path command.');
    const values = tokens.slice(i, i + count).map(Number);
    if (values.some((v) => !Number.isFinite(v))) throw new Error('Invalid SVG path coordinates.');
    i += count;
    const point = (index: number) => ({
      x: values[index] + (relative ? x : 0),
      y: values[index + 1] + (relative ? y : 0),
    });
    let end = { x, y };
    if (kind === 'M' || kind === 'L') {
      end = point(0);
      path.push({ type: kind === 'M' ? 'move' : 'line', ...end });
      if (kind === 'M') {
        sx = end.x;
        sy = end.y;
        command = relative ? 'l' : 'L';
      }
    } else if (kind === 'H' || kind === 'V') {
      end =
        kind === 'H'
          ? { x: values[0] + (relative ? x : 0), y }
          : { x, y: values[0] + (relative ? y : 0) };
      path.push({ type: 'line', ...end });
    } else if (kind === 'C' || kind === 'S') {
      const first =
        kind === 'C'
          ? point(0)
          : ['C', 'S'].includes(previous)
            ? { x: 2 * x - cx, y: 2 * y - cy }
            : { x, y };
      const second = point(kind === 'C' ? 2 : 0);
      end = point(kind === 'C' ? 4 : 2);
      path.push({ type: 'cubic', x1: first.x, y1: first.y, x2: second.x, y2: second.y, ...end });
      cx = second.x;
      cy = second.y;
    } else if (kind === 'Q' || kind === 'T') {
      const control =
        kind === 'Q'
          ? point(0)
          : ['Q', 'T'].includes(previous)
            ? { x: 2 * x - cx, y: 2 * y - cy }
            : { x, y };
      end = point(kind === 'Q' ? 2 : 0);
      path.push({
        type: 'cubic',
        x1: x + ((control.x - x) * 2) / 3,
        y1: y + ((control.y - y) * 2) / 3,
        x2: end.x + ((control.x - end.x) * 2) / 3,
        y2: end.y + ((control.y - end.y) * 2) / 3,
        ...end,
      });
      cx = control.x;
      cy = control.y;
    } else if (kind === 'A') {
      end = point(5);
      if (x !== end.x || y !== end.y) {
        const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arc.setAttribute('d', `M${x} ${y} A${values.slice(0, 5).join(' ')} ${end.x} ${end.y}`);
        const total = arc.getTotalLength();
        const steps = Math.max(2, Math.min(2048, Math.ceil(total / 2)));
        for (let step = 1; step <= steps; step++) {
          const p = arc.getPointAtLength((total * step) / steps);
          path.push({ type: 'line', x: p.x, y: p.y });
        }
      }
    }
    x = end.x;
    y = end.y;
    previous = kind;
  }
  return path;
}

function primitivePath(element: SVGGeometryElement): PptxPathCommand[] {
  const attr = (name: string) => px(element.getAttribute(name) ?? '0');
  if (element.localName === 'path') return svgPath(element.getAttribute('d') ?? '');
  if (element.localName === 'line')
    return [
      { type: 'move', x: attr('x1'), y: attr('y1') },
      { type: 'line', x: attr('x2'), y: attr('y2') },
    ];
  if (element.localName === 'polyline' || element.localName === 'polygon') {
    const values =
      element
        .getAttribute('points')
        ?.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi)
        ?.map(Number) ?? [];
    const result: PptxPathCommand[] = [];
    for (let i = 0; i < values.length - 1; i += 2)
      result.push({ type: i ? 'line' : 'move', x: values[i], y: values[i + 1] });
    if (element.localName === 'polygon') result.push({ type: 'close' });
    return result;
  }
  if (element.localName === 'rect') {
    return roundPath(attr('width'), attr('height'), Array(4).fill(attr('rx') || attr('ry'))).map(
      (command) =>
        command.type === 'close'
          ? command
          : command.type === 'cubic'
            ? {
                ...command,
                x: command.x + attr('x'),
                y: command.y + attr('y'),
                x1: command.x1 + attr('x'),
                y1: command.y1 + attr('y'),
                x2: command.x2 + attr('x'),
                y2: command.y2 + attr('y'),
              }
            : { ...command, x: command.x + attr('x'), y: command.y + attr('y') },
    );
  }
  const cx = attr('cx'),
    cy = attr('cy'),
    rx = attr('r') || attr('rx'),
    ry = attr('r') || attr('ry'),
    k = 0.552284749831;
  return [
    { type: 'move', x: cx + rx, y: cy },
    {
      type: 'cubic',
      x1: cx + rx,
      y1: cy + k * ry,
      x2: cx + k * rx,
      y2: cy + ry,
      x: cx,
      y: cy + ry,
    },
    {
      type: 'cubic',
      x1: cx - k * rx,
      y1: cy + ry,
      x2: cx - rx,
      y2: cy + k * ry,
      x: cx - rx,
      y: cy,
    },
    {
      type: 'cubic',
      x1: cx - rx,
      y1: cy - k * ry,
      x2: cx - k * rx,
      y2: cy - ry,
      x: cx,
      y: cy - ry,
    },
    {
      type: 'cubic',
      x1: cx + k * rx,
      y1: cy - ry,
      x2: cx + rx,
      y2: cy - k * ry,
      x: cx + rx,
      y: cy,
    },
    { type: 'close' },
  ];
}

export function svgShapes(svg: SVGSVGElement, root: Element, origin: DOMRect): Decoration[] {
  const result: Decoration[] = [];
  for (const element of svg.querySelectorAll('*')) {
    if (!visible(element) || element.closest('defs,clipPath,mask,pattern,marker')) continue;
    if (
      ['g', 'title', 'desc', 'animate', 'animateMotion', 'animateTransform', 'mpath'].includes(
        element.localName,
      )
    )
      continue;
    if (!(element instanceof SVGGeometryElement))
      throw new Error(`SVG ${element.localName} requires a native adapter.`);
    const style = getComputedStyle(element);
    if (style.filter !== 'none' || style.maskImage !== 'none' || style.clipPath !== 'none')
      throw new Error('An inline SVG filter, mask or clipping path requires a native adapter.');
    if (style.fill.startsWith('url(') || style.stroke.startsWith('url('))
      throw new Error('An inline SVG paint server requires a native adapter.');
    const matrix = element.getScreenCTM();
    if (!matrix) throw new Error('The SVG geometry has no layout transform.');
    const map = (x: number, y: number) => {
      const p = new DOMPoint(x, y).matrixTransform(matrix);
      return { x: p.x - origin.x, y: p.y - origin.y };
    };
    let path = primitivePath(element).map((command) => {
      if (command.type === 'close') return command;
      if (command.type === 'cubic') {
        const a = map(command.x1, command.y1),
          b = map(command.x2, command.y2);
        return { ...command, ...map(command.x, command.y), x1: a.x, y1: a.y, x2: b.x, y2: b.y };
      }
      return { ...command, ...map(command.x, command.y) };
    });
    const points = path.flatMap((command) =>
      command.type === 'close'
        ? []
        : command.type === 'cubic'
          ? [
              { x: command.x, y: command.y },
              { x: command.x1, y: command.y1 },
              { x: command.x2, y: command.y2 },
            ]
          : [command],
    );
    if (!points.length) continue;
    const x = Math.min(...points.map((p) => p.x)),
      y = Math.min(...points.map((p) => p.y));
    const w = Math.max(0.01, Math.max(...points.map((p) => p.x)) - x),
      h = Math.max(0.01, Math.max(...points.map((p) => p.y)) - y);
    path = path.map((command) =>
      command.type === 'close'
        ? command
        : command.type === 'cubic'
          ? {
              ...command,
              x: command.x - x,
              y: command.y - y,
              x1: command.x1 - x,
              y1: command.y1 - y,
              x2: command.x2 - x,
              y2: command.y2 - y,
            }
          : { ...command, x: command.x - x, y: command.y - y },
    );
    const alpha = opacity(element, root);
    const fill =
      style.fill === 'none' ? undefined : color(style.fill, alpha * Number(style.fillOpacity));
    const stroke: PptxStroke | undefined =
      style.stroke === 'none'
        ? undefined
        : {
            ...color(style.stroke, alpha * Number(style.strokeOpacity)),
            width:
              px(style.strokeWidth) *
              Math.sqrt(Math.abs(matrix.a * matrix.d - matrix.b * matrix.c)),
            cap:
              style.strokeLinecap === 'round'
                ? 'round'
                : style.strokeLinecap === 'square'
                  ? 'square'
                  : 'flat',
            join:
              style.strokeLinejoin === 'round'
                ? 'round'
                : style.strokeLinejoin === 'bevel'
                  ? 'bevel'
                  : 'miter',
          };
    if (fill?.opacity || stroke?.opacity)
      result.push({ x, y, w, h, kind: 'shape', geometry: 'path', path, fill, stroke });
  }
  return result;
}
