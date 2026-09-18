export type FontRunPatch = { latin?: string; eastAsian?: string; lang: string };
export type FontObjectPatch = { id: string; runs: FontRunPatch[] };

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function fontProperties(properties: string, font: FontRunPatch, tag: 'rPr' | 'endParaRPr'): string {
  if (properties.endsWith('/>')) properties = `${properties.slice(0, -2)}></a:${tag}>`;
  const face = (name: 'latin' | 'ea', value: string | undefined) => {
    if (!value) return;
    const element = `<a:${name} typeface="${escapeXml(value)}"/>`;
    const pattern = new RegExp(`<a:${name}\\b[^>]*\\/>`);
    if (pattern.test(properties)) properties = properties.replace(pattern, () => element);
    else if (name === 'ea' && /<a:latin\b[^>]*\/>/.test(properties))
      properties = properties.replace(/<a:latin\b[^>]*\/>/, (latin) => `${latin}${element}`);
    else
      properties = properties.replace(
        /<a:(?:ea|cs|sym|hlinkClick|hlinkMouseOver|rtl|extLst)\b|<\/a:(?:rPr|endParaRPr)>/,
        (next) => `${element}${next}`,
      );
  };
  face('latin', font.latin);
  face('ea', font.eastAsian);
  properties = properties.replace(/\s(?:altLang|lang)="[^"]*"/g, '');
  if (font.lang !== 'und')
    properties = properties.replace(
      new RegExp(`<a:${tag}\\b`),
      (start) => `${start} lang="${escapeXml(font.lang)}"`,
    );
  return properties;
}

export function patchFonts(xml: string, patches: FontObjectPatch[]): string {
  const byId = new Map(patches.map((patch) => [escapeXml(patch.id), patch]));
  const found = new Set<string>();
  const result = xml.replace(/<p:(sp|graphicFrame)\b[^>]*>[\s\S]*?<\/p:\1>/g, (block) => {
    const id = /<p:cNvPr\b[^>]*\bname="([^"]*)"/.exec(block)?.[1] ?? '';
    const patch = byId.get(id);
    if (!patch) return block;
    found.add(id);
    let index = 0;
    const patched = block.replace(/<a:p\b[^>]*>[\s\S]*?<\/a:p>/g, (paragraph) => {
      let lastFont: FontRunPatch | undefined;
      paragraph = paragraph.replace(/<a:r\b[^>]*>[\s\S]*?<\/a:r>/g, (run) => {
        const font = patch.runs[index++];
        if (!font) throw new Error(`The font mapping for ${patch.id} has extra native runs.`);
        lastFont = font;
        if (!/<a:rPr\b/.test(run))
          throw new Error(`The font mapping for ${patch.id} has no run properties.`);
        return run.replace(/<a:rPr\b[^>]*\/>|<a:rPr\b[^>]*>[\s\S]*?<\/a:rPr>/, (properties) =>
          fontProperties(properties, font, 'rPr'),
        );
      });
      const last = lastFont;
      if (last)
        paragraph = paragraph.replace(
          /<a:endParaRPr\b[^>]*\/>|<a:endParaRPr\b[^>]*>[\s\S]*?<\/a:endParaRPr>/,
          (properties) => fontProperties(properties, last, 'endParaRPr'),
        );
      return paragraph;
    });
    if (index !== patch.runs.length)
      throw new Error(`The font mapping for ${patch.id} lost native runs.`);
    return patched;
  });
  if (found.size !== byId.size)
    throw new Error('The writer could not locate every font-mapped object.');
  return result;
}
