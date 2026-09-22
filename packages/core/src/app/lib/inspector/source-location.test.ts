import { describe, expect, it } from 'vitest';
import {
  countLocInstances,
  formatAgentSnippet,
  formatSourceLocation,
  inspectorStatus,
  summarizeElement,
} from './source-location.ts';

describe('formatSourceLocation', () => {
  it('formats the entry file with a 1-based column', () => {
    expect(formatSourceLocation('intro', { line: 12, column: 4 })).toBe(
      'slides/intro/index.tsx:12:5',
    );
  });

  it('keeps column 0 as column 1', () => {
    expect(formatSourceLocation('intro', { line: 1, column: 0 })).toBe(
      'slides/intro/index.tsx:1:1',
    );
  });

  it('honours a custom slides dir and normalises its separators', () => {
    expect(formatSourceLocation('a', { line: 3, column: 2 }, './decks/')).toBe(
      'decks/a/index.tsx:3:3',
    );
    expect(formatSourceLocation('a', { line: 3, column: 2 }, 'content\\decks')).toBe(
      'content/decks/a/index.tsx:3:3',
    );
  });

  it('resolves dot segments the way current.json does', () => {
    expect(formatSourceLocation('a', { line: 1, column: 0 }, '.')).toBe('a/index.tsx:1:1');
    expect(formatSourceLocation('a', { line: 1, column: 0 }, 'x/../decks')).toBe(
      'decks/a/index.tsx:1:1',
    );
    expect(formatSourceLocation('a', { line: 1, column: 0 }, './/slides')).toBe(
      'slides/a/index.tsx:1:1',
    );
  });
});

describe('summarizeElement', () => {
  it('lowercases the tag and collapses whitespace like current.json', () => {
    expect(summarizeElement({ tagName: 'H1', textContent: '  Hello\n   world \t' })).toEqual({
      tagName: 'h1',
      text: 'Hello world',
    });
  });

  it('caps the text at 120 characters', () => {
    const summary = summarizeElement({ tagName: 'P', textContent: 'x'.repeat(200) });
    expect(summary.text).toHaveLength(120);
  });

  it('treats missing text as empty', () => {
    expect(summarizeElement({ tagName: 'IMG', textContent: null })).toEqual({
      tagName: 'img',
      text: '',
    });
  });
});

describe('formatAgentSnippet', () => {
  it('pairs the location with the element and its text', () => {
    expect(
      formatAgentSnippet('intro', [{ line: 8, column: 6, tagName: 'h1', text: 'Hello world' }]),
    ).toBe('slides/intro/index.tsx:8:7 <h1>Hello world</h1>');
  });

  it('self-closes elements without text', () => {
    expect(formatAgentSnippet('intro', [{ line: 20, column: 0, tagName: 'img', text: '' }])).toBe(
      'slides/intro/index.tsx:20:1 <img />',
    );
  });

  it('writes one line per selected target', () => {
    expect(
      formatAgentSnippet(
        'intro',
        [
          { line: 8, column: 6, tagName: 'h1', text: 'Title' },
          { line: 9, column: 6, tagName: 'p', text: 'Body' },
        ],
        'decks',
      ),
    ).toBe('decks/intro/index.tsx:8:7 <h1>Title</h1>\ndecks/intro/index.tsx:9:7 <p>Body</p>');
  });
});

describe('inspectorStatus', () => {
  it('is empty with nothing selected and no untraced pick', () => {
    expect(inspectorStatus({ selectionCount: 0, untracedTag: null, instances: 0 })).toEqual({
      kind: 'empty',
    });
  });

  it('names the untraced element when the click missed the source', () => {
    expect(inspectorStatus({ selectionCount: 0, untracedTag: 'div', instances: 0 })).toEqual({
      kind: 'untraced',
      tagName: 'div',
    });
  });

  it('prefers a live selection over a stale untraced pick', () => {
    expect(inspectorStatus({ selectionCount: 1, untracedTag: 'div', instances: 1 })).toEqual({
      kind: 'traced',
    });
  });

  it('flags a single target rendered several times', () => {
    expect(inspectorStatus({ selectionCount: 1, untracedTag: null, instances: 3 })).toEqual({
      kind: 'shared',
      instances: 3,
    });
  });

  it('does not flag shared definitions inside a multi-selection', () => {
    expect(inspectorStatus({ selectionCount: 2, untracedTag: null, instances: 3 })).toEqual({
      kind: 'traced',
    });
  });
});

describe('countLocInstances', () => {
  it('queries the exact loc attribute', () => {
    const selectors: string[] = [];
    const root = {
      querySelectorAll: (selector: string) => {
        selectors.push(selector);
        return { length: 2 } as NodeListOf<Element>;
      },
    } as Pick<ParentNode, 'querySelectorAll'>;
    expect(countLocInstances(root, { line: 4, column: 10 })).toBe(2);
    expect(selectors).toEqual(['[data-slide-loc="4:10"]']);
  });

  it('is zero without a root', () => {
    expect(countLocInstances(null, { line: 1, column: 0 })).toBe(0);
  });
});
