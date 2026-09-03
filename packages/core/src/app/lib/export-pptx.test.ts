import { strToU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { buildImagePptx } from './export-pptx';

const fakePng = strToU8('not-a-real-png');

function unzipText(zip: Uint8Array): Record<string, string> {
  const out: Record<string, string> = {};
  const dec = new TextDecoder();
  for (const [name, bytes] of Object.entries(unzipSync(zip))) {
    out[name] = dec.decode(bytes);
  }
  return out;
}

describe('buildImagePptx', () => {
  it('omits all notes parts when there are no notes', async () => {
    const files = unzipText(await buildImagePptx([fakePng, fakePng]));
    expect(Object.keys(files).some((p) => p.startsWith('ppt/notesSlides/'))).toBe(false);
    expect(files['ppt/notesMasters/notesMaster1.xml']).toBeUndefined();
    expect(files['ppt/presentation.xml']).not.toContain('notesMasterIdLst');
  });

  it('emits a notes slide only for pages that have notes', async () => {
    const files = unzipText(
      await buildImagePptx([fakePng, fakePng, fakePng], ['first note', undefined, 'third note']),
    );

    expect(files['ppt/notesSlides/notesSlide1.xml']).toContain('first note');
    expect(files['ppt/notesSlides/notesSlide2.xml']).toBeUndefined();
    expect(files['ppt/notesSlides/notesSlide3.xml']).toContain('third note');

    // The slide links to its notes slide; one without notes does not.
    expect(files['ppt/slides/_rels/slide1.xml.rels']).toContain('notesSlide1.xml');
    expect(files['ppt/slides/_rels/slide2.xml.rels']).not.toContain('notesSlide');

    // Notes master + theme2 and content-type overrides are wired in.
    expect(files['ppt/notesMasters/notesMaster1.xml']).toContain('notesStyle');
    expect(files['ppt/theme/theme2.xml']).toBeDefined();
    expect(files['ppt/presentation.xml']).toContain('notesMasterIdLst');
    expect(files['[Content_Types].xml']).toContain('/ppt/notesSlides/notesSlide1.xml');
    expect(files['[Content_Types].xml']).toContain('/ppt/notesMasters/notesMaster1.xml');
  });

  it('escapes XML-special characters and splits lines into paragraphs', async () => {
    const files = unzipText(await buildImagePptx([fakePng], ['a < b & c\nsecond line']));
    const xml = files['ppt/notesSlides/notesSlide1.xml'];
    expect(xml).toContain('a &lt; b &amp; c');
    expect(xml).not.toContain('a < b & c');
    expect((xml.match(/<a:p>/g) ?? []).length).toBe(2);
  });

  it('treats whitespace-only notes as empty', async () => {
    const files = unzipText(await buildImagePptx([fakePng], ['   \n  ']));
    expect(files['ppt/notesSlides/notesSlide1.xml']).toBeUndefined();
    expect(files['ppt/presentation.xml']).not.toContain('notesMasterIdLst');
  });
});
