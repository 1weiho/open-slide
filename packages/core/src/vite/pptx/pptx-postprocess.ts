// src/pptx-postprocess.ts
import { readFile, writeFile } from 'node:fs/promises';
import JSZip from 'jszip';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import type { CustGeomSpec } from './custgeom.ts';
import { buildCustGeomNode, buildLineNode, buildFillNode } from './custgeom.ts';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  preserveOrder: true,
  trimValues: false,
  // Without these, fast-xml-parser auto-coerces tag/attribute text:
  // <a:t>0xE6</a:t> would round-trip as <a:t>230</a:t> because
  // "0xE6" parses as a hex number. We need every text node and
  // attribute value preserved verbatim.
  parseTagValue: false,
  parseAttributeValue: false,
});
const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  preserveOrder: true,
  suppressEmptyNode: false,
});

// Each shape's name attribute lives at:
// <p:sp> -> <p:nvSpPr>[0] -> <p:cNvPr>[0]  @_name
function shapeName(node: any): string | undefined {
  const tag = Object.keys(node).find((k) => k.startsWith('p:'));
  if (!tag) return undefined;
  const children = node[tag];
  if (!Array.isArray(children)) return undefined;
  for (const c of children) {
    const k = Object.keys(c)[0];
    if (k === 'p:nvSpPr' || k === 'p:nvPicPr' || k === 'p:nvGrpSpPr') {
      const inner = c[k];
      for (const ic of inner) {
        const ik = Object.keys(ic)[0];
        if (ik === 'p:cNvPr') {
          return ic[':@']?.['@_name'];
        }
      }
    }
  }
  return undefined;
}

// Group key for a shape name like "p5-Box-3/rect" → "p5-Box-3"
function groupKey(name: string | undefined): string | null {
  if (!name) return null;
  const slash = name.lastIndexOf('/');
  if (slash <= 0) return null;
  return name.slice(0, slash);
}

function nextGrpSpId(used: Set<number>): number {
  let n = 1000;
  while (used.has(n)) n++;
  used.add(n);
  return n;
}

function collectUsedIds(spTree: any[], used: Set<number>) {
  for (const node of spTree) {
    const tag = Object.keys(node).find((k) => k.startsWith('p:'));
    if (!tag) continue;
    for (const c of node[tag]) {
      const k = Object.keys(c)[0];
      if (k === 'p:nvSpPr' || k === 'p:nvPicPr' || k === 'p:nvGrpSpPr') {
        for (const ic of c[k]) {
          if (Object.keys(ic)[0] === 'p:cNvPr') {
            const id = ic[':@']?.['@_id'];
            if (id) used.add(Number(id));
          }
        }
      }
    }
  }
}

function unionBbox(rects: Array<{ x: number; y: number; w: number; h: number }>) {
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  const x2 = Math.max(...rects.map((r) => r.x + r.w));
  const y2 = Math.max(...rects.map((r) => r.y + r.h));
  return { x, y, w: x2 - x, h: y2 - y };
}

function shapeBbox(node: any): { x: number; y: number; w: number; h: number } | null {
  const tag = Object.keys(node).find((k) => k.startsWith('p:'));
  if (!tag) return null;
  for (const c of node[tag]) {
    const ck = Object.keys(c)[0];
    if (ck === 'p:spPr' || ck === 'p:grpSpPr') {
      const inner = c[ck];
      for (const ic of inner) {
        if (Object.keys(ic)[0] === 'a:xfrm') {
          const xfrmKids = ic['a:xfrm'];
          let off: any, ext: any;
          for (const x of xfrmKids) {
            const xk = Object.keys(x)[0];
            if (xk === 'a:off') off = x[':@'];
            if (xk === 'a:ext') ext = x[':@'];
          }
          if (off && ext) {
            return {
              x: Number(off['@_x']),
              y: Number(off['@_y']),
              w: Number(ext['@_cx']),
              h: Number(ext['@_cy']),
            };
          }
        }
      }
    }
  }
  return null;
}

function wrapGroup(members: any[], groupId: string, used: Set<number>): any {
  const rects = members.map(shapeBbox).filter((b): b is NonNullable<typeof b> => !!b);
  const bbox = rects.length > 0 ? unionBbox(rects) : { x: 0, y: 0, w: 0, h: 0 };
  const id = nextGrpSpId(used);
  return {
    'p:grpSp': [
      {
        'p:nvGrpSpPr': [
          { 'p:cNvPr': [], ':@': { '@_id': String(id), '@_name': groupId } },
          { 'p:cNvGrpSpPr': [] },
          { 'p:nvPr': [] },
        ],
      },
      {
        'p:grpSpPr': [
          {
            'a:xfrm': [
              { 'a:off': [], ':@': { '@_x': String(bbox.x), '@_y': String(bbox.y) } },
              { 'a:ext': [], ':@': { '@_cx': String(bbox.w), '@_cy': String(bbox.h) } },
              { 'a:chOff': [], ':@': { '@_x': String(bbox.x), '@_y': String(bbox.y) } },
              { 'a:chExt': [], ':@': { '@_cx': String(bbox.w), '@_cy': String(bbox.h) } },
            ],
          },
        ],
      },
      ...members,
    ],
  };
}

