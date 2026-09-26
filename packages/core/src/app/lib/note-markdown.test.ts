import { describe, expect, it } from 'vitest';
import { type NoteInline, parseInline, parseNoteMarkdown } from './note-markdown.ts';

const text = (t: string): NoteInline => ({ type: 'text', text: t });

describe('parseInline', () => {
  it('returns plain text untouched', () => {
    expect(parseInline('just a sentence')).toEqual([text('just a sentence')]);
  });

  it('parses bold', () => {
    expect(parseInline('a **key** point')).toEqual([
      text('a '),
      { type: 'strong', children: [text('key')] },
      text(' point'),
    ]);
  });

  it('parses italic with stars and underscores', () => {
    expect(parseInline('*a* and _b_')).toEqual([
      { type: 'em', children: [text('a')] },
      text(' and '),
      { type: 'em', children: [text('b')] },
    ]);
  });

  it('parses inline code literally', () => {
    expect(parseInline('run `pnpm **dev**`')).toEqual([
      text('run '),
      { type: 'code', text: 'pnpm **dev**' },
    ]);
  });

  it('parses italic nested in bold', () => {
    expect(parseInline('**bold _in_ here**')).toEqual([
      {
        type: 'strong',
        children: [text('bold '), { type: 'em', children: [text('in')] }, text(' here')],
      },
    ]);
  });

  it('leaves snake_case and unpaired markers alone', () => {
    expect(parseInline('use snake_case_names here')).toEqual([text('use snake_case_names here')]);
    expect(parseInline('2 * 3 and a_b')).toEqual([text('2 * 3 and a_b')]);
  });

  it('treats backslash-escaped delimiters as literal text', () => {
    expect(parseInline('\\*not italic\\*')).toEqual([text('*not italic*')]);
    expect(parseInline('\\**emphasis**')).toEqual([
      text('*'),
      { type: 'em', children: [text('emphasis')] },
      text('*'),
    ]);
    expect(parseInline('a \\` b and \\\\ done')).toEqual([text('a ` b and \\ done')]);
  });

  it('keeps the backslash inside code spans', () => {
    expect(parseInline('`a\\*b`')).toEqual([{ type: 'code', text: 'a\\*b' }]);
  });

  it('does not pair emphasis markers padded with spaces', () => {
    expect(parseInline('2 * 3 = 6 and 5 * 4')).toEqual([text('2 * 3 = 6 and 5 * 4')]);
    expect(parseInline('a ** b ** c')).toEqual([text('a ** b ** c')]);
    expect(parseInline('a _ b _ c')).toEqual([text('a _ b _ c')]);
    expect(parseInline('*a* and *no trail *')).toEqual([
      { type: 'em', children: [text('a')] },
      text(' and *no trail *'),
    ]);
  });
});

describe('parseNoteMarkdown', () => {
  it('splits paragraphs on blank lines and keeps line breaks inside one', () => {
    expect(parseNoteMarkdown('one\ntwo\n\nthree')).toEqual([
      { type: 'paragraph', lines: [[text('one')], [text('two')]] },
      { type: 'paragraph', lines: [[text('three')]] },
    ]);
  });

  it('parses headings up to level 3', () => {
    expect(parseNoteMarkdown('# Intro\n#### not a heading')).toEqual([
      { type: 'heading', level: 1, children: [text('Intro')] },
      { type: 'paragraph', lines: [[text('#### not a heading')]] },
    ]);
  });

  it('groups consecutive bullets into one list', () => {
    expect(parseNoteMarkdown('- a\n- **b**\ntail')).toEqual([
      {
        type: 'list',
        ordered: false,
        items: [[text('a')], [{ type: 'strong', children: [text('b')] }]],
      },
      { type: 'paragraph', lines: [[text('tail')]] },
    ]);
  });

  it('parses ordered lists with dot or paren markers', () => {
    expect(parseNoteMarkdown('1. a\n2) b')).toEqual([
      { type: 'list', ordered: true, items: [[text('a')], [text('b')]] },
    ]);
  });

  it('keeps unordered and ordered runs as separate lists', () => {
    expect(parseNoteMarkdown('- a\n1. b')).toEqual([
      { type: 'list', ordered: false, items: [[text('a')]] },
      { type: 'list', ordered: true, items: [[text('b')]] },
    ]);
  });

  it('does not treat a mid-sentence star line as a bullet without a space', () => {
    expect(parseNoteMarkdown('*emphasis line*')).toEqual([
      { type: 'paragraph', lines: [[{ type: 'em', children: [text('emphasis line')] }]] },
    ]);
  });

  it('escapes disable heading and list markers', () => {
    expect(parseNoteMarkdown('\\# not a heading')).toEqual([
      { type: 'paragraph', lines: [[text('# not a heading')]] },
    ]);
    expect(parseNoteMarkdown('\\- not a bullet\n1\\. not a list')).toEqual([
      { type: 'paragraph', lines: [[text('- not a bullet')], [text('1. not a list')]] },
    ]);
  });

  it('does not treat a 4-digit year line as an ordered list', () => {
    expect(parseNoteMarkdown('1995. the year it began')).toEqual([
      { type: 'paragraph', lines: [[text('1995. the year it began')]] },
    ]);
  });

  it('treats a bare # without content as plain text', () => {
    expect(parseNoteMarkdown('# ')).toEqual([{ type: 'paragraph', lines: [[text('#')]] }]);
  });

  it('preserves leading whitespace in paragraph lines', () => {
    expect(parseNoteMarkdown('plan:\n    indented detail')).toEqual([
      { type: 'paragraph', lines: [[text('plan:')], [text('    indented detail')]] },
    ]);
  });

  it('handles empty input', () => {
    expect(parseNoteMarkdown('')).toEqual([]);
    expect(parseNoteMarkdown('\n\n')).toEqual([]);
  });
});
