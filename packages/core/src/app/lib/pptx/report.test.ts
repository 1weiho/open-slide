import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { PptxDeck, PptxRun } from './model';
import { qualityReport } from './report';
import { validateDeck } from './validate';
import { writePptxWithReport } from './write';

const run = (text: string): PptxRun => ({
  text,
  fontFace: 'Arial',
  latinFontFace: 'Arial',
  eastAsianFontFace: 'PingFang TC',
  fontSize: 28,
  color: { color: '000000', opacity: 1 },
  bold: true,
  italic: false,
  underline: true,
  strike: false,
  letterSpacing: 0.5,
  lang: 'zh-Hant',
  link: { url: 'https://example.com' },
});
const deck = (): PptxDeck => ({
  version: 2,
  id: 'report',
  title: 'Report',
  width: 1920,
  height: 1080,
  pages: [
    {
      index: 0,
      id: 'page-1',
      background: { color: 'FFFFFF', opacity: 1 },
      objects: [
        {
          kind: 'shape',
          id: 'glow',
          source: 'card',
          sourceId: 's1',
          order: 0,
          x: 100,
          y: 100,
          w: 200,
          h: 200,
          geometry: 'rect',
          gradient: {
            kind: 'radial',
            stops: [
              { offset: 0, color: { color: 'FF0000', opacity: 1 } },
              { offset: 1, color: { color: '000000', opacity: 0 } },
            ],
          },
        },
        {
          kind: 'text',
          id: 'text',
          source: 'card',
          sourceId: 's1',
          order: 1,
          x: 100,
          y: 100,
          w: 200,
          h: 70,
          paragraphs: [
            {
              runs: [run('中文 ABC\nNext')],
              align: 'left',
              lineHeight: 32,
              spaceBefore: 0,
              spaceAfter: 0,
              list: { kind: 'number', start: 3, level: 0, indent: 20, hanging: 5 },
            },
          ],
        },
      ],
      groups: [{ id: 'card-group', source: 'card', kind: 'source', members: ['glow', 'text'] }],
      diagnostics: [0, 1].map(() => ({
        severity: 'warning',
        code: 'radial-vector-approximation',
        page: 1,
        source: 'card',
        message: 'Bands',
        suggestion: 'Inspect',
      })),
    },
  ],
});

describe('quality report and font contract', () => {
  it('counts writer leaves separately from sources and group containers', async () => {
    const fixture = deck();
    const output = await writePptxWithReport(fixture);
    const report = qualityReport(fixture, output.pages, output.diagnostics);
    const xml = strFromU8(
      unzipSync(new Uint8Array(await output.blob.arrayBuffer()))['ppt/slides/slide1.xml'],
    );
    expect(report.totals.logicalSources).toBe(1);
    expect(report.totals.irLeafObjects).toBe(2);
    expect(report.totals.nativeLeafObjects).toBe((xml.match(/<p:sp>/g) ?? []).length);
    expect(report.totals.writerExtraObjects).toBe(report.totals.nativeLeafObjects - 2);
    expect(report.totals.groupContainers).toBe(1);
    expect(report.totals.sourceImages).toBe(0);
    expect(report.totals.vectorApproximationSources).toBe(1);
    expect(xml).toContain('<a:latin typeface="Arial"/>');
    expect(xml).toContain('<a:ea typeface="PingFang TC"/>');
    expect(xml).toContain('startAt="3"');
    expect(xml).not.toContain('lang="en-US"');
    expect(xml).toMatch(/<a:endParaRPr[^>]*lang="zh-Hant"/);
    expect(xml).toContain('<a:hlinkClick');
  });

  it('rejects missing or inconsistent worker data rather than manufacturing zero counts', () => {
    expect(() => qualityReport(deck(), [], [])).toThrow();
    expect(() =>
      qualityReport(
        deck(),
        [{ index: 0, nativeLeafObjects: -1, writerExtraObjects: -3, groupContainers: 0 }],
        [],
      ),
    ).toThrow();
    expect(() =>
      qualityReport(
        deck(),
        [{ index: 0, nativeLeafObjects: 0, groupContainers: 0, writerExtraObjects: 0 }],
        [],
      ),
    ).toThrow();
  });
  it('rejects unproven, unsafe and mismatched font evidence at the writer boundary', async () => {
    const fixture = deck();
    const text = fixture.pages[0].objects.find((object) => object.kind === 'text');
    if (text?.kind !== 'text') throw new Error('missing text');
    const value = text.paragraphs[0].runs[0];
    value.fontResolutions = [
      {
        requested: ['Unavailable'],
        language: 'zh-Hant',
        resolved: 'Arial',
        script: 'latin',
        coverage: 'supported',
        substituted: true,
        reasons: ['missing-font-or-glyph'],
        layout: { status: 'safe', advanceDeltaPx: 0.1 },
      },
    ];
    expect(validateDeck(fixture).filter((entry) => entry.severity === 'error')).toEqual([]);
    value.fontResolutions[0].coverage = 'unknown';
    await expect(writePptxWithReport(fixture)).rejects.toThrow();
    value.fontResolutions[0].coverage = 'supported';
    value.fontResolutions[0].layout.status = 'unsafe';
    expect(validateDeck(fixture).some((entry) => entry.code === 'unsafe-font-evidence')).toBe(true);
    value.fontResolutions[0].layout.status = 'safe';
    value.fontResolutions[0].resolved = 'Other';
    expect(validateDeck(fixture).some((entry) => entry.code === 'font-evidence-mismatch')).toBe(
      true,
    );
  });

  it('deduplicates a font substitution source across repeated runs', async () => {
    const fixture = deck();
    const text = fixture.pages[0].objects.find((object) => object.kind === 'text');
    if (text?.kind !== 'text') throw new Error('missing text');
    const value = text.paragraphs[0].runs[0];
    value.fontResolutions = [
      {
        source: 'card/span',
        requested: ['Absent'],
        language: 'zh-Hant',
        resolved: 'Arial',
        script: 'latin',
        coverage: 'supported',
        substituted: true,
        reasons: ['missing-font-or-glyph'],
        layout: { status: 'safe', advanceDeltaPx: 0 },
      },
    ];
    text.paragraphs[0].runs.push({ ...value, text: ' repeated' });
    const result = await writePptxWithReport(fixture);
    const report = qualityReport(fixture, result.pages, result.diagnostics);
    expect(report.totals.fontSubstitutionSources).toBe(1);
    expect(report.fonts).toHaveLength(1);
  });
});
