const POWERPOINT_SAFE_FONTS = new Set([
  'Aptos',
  'Arial',
  'Calibri',
  'Cambria',
  'Consolas',
  'Courier New',
  'Georgia',
  'Helvetica',
  'Times New Roman',
  'Verdana',
]);

export type ResolvedPptxFont = {
  fontFace: string;
  warning?: string;
};

export function resolvePptxFontFace(fontFamily: string): ResolvedPptxFont | undefined {
  const families = parseFontFamilies(fontFamily);
  const first = families[0];
  if (!first) {
    return undefined;
  }

  if (POWERPOINT_SAFE_FONTS.has(first)) {
    return { fontFace: first };
  }

  const fallback =
    findFamily(families, ['Times New Roman', 'Georgia']) ??
    (hasGeneric(families, 'serif') ? 'Times New Roman' : undefined) ??
    findFamily(families, ['Aptos', 'Arial', 'Helvetica', 'Verdana']) ??
    (hasGeneric(families, 'sans-serif') ? 'Aptos' : undefined) ??
    findFamily(families, ['Consolas', 'Courier New']) ??
    (hasGeneric(families, 'monospace') || hasGeneric(families, 'ui-monospace')
      ? 'Consolas'
      : undefined);

  if (!fallback) {
    return {
      fontFace: first,
      warning: `Font may not be available in PowerPoint: ${first}`,
    };
  }

  return {
    fontFace: fallback,
    warning: `Font fallback: ${first} -> ${fallback}`,
  };
}

export function parseFontFamilies(fontFamily: string): string[] {
  return fontFamily
    .split(',')
    .map((family) => family.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

function findFamily(families: string[], candidates: string[]): string | undefined {
  return candidates.find((candidate) => families.includes(candidate));
}

function hasGeneric(families: string[], generic: string): boolean {
  return families.some((family) => family.toLowerCase() === generic);
}