function processSpTree(spTreeChildren: any[]): any[] {
  let work = [...spTreeChildren];
  const used = new Set<number>();
  collectUsedIds(work, used);

  let changed = true;
  while (changed) {
    changed = false;
    const byDeepKey = new Map<string, number[]>();
    for (let i = 0; i < work.length; i++) {
      const n = shapeName(work[i]);
      const k = groupKey(n);
      if (!k) continue;
      let arr = byDeepKey.get(k);
      if (!arr) {
        arr = [];
        byDeepKey.set(k, arr);
      }
      arr.push(i);
    }

    let target: { key: string; idxs: number[]; sorted: number[] } | null = null;
    for (const [k, idxs] of byDeepKey) {
      if (idxs.length < 2) continue;
      const sorted = [...idxs].sort((a, b) => a - b);
      const contiguous = sorted.every((v, j) => j === 0 || v === sorted[j - 1] + 1);
      if (!contiguous) {
        // Members are interleaved with non-members, so they can't form one
        // contiguous group. Skip THIS key but keep evaluating the rest — a
        // single non-contiguous key must not abort grouping for the whole
        // slide (the previous `break` left every other group flat too).
        console.warn('[postprocess] non-contiguous group members for', k, '— flat emit retained');
        continue;
      }
      if (!target || k.split('/').length > target.key.split('/').length) {
        target = { key: k, idxs, sorted };
      }
    }
    if (!target) break;
    const sorted = target.sorted;
    const start = sorted[0];
    const end = sorted[sorted.length - 1];
    const members = work.slice(start, end + 1);
    const wrapped = wrapGroup(members, target.key, used);
    work = [...work.slice(0, start), wrapped, ...work.slice(end + 1)];
    changed = true;
  }

  return work;
}

// East Asian typeface override.
//
// pptxgenjs emits `<a:latin typeface="X"/><a:ea typeface="X"/><a:cs typeface="X"/>`
// with the SAME font name in every slot (see pptxgenjs runProps generator).
// When X is a Latin-only family (e.g. "Segoe UI", "JetBrains Mono"),
// PowerPoint hits `<a:ea typeface="Segoe UI"/>` for any CJK glyph and falls
// back via the theme's Hant slot to `新細明體` (MingLiU) — a serifed
// outline font that does NOT match Chromium's rendering (which used the
// deck's stated chain `"PingFang TC", "Noto Sans TC", "Microsoft JhengHei"`
// — none of those exist on Linux, so Chromium uses its own CJK fallback,
// typically Noto Sans CJK, a rounded geometric sans).
//
// The visual delta between MingLiU (PowerPoint fallback) and Noto Sans CJK
// (Chromium fallback) shows up in the diff as red glyph-outline doubling on
// every CJK character — the 9-11% pixel-diff that Plan H2 targets.
//
// Fix: rewrite every `<a:ea typeface="..."/>` to "Microsoft JhengHei", the
// standard Traditional Chinese font shipped with every Windows install with
// CJK language support and the first installed candidate in the corpus
// decks' stated CJK chain. This affects only how CJK glyphs render — Latin
// glyphs still resolve via `<a:latin>` to the original family, so Latin
// appearance is unchanged.
//
// Scope: applies to ALL runs (mono code blocks too) because the EA slot is
// only consulted by PowerPoint when an East Asian glyph is encountered.
// Code blocks remain pure Latin, so the override is inert there.
//
// If a deck someday specifies Japanese or Simplified Chinese, this regex
// would over-eagerly route their EA glyphs to Microsoft JhengHei. That is
// a known limitation tracked for a follow-up — for now JhengHei renders
// JP/SC glyphs reasonably via shared CJK Unified Ideographs.
//
// TODO(plan-H-future): make EA font configurable per deck (TC / SC / JP).
// Hardcoded to TC because the current corpus is Traditional Chinese only.
export const POWERPOINT_TC_FONT = 'Microsoft JhengHei';
// fast-xml-parser's builder emits self-closing source as expanded
// `<a:ea typeface="..." pitchFamily="34" charset="-122"></a:ea>` rather
// than `<a:ea ... />`. Match both forms so the rewrite is robust if the
// builder changes its default emission style.
//
// Attribute-name pattern follows the XML Name production
// (https://www.w3.org/TR/xml/#NT-Name, simplified ASCII subset). It must
// accept namespace-prefixed names like `r:embed` or `x:id` — OOXML uses
// these freely on run-property children. A plain `[a-zA-Z]+` would either
// fail to match the whole element (skipping the rewrite) or truncate
// attributes that appear after `typeface` once a colon-bearing one
// follows.
export function rewriteEastAsianTypeface(xml: string): string {
  return xml.replace(
    /<a:ea\s+typeface="[^"]*"((?:\s+[a-zA-Z:_][a-zA-Z0-9:_.-]*="[^"]*")*)\s*(\/>|><\/a:ea>)/g,
    `<a:ea typeface="${POWERPOINT_TC_FONT}"$1$2`,
  );
}

