import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NoteMarkdown } from './note-markdown';

const render = (text: string) => renderToStaticMarkup(<NoteMarkdown text={text} />);

describe('NoteMarkdown', () => {
  it('renders inline markdown as semantic elements', () => {
    const html = render('a **bold** and *soft* `cmd`');
    expect(html).toContain('<strong class="font-semibold">bold</strong>');
    expect(html).toContain('<em>soft</em>');
    expect(html).toContain('>cmd</code>');
  });

  it('renders headings demoted to h4–h6', () => {
    const html = render('# One\n## Two\n### Three');
    expect(html).toContain('<h4');
    expect(html).toContain('<h5');
    expect(html).toContain('<h6');
    expect(html).not.toContain('<h1');
  });

  it('renders lists with the right element', () => {
    expect(render('- a\n- b')).toMatch(/<ul[^>]*>.*<li>a<\/li><li>b<\/li>.*<\/ul>/);
    expect(render('1. a\n2. b')).toMatch(/<ol[^>]*>.*<li>a<\/li><li>b<\/li>.*<\/ol>/);
  });

  it('joins paragraph lines with <br/> and splits paragraphs', () => {
    const html = render('one\ntwo\n\nthree');
    expect(html).toMatch(/<p>one<br\/>two<\/p><p>three<\/p>/);
  });

  it('keeps escaped delimiters literal in the output', () => {
    const html = render('\\*keep\\* the stars');
    expect(html).toContain('*keep* the stars');
    expect(html).not.toContain('<em>');
  });

  it('preserves whitespace via a pre-wrap wrapper', () => {
    expect(render('x')).toContain('whitespace-pre-wrap');
  });
});
