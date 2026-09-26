import type {
  EditablePptxQuality,
  EditablePptxQualityCounts,
  PptxDeck,
  PptxDiagnostic,
  PptxWrittenPage,
} from './model';

export function qualityReport(
  deck: PptxDeck,
  written: PptxWrittenPage[],
  diagnostics: PptxDiagnostic[],
): EditablePptxQuality {
  if (written.length !== deck.pages.length)
    throw new Error('The writer report does not cover every exported page.');
  const fonts: EditablePptxQuality['fonts'] = [];
  const seenFonts = new Set<string>();
  const pages = deck.pages.map((page, position) => {
    const output = written[position];
    if (
      !['index', 'nativeLeafObjects', 'writerExtraObjects', 'groupContainers'].every(
        (key) =>
          Number.isSafeInteger(output[key as keyof PptxWrittenPage]) &&
          output[key as keyof PptxWrittenPage] >= 0,
      ) ||
      output.index !== page.index ||
      output.nativeLeafObjects !== page.objects.length + output.writerExtraObjects
    )
      throw new Error('The native writer counts do not match the extracted objects.');
    const sourceIds = new Map(
      page.objects.map((object) => [object.source, object.sourceId ?? object.source]),
    );
    const approximations = new Set(
      diagnostics
        .filter(
          (entry) =>
            entry.page === page.index + 1 &&
            /(?:vector-approximation|shadow-bands)/.test(entry.code),
        )
        .map((entry) => sourceIds.get(entry.source) ?? entry.source),
    );
    const substitutions = new Set<string>();
    for (const object of page.objects) {
      if (object.kind === 'shape' && object.gradient?.kind === 'radial')
        approximations.add(object.sourceId ?? object.source);
      const runs =
        object.kind === 'text'
          ? object.paragraphs.flatMap((paragraph) => paragraph.runs)
          : object.kind === 'table'
            ? object.rows.flatMap((row) =>
                row.flatMap((cell) => cell.paragraphs.flatMap((paragraph) => paragraph.runs)),
              )
            : [];
      for (const run of runs) {
        for (const resolution of run.fontResolutions ?? []) {
          if (resolution.substituted)
            substitutions.add(resolution.source ?? object.sourceId ?? object.source);
          const entry = {
            ...resolution,
            page: page.index + 1,
            source: resolution.source ?? object.source,
            latinFontFace: run.latinFontFace,
            eastAsianFontFace: run.eastAsianFontFace,
          };
          const key = JSON.stringify(entry);
          if (!seenFonts.has(key)) {
            fonts.push(entry);
            seenFonts.add(key);
          }
        }
      }
    }
    return {
      index: page.index,
      logicalSources: new Set(page.objects.map((object) => object.sourceId ?? object.source)).size,
      irLeafObjects: page.objects.length,
      nativeLeafObjects: output.nativeLeafObjects,
      writerExtraObjects: output.writerExtraObjects,
      groupContainers: output.groupContainers,
      text: page.objects.filter((object) => object.kind === 'text').length,
      tables: page.objects.filter((object) => object.kind === 'table').length,
      shapes:
        page.objects.filter((object) => object.kind === 'shape').length + output.writerExtraObjects,
      sourceImages: page.objects.filter((object) => object.kind === 'image').length,
      vectorApproximationSources: approximations.size,
      skippedGroups: diagnostics.filter(
        (entry) => entry.page === page.index + 1 && entry.code.startsWith('group-skipped-'),
      ).length,
      fontSubstitutionSources: substitutions.size,
    };
  });
  const totals: EditablePptxQualityCounts = {
    logicalSources: 0,
    irLeafObjects: 0,
    nativeLeafObjects: 0,
    writerExtraObjects: 0,
    groupContainers: 0,
    text: 0,
    tables: 0,
    shapes: 0,
    sourceImages: 0,
    vectorApproximationSources: 0,
    skippedGroups: 0,
    fontSubstitutionSources: 0,
  };
  for (const page of pages)
    for (const key of Object.keys(totals) as (keyof EditablePptxQualityCounts)[])
      totals[key] += page[key];
  return { version: 1, pages, totals, fonts, recipientFonts: 'unknown', windows: 'not-verified' };
}
