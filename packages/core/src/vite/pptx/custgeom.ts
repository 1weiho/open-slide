// Pure builder: turns a sampled curve (already in slide-canvas px) into the
// OOXML <p:spPr> sub-tree pieces that the postprocess swaps into a placeholder.
//
// All coordinates inside <a:path> are converted to a local 0..100000 box; the
// shape's own <a:xfrm> (emitted by pptxgenjs for the placeholder) carries the
// world-space offset and extent.

export type CustGeomSpec = {
  points: { x: number; y: number }[];
  rect: { x: number; y: number; w: number; h: number };
  closed: boolean;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
  endArrow?: boolean;
};

const PATH_LOCAL_SIZE = 100000;
const EMU_PER_PX = 9525;

function hex(c: string): string {
  const s = c.replace('#', '').trim();
  if (/^[0-9a-fA-F]{6}$/.test(s)) return s.toUpperCase();
  if (/^[0-9a-fA-F]{8}$/.test(s)) return s.slice(0, 6).toUpperCase();
  return '000000';
}

function toLocal(p: { x: number; y: number }, rect: CustGeomSpec['rect']) {
  const lx = rect.w > 0 ? Math.round(((p.x - rect.x) / rect.w) * PATH_LOCAL_SIZE) : 0;
  const ly = rect.h > 0 ? Math.round(((p.y - rect.y) / rect.h) * PATH_LOCAL_SIZE) : 0;
  return { x: lx, y: ly };
}

function ptNode(p: { x: number; y: number }): any {
  return { 'a:pt': [], ':@': { '@_x': String(p.x), '@_y': String(p.y) } };
}

export function buildCustGeomNode(spec: CustGeomSpec): any {
  if (spec.points.length === 0) {
    // Empty path — emit a degenerate moveTo to a single point at origin.
    return {
      'a:custGeom': [
        { 'a:avLst': [] },
        { 'a:gdLst': [] },
        { 'a:ahLst': [] },
        { 'a:cxnLst': [] },
        { 'a:rect': [], ':@': { '@_l': '0', '@_t': '0', '@_r': '0', '@_b': '0' } },
        {
          'a:pathLst': [
            {
              'a:path': [{ 'a:moveTo': [ptNode({ x: 0, y: 0 })] }],
              ':@': { '@_w': String(PATH_LOCAL_SIZE), '@_h': String(PATH_LOCAL_SIZE) },
            },
          ],
        },
      ],
    };
  }

  const local = spec.points.map((p) => toLocal(p, spec.rect));
  const pathKids: any[] = [{ 'a:moveTo': [ptNode(local[0])] }];
  for (let i = 1; i < local.length; i++) {
    pathKids.push({ 'a:lnTo': [ptNode(local[i])] });
  }
  if (spec.closed) pathKids.push({ 'a:close': [] });

  return {
    'a:custGeom': [
      { 'a:avLst': [] },
      { 'a:gdLst': [] },
      { 'a:ahLst': [] },
      { 'a:cxnLst': [] },
      { 'a:rect': [], ':@': { '@_l': '0', '@_t': '0', '@_r': '0', '@_b': '0' } },
      {
        'a:pathLst': [
          {
            'a:path': pathKids,
            ':@': { '@_w': String(PATH_LOCAL_SIZE), '@_h': String(PATH_LOCAL_SIZE) },
          },
        ],
      },
    ],
  };
}

// Arrow-end convention: `<a:tailEnd>` is the END arrow (the one drawn at the
// final path point), `<a:headEnd>` is the BEGIN arrow. This matches what
// pptxgenjs emits for `addShape('line', { line: { endArrowType: 'triangle' } })`
// — see node_modules/pptxgenjs/dist/pptxgen.cjs.js around the
// `slideItemObj.options.line.endArrowType` branch, which writes
// `<a:tailEnd type="...">`. Verified by tracing through that source on
// 2026-05-21. Our IRCurvePath only carries `endArrow` (mirroring the SVG
// `marker-end` semantics + IRShape `endArrow` on linear lines), so emitting
// `<a:tailEnd>` is correct.
//
// Returns `null` when the spec has no stroke — the caller should omit
// `<a:ln>` entirely. PowerPoint treats a missing `<a:ln>` as "no line",
// which is what we want; emitting `<a:ln w="N"><a:noFill/></a:ln>` is
// noise (width is moot when the line is invisible) and the explicit
// `<a:noFill/>` adds nothing PowerPoint doesn't infer from absence.
export function buildLineNode(spec: CustGeomSpec): any | null {
  if (!spec.stroke) return null;
  const lnKids: any[] = [
    { 'a:solidFill': [{ 'a:srgbClr': [], ':@': { '@_val': hex(spec.stroke) } }] },
  ];
  if (spec.dashed) {
    lnKids.push({ 'a:prstDash': [], ':@': { '@_val': 'dash' } });
  }
  if (spec.endArrow) {
    lnKids.push({ 'a:tailEnd': [], ':@': { '@_type': 'triangle' } });
  }
  const widthEmu = Math.max(1, Math.round((spec.strokeWidth || 1) * EMU_PER_PX));
  return { 'a:ln': lnKids, ':@': { '@_w': String(widthEmu) } };
}

export function buildFillNode(spec: CustGeomSpec): any | null {
  if (!spec.fill) return null;
  return { 'a:solidFill': [{ 'a:srgbClr': [], ':@': { '@_val': hex(spec.fill) } }] };
}
