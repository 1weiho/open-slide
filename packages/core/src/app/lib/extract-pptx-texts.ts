// Walks the slide canvas and returns text runs that are safe to emit as
// native PPTX text boxes on top of the rasterized background image.
//
// IMPORTANT: this function is serialized via Function.prototype.toString and
// executed inside the headless page via Playwright's page.evaluate. Do not
// reference module-scoped identifiers from the body — every helper must be
// declared inline.

export type ExtractedText = {
  /** Position in inches (slide is 20"×11.25"). */
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  fontFamily: string;
  fontSizePt: number;
  fontWeight: number;
  italic: boolean;
  /** Hex without leading `#`, e.g. `1a2b3c`. */
  color: string;
  align: 'left' | 'center' | 'right';
};

export function extractSafeTexts(rootSelector: string): ExtractedText[] {
  const root = document.querySelector(rootSelector) as HTMLElement | null;
  if (!root) return [];

  const canvasRect = root.getBoundingClientRect();
  if (canvasRect.width === 0 || canvasRect.height === 0) return [];

  // Slide is 20" × 11.25" (= 1920×1080 px @ 96 DPI). Normalize against the
  // canvas's measured rect so the math stays correct even if `transform: scale`
  // is applied to the slide canvas (e.g. fit-to-container).
  const SLIDE_W_IN = 20;
  const SLIDE_H_IN = 11.25;
  const xScale = SLIDE_W_IN / canvasRect.width;
  const yScale = SLIDE_H_IN / canvasRect.height;
  // Font sizes live in CSS px on the unscaled canvas (1920px wide). Convert
  // to PowerPoint points using the same width ratio: 1920 CSS px → 20" → 1440 pt.
  const ptScale = (SLIDE_W_IN * 72) / 1920;

  const out: ExtractedText[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  function isElement(node: Node | null): node is Element {
    return !!node && node.nodeType === 1;
  }

  const rootParent = root.parentElement;

  function isSafe(start: Element): boolean {
    let cur: Element | null = start;
    while (cur && cur !== rootParent && cur !== document.body) {
      if (cur instanceof SVGElement) return false;
      if (cur.nodeName === 'IFRAME' || cur.nodeName === 'VIDEO') return false;
      if (cur.hasAttribute && cur.hasAttribute('data-pptx-ignore')) return false;
      const cs = getComputedStyle(cur);
      if (cs.filter && cs.filter !== 'none') return false;
      // backdropFilter not in every TS lib; read defensively via getPropertyValue.
      const backdrop = cs.getPropertyValue('backdrop-filter');
      if (backdrop && backdrop !== 'none' && backdrop !== '') return false;
      if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') return false;
      if (cs.opacity && parseFloat(cs.opacity) < 0.999) return false;
      if (cs.transform && cs.transform !== 'none' && cur !== root) return false;
      if (cs.clipPath && cs.clipPath !== 'none') return false;
      const mask = cs.getPropertyValue('mask-image');
      if (mask && mask !== 'none' && mask !== '') return false;
      if (cs.writingMode && cs.writingMode !== 'horizontal-tb') return false;
      if (cs.textShadow && cs.textShadow !== 'none') return false;
      const fillColor = cs.getPropertyValue('-webkit-text-fill-color');
      if (fillColor && fillColor !== '' && fillColor !== cs.color) return false;
      if (cs.visibility === 'hidden' || cs.display === 'none') return false;
      cur = cur.parentElement;
    }

    if (typeof document.getAnimations === 'function') {
      for (const anim of document.getAnimations()) {
        const effect = anim.effect as KeyframeEffect | null;
        if (!effect) continue;
        const target = effect.target as Element | null;
        if (!target || !start.contains(target)) continue;
        const timing = effect.getComputedTiming();
        if (timing.iterations === Infinity) continue;
        if (anim.playState !== 'finished') return false;
      }
    }
    return true;
  }

  function rgbToHex(input: string): string | null {
    const m = input.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/i);
    if (!m) return null;
    const r = Math.round(parseFloat(m[1]));
    const g = Math.round(parseFloat(m[2]));
    const b = Math.round(parseFloat(m[3]));
    const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    if (a < 0.05) return null;
    const hex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
    return `${hex(r)}${hex(g)}${hex(b)}`;
  }

  function alignFromCss(value: string): 'left' | 'center' | 'right' {
    if (value === 'center' || value === 'right' || value === 'left') return value;
    if (value === 'end') return 'right';
    if (value === 'start') return 'left';
    return 'left';
  }

  function applyTextTransform(text: string, transform: string): string {
    switch (transform) {
      case 'uppercase':
        return text.toUpperCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'capitalize':
        return text.replace(/\b\w/g, (c) => c.toUpperCase());
      default:
        return text;
    }
  }

  let node = walker.nextNode();
  while (node) {
    const raw = node.nodeValue ?? '';
    const trimmed = raw.replace(/\s+/g, ' ').trim();
    if (!trimmed) {
      node = walker.nextNode();
      continue;
    }
    const parent = isElement(node.parentNode) ? (node.parentNode as Element) : null;
    if (!parent || !isSafe(parent)) {
      node = walker.nextNode();
      continue;
    }
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      node = walker.nextNode();
      continue;
    }
    const cs = getComputedStyle(parent);
    const color = rgbToHex(cs.color);
    if (!color) {
      node = walker.nextNode();
      continue;
    }
    const fontSizeCssPx = parseFloat(cs.fontSize);
    if (!Number.isFinite(fontSizeCssPx) || fontSizeCssPx <= 0) {
      node = walker.nextNode();
      continue;
    }
    const fontWeight = parseFloat(cs.fontWeight);
    const family = (cs.fontFamily || 'sans-serif')
      .split(',')[0]
      .trim()
      .replace(/^['"]|['"]$/g, '');
    out.push({
      x: roundIn((rect.left - canvasRect.left) * xScale),
      y: roundIn((rect.top - canvasRect.top) * yScale),
      w: roundIn(rect.width * xScale),
      h: roundIn(rect.height * yScale),
      text: applyTextTransform(raw.replace(/\s+/g, ' '), cs.textTransform),
      fontFamily: family,
      fontSizePt: Math.round(fontSizeCssPx * ptScale * 100) / 100,
      fontWeight: Number.isFinite(fontWeight) ? fontWeight : 400,
      italic: cs.fontStyle === 'italic' || cs.fontStyle === 'oblique',
      color,
      align: alignFromCss(cs.textAlign),
    });
    node = walker.nextNode();
  }

  function roundIn(v: number): number {
    return Math.max(0, Math.round(v * 100) / 100);
  }

  return out;
}
