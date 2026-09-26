const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_TAGS = new Set([
  'svg',
  'path',
  'circle',
  'rect',
  'line',
  'polyline',
  'polygon',
  'ellipse',
  'g',
  'defs',
  'linearGradient',
  'radialGradient',
  'stop',
  'clipPath',
  'mask',
  'filter',
  'feGaussianBlur',
  'text',
]);

function applyAttrs(el, attrs, isSvg) {
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'style') {
      if (typeof v === 'string') el.style.cssText = v;
      else Object.assign(el.style, v);
    } else if (k === 'text') {
      el.textContent = v;
    } else if (k === 'html') {
      el.innerHTML = v;
    } else if (k === 'class') {
      if (isSvg) el.setAttribute('class', v);
      else el.className = v;
    } else {
      el.setAttribute(k, v === true ? '' : v);
    }
  }
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function h(tag, attrs = {}, ...children) {
  const isSvg = SVG_TAGS.has(tag);
  const el = isSvg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
  if (attrs instanceof Node || typeof attrs === 'string' || Array.isArray(attrs)) {
    children.unshift(attrs);
  } else {
    applyAttrs(el, attrs, isSvg);
  }
  append(el, children);
  return el;
}

const styleCache = new WeakMap();

// Writes only the style properties whose value changed since the last frame.
export function set(el, styles) {
  let cache = styleCache.get(el);
  if (!cache) {
    cache = {};
    styleCache.set(el, cache);
  }
  for (const k in styles) {
    let v = styles[k];
    if (typeof v === 'number' && !UNITLESS.has(k)) v = `${v}px`;
    else v = String(v);
    if (cache[k] === v) continue;
    cache[k] = v;
    if (k.startsWith('--')) el.style.setProperty(k, v);
    else el.style[k] = v;
  }
}

const UNITLESS = new Set(['opacity', 'zIndex', 'fontWeight', 'lineHeight', 'flexGrow', 'scale']);

const textCache = new WeakMap();
export function text(el, value) {
  const v = String(value);
  if (textCache.get(el) === v) return;
  textCache.set(el, v);
  el.textContent = v;
}

const attrCache = new WeakMap();
export function attr(el, name, value) {
  let cache = attrCache.get(el);
  if (!cache) {
    cache = {};
    attrCache.set(el, cache);
  }
  const v = String(value);
  if (cache[name] === v) return;
  cache[name] = v;
  el.setAttribute(name, v);
}

const f = (n, d = 3) => {
  const r = Math.round(n * 10 ** d) / 10 ** d;
  return Object.is(r, -0) ? 0 : r;
};

export function tf({
  x = 0,
  y = 0,
  z = 0,
  s = 1,
  sx = 1,
  sy = 1,
  rx = 0,
  ry = 0,
  rz = 0,
  px = null,
} = {}) {
  let out = '';
  if (px != null) out += `perspective(${px}px) `;
  out += `translate3d(${f(x)}px, ${f(y)}px, ${f(z)}px)`;
  if (rx) out += ` rotateX(${f(rx)}deg)`;
  if (ry) out += ` rotateY(${f(ry)}deg)`;
  if (rz) out += ` rotate(${f(rz)}deg)`;
  const kx = s * sx;
  const ky = s * sy;
  if (kx !== 1 || ky !== 1) out += ` scale(${f(kx, 4)}, ${f(ky, 4)})`;
  return out;
}

export const px = (n) => `${f(n)}px`;
export const round = f;

// Splits text into inline-block spans. Each item: { el, inner, text }.
// With `mask`, each unit gets an overflow-hidden wrapper so it can rise into view.
export function split(container, str, { by = 'char', mask = false, cls = '' } = {}) {
  const units = by === 'word' ? str.split(/(\s+)/) : Array.from(str);
  const items = [];
  for (const u of units) {
    if (/^\s+$/.test(u)) {
      container.append(document.createTextNode(u));
      continue;
    }
    const inner = h('span', { class: `u ${cls}`, text: u, style: 'display:inline-block' });
    if (mask) {
      const wrap = h(
        'span',
        {
          class: 'mask',
          style:
            'display:inline-block;overflow:hidden;vertical-align:top;padding:0.12em 0.04em 0.18em;margin:-0.12em -0.04em -0.18em',
        },
        inner,
      );
      container.append(wrap);
      items.push({ el: wrap, inner, text: u });
    } else {
      container.append(inner);
      items.push({ el: inner, inner, text: u });
    }
  }
  return items;
}

export function mount(parent, ...children) {
  append(parent, children);
  return parent;
}
