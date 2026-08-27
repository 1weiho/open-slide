import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { isTaggedInlineText, pickInspectorTarget } from './pick-target.ts';

class FakeEl {
  tagName: string;
  dataset: { slideLoc?: string };
  parentElement: FakeEl | null = null;
  childNodes: Array<FakeEl | { nodeType: number }> = [];
  textContent: string;
  private inspectorRoot: boolean;

  constructor(opts: {
    tagName: string;
    slideLoc?: string;
    text?: string;
    inspectorRoot?: boolean;
    children?: Array<FakeEl | { nodeType: number; text?: string }>;
  }) {
    this.tagName = opts.tagName;
    this.dataset = opts.slideLoc ? { slideLoc: opts.slideLoc } : {};
    this.inspectorRoot = opts.inspectorRoot ?? false;
    this.textContent = opts.text ?? '';
    if (opts.children) {
      this.childNodes = opts.children.map((child) => {
        if (child instanceof FakeEl) {
          child.parentElement = this;
          return child;
        }
        return { nodeType: child.nodeType };
      });
      if (!opts.text) {
        this.textContent = opts.children
          .map((child) => (child instanceof FakeEl ? child.textContent : (child.text ?? '')))
          .join('');
      }
    }
  }

  closest(selector: string): FakeEl | null {
    if (selector !== '[data-inspector-root]') return null;
    for (let cur: FakeEl | null = this; cur; cur = cur.parentElement) {
      if (cur.inspectorRoot) return cur;
    }
    return null;
  }

  contains(other: FakeEl | null): boolean {
    for (let cur: FakeEl | null = other; cur; cur = cur.parentElement) {
      if (cur === this) return true;
    }
    return false;
  }
}

function textNode(text: string): { nodeType: number; text: string } {
  return { nodeType: 3, text };
}

function asEl(el: FakeEl): HTMLElement {
  return el as unknown as HTMLElement;
}

beforeAll(() => {
  vi.stubGlobal('HTMLElement', FakeEl);
  vi.stubGlobal('Node', { TEXT_NODE: 3 });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('isTaggedInlineText', () => {
  it('keeps a loc-tagged span as the inspector target', () => {
    expect(isTaggedInlineText(asEl(new FakeEl({ tagName: 'SPAN', slideLoc: '12:4' })))).toBe(true);
  });

  it('does not treat an untagged span as a keep', () => {
    expect(isTaggedInlineText(asEl(new FakeEl({ tagName: 'SPAN' })))).toBe(false);
  });

  it('does not treat a tagged block host as inline', () => {
    expect(isTaggedInlineText(asEl(new FakeEl({ tagName: 'LI', slideLoc: '8:2' })))).toBe(false);
    expect(isTaggedInlineText(asEl(new FakeEl({ tagName: 'DIV', slideLoc: '8:2' })))).toBe(false);
  });
});

describe('pickInspectorTarget', () => {
  it('keeps a loc-tagged span inside an untagged list wrapper', () => {
    const span = new FakeEl({
      tagName: 'SPAN',
      slideLoc: '11:6',
      children: [textNode('What changed?')],
    });
    const li = new FakeEl({ tagName: 'LI', children: [span] });
    const ul = new FakeEl({ tagName: 'UL', children: [li] });
    new FakeEl({ tagName: 'MAIN', inspectorRoot: true, children: [ul] });

    expect(pickInspectorTarget(asEl(span))).toBe(span);
  });

  it('still climbs an untagged inline up to its text container', () => {
    const span = new FakeEl({
      tagName: 'SPAN',
      children: [textNode('Editable body copy')],
    });
    const p = new FakeEl({ tagName: 'P', slideLoc: '8:4', children: [span] });
    new FakeEl({ tagName: 'MAIN', inspectorRoot: true, children: [p] });

    expect(pickInspectorTarget(asEl(span))).toBe(p);
  });

  it('does not promote a tagged inline to a tagged wrapper host', () => {
    const span = new FakeEl({
      tagName: 'SPAN',
      slideLoc: '9:8',
      children: [textNode('nested')],
    });
    const host = new FakeEl({ tagName: 'DIV', slideLoc: '4:2', children: [span] });
    new FakeEl({ tagName: 'MAIN', inspectorRoot: true, children: [host] });

    expect(pickInspectorTarget(asEl(span))).toBe(span);
  });
});
