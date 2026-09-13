import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { pickInspectorTarget } from './pick-target.ts';

class FakeText {
  readonly nodeType = 3;
  constructor(readonly textContent: string) {}
}

class FakeHTMLElement {
  parentElement: FakeHTMLElement | null = null;
  childNodes: Array<FakeHTMLElement | FakeText> = [];
  dataset: Record<string, string> = {};
  private root: FakeHTMLElement | null = null;

  constructor(readonly tagName: string) {}

  get textContent(): string {
    return this.childNodes
      .map((n) => (n instanceof FakeText ? n.textContent : n.textContent))
      .join('');
  }

  hasAttribute(name: string): boolean {
    return name === 'data-slide-loc' && this.dataset.slideLoc !== undefined;
  }

  closest(selector: string): FakeHTMLElement | null {
    if (selector !== '[data-inspector-root]') return null;
    return this.root;
  }

  contains(other: FakeHTMLElement): boolean {
    for (let cur: FakeHTMLElement | null = other; cur; cur = cur.parentElement) {
      if (cur === this) return true;
    }
    return false;
  }

  append(...nodes: Array<FakeHTMLElement | FakeText>) {
    for (const n of nodes) {
      if (n instanceof FakeHTMLElement) n.parentElement = this;
      this.childNodes.push(n);
    }
  }

  markRoot() {
    this.root = this;
    const walk = (el: FakeHTMLElement) => {
      el.root = this;
      for (const child of el.childNodes) {
        if (child instanceof FakeHTMLElement) walk(child);
      }
    };
    walk(this);
  }
}

function tagged(tag: string, text: string, loc = '10:4'): FakeHTMLElement {
  const el = new FakeHTMLElement(tag);
  el.dataset.slideLoc = loc;
  el.append(new FakeText(text));
  return el;
}

function untagged(tag: string, ...children: Array<FakeHTMLElement | FakeText>): FakeHTMLElement {
  const el = new FakeHTMLElement(tag);
  el.append(...children);
  return el;
}

beforeAll(() => {
  vi.stubGlobal('HTMLElement', FakeHTMLElement);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('pickInspectorTarget', () => {
  it('keeps a tagged inline under an untagged Agenda-style list item', () => {
    const span = tagged('SPAN', 'What changed?');
    const li = untagged('LI', span);
    const root = untagged('DIV', li);
    root.markRoot();

    expect(pickInspectorTarget(span as unknown as HTMLElement)).toBe(span);
  });

  it('still promotes nested inline marks into a tagged paragraph', () => {
    const strong = untagged('STRONG', new FakeText('bold'));
    const p = untagged('P', new FakeText('a '), strong);
    p.dataset.slideLoc = '12:2';
    const root = untagged('DIV', p);
    root.markRoot();

    expect(pickInspectorTarget(strong as unknown as HTMLElement)).toBe(p);
  });

  it('returns null for a null start element', () => {
    expect(pickInspectorTarget(null)).toBeNull();
  });
});