function rewriteCustGeomShapes(spTree: any[], specs: CustGeomSpec[]): any[] {
  return spTree.map((node) => {
    const name = shapeName(node);
    if (!name?.startsWith('__cust__')) return node;
    const m = name.match(/^__cust__(\d+)__/);
    if (!m) return node;
    const idx = parseInt(m[1], 10);
    const spec = specs[idx];
    if (!spec) return node;
    return rewritePlaceholderShape(node, spec);
  });
}

function rewritePlaceholderShape(node: any, spec: CustGeomSpec): any {
  // The placeholder is <p:sp> with <p:spPr> containing <a:xfrm>, <a:prstGeom prst="rect">.
  // Goal: keep <a:xfrm>, replace <a:prstGeom> with <a:custGeom>, replace
  // <a:solidFill>/<a:noFill> with the spec's fill (if any), replace <a:ln>
  // with the spec's line, and strip the encoded prefix from the name.
  const tag = Object.keys(node).find((k) => k.startsWith('p:'));
  if (!tag) return node;
  const children = node[tag];
  for (const c of children) {
    const k = Object.keys(c)[0];
    if (k === 'p:nvSpPr') {
      // Strip the __cust__N__ prefix so the final shape name is clean.
      for (const ic of c[k]) {
        if (Object.keys(ic)[0] === 'p:cNvPr') {
          const attrs = ic[':@'];
          if (attrs?.['@_name']) {
            attrs['@_name'] = attrs['@_name'].replace(/^__cust__\d+__/, '');
          }
        }
      }
    }
    if (k === 'p:spPr') {
      const spPrKids: any[] = c[k];
      // Keep <a:xfrm>, drop everything else, then append custGeom + fill + line.
      const kept = spPrKids.filter((kid) => Object.keys(kid)[0] === 'a:xfrm');
      kept.push(buildCustGeomNode(spec));
      const fillNode = buildFillNode(spec);
      if (fillNode) kept.push(fillNode);
      else kept.push({ 'a:noFill': [] });
      const lineNode = buildLineNode(spec);
      if (lineNode) kept.push(lineNode);
      c[k] = kept;
    }
  }
  return node;
}

export async function postprocessPptx(
  pptxPath: string,
  customGeomsPerSlide: CustGeomSpec[][] = [],
): Promise<void> {
  const buf = await readFile(pptxPath);
  const zip = await JSZip.loadAsync(buf);
  const slideFiles = Object.keys(zip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p));

  for (const slidePath of slideFiles) {
    const xml = await zip.file(slidePath)!.async('string');
    const tree: any[] = parser.parse(xml);
    const sld = tree.find((n) => 'p:sld' in n);
    if (!sld) continue;
    const sldKids = sld['p:sld'];
    const cSld = sldKids.find((n: any) => 'p:cSld' in n);
    if (!cSld) continue;
    const cSldKids = cSld['p:cSld'];
    const spTreeIdx = cSldKids.findIndex((n: any) => 'p:spTree' in n);
    if (spTreeIdx < 0) continue;
    // Plan J: rewrite custGeom placeholders BEFORE processSpTree so the
    // (now clean-named) curves participate in the same grouping pass as
    // their primitive siblings.
    const slideMatch = slidePath.match(/slide(\d+)\.xml$/);
    const slideNumber = slideMatch ? parseInt(slideMatch[1], 10) : 0;
    const specs = customGeomsPerSlide[slideNumber - 1] || [];
    let spTreeChildren = cSldKids[spTreeIdx]['p:spTree'];
    if (specs.length > 0) {
      spTreeChildren = rewriteCustGeomShapes(spTreeChildren, specs);
    }
    cSldKids[spTreeIdx]['p:spTree'] = processSpTree(spTreeChildren);
    const newXml = rewriteEastAsianTypeface(builder.build(tree));
    zip.file(slidePath, newXml);
  }

  const outBuf = await zip.generateAsync({ type: 'nodebuffer' });
  await writeFile(pptxPath, outBuf);
}
