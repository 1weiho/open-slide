import { strToU8 } from 'fflate';
import { type Radii, type Rgba, toHex } from './css';
import type {
  Bullet,
  DeckScene,
  Fill,
  Geometry,
  ImageFormat,
  Outline,
  Paragraph,
  PictureNode,
  Rect,
  Run,
  SceneImage,
  SceneNode,
  ShadowEffect,
  ShapeNode,
  SlideScene,
  TextNode,
} from './scene';
import { degrees, percent, px, pxToHundredthsPt, SLIDE_EMU_H, SLIDE_EMU_W } from './units';

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const OD_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const NS_SVG = 'http://schemas.microsoft.com/office/drawing/2016/SVG/main';
const SVG_BLIP_URI = '{96DAC541-7B7A-43D3-8B79-37D633B846F1}';
const CT_PREFIX = 'application/vnd.openxmlformats-officedocument.presentationml';

const CONTENT_TYPES: Record<ImageFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

export const PPTX_MIME = `${CT_PREFIX}.presentation`;

function isXmlChar(code: number): boolean {
  if (code === 0x9 || code === 0xa || code === 0xd) return true;
  return code >= 0x20 && code !== 0xfffe && code !== 0xffff;
}

export function escapeXml(value: string): string {
  let clean = '';
  for (const ch of value) {
    if (isXmlChar(ch.codePointAt(0) ?? 0)) clean += ch;
  }
  return clean
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildPptxFiles(deck: DeckScene): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  const n = deck.slides.length;
  const hasNotes = deck.slides.some((s) => s.notes);
  const imageById = new Map(deck.images.map((img) => [img.id, img]));

  files['[Content_Types].xml'] = strToU8(contentTypesXml(deck, hasNotes));
  files['_rels/.rels'] = strToU8(rootRelsXml());
  files['ppt/presentation.xml'] = strToU8(presentationXml(n, hasNotes));
  files['ppt/_rels/presentation.xml.rels'] = strToU8(presentationRelsXml(n, hasNotes));
  files['ppt/presProps.xml'] = strToU8(presPropsXml());
  files['ppt/theme/theme1.xml'] = strToU8(themeXml());
  files['ppt/slideMasters/slideMaster1.xml'] = strToU8(slideMasterXml());
  files['ppt/slideMasters/_rels/slideMaster1.xml.rels'] = strToU8(slideMasterRelsXml());
  files['ppt/slideLayouts/slideLayout1.xml'] = strToU8(slideLayoutXml());
  files['ppt/slideLayouts/_rels/slideLayout1.xml.rels'] = strToU8(slideLayoutRelsXml());
  if (hasNotes) {
    files['ppt/notesMasters/notesMaster1.xml'] = strToU8(notesMasterXml());
    files['ppt/notesMasters/_rels/notesMaster1.xml.rels'] = strToU8(notesMasterRelsXml());
    files['ppt/theme/theme2.xml'] = strToU8(themeXml());
  }

  for (const image of deck.images) {
    files[`ppt/media/${imageFileName(image)}`] = image.bytes;
    if (image.svg) files[`ppt/media/image${image.id}.svg`] = image.svg;
  }

  deck.slides.forEach((slide, i) => {
    const idx = i + 1;
    const rels = new SlideRels();
    const xml = slideXml(slide, rels, imageById);
    files[`ppt/slides/slide${idx}.xml`] = strToU8(xml);
    files[`ppt/slides/_rels/slide${idx}.xml.rels`] = strToU8(
      slideRelsXml(rels, slide.notes ? idx : null),
    );
    if (slide.notes) {
      files[`ppt/notesSlides/notesSlide${idx}.xml`] = strToU8(notesSlideXml(slide.notes));
      files[`ppt/notesSlides/_rels/notesSlide${idx}.xml.rels`] = strToU8(notesSlideRelsXml(idx));
    }
  });

  return files;
}

export function imageFileName(image: SceneImage): string {
  return `image${image.id}.${image.format}`;
}

class SlideRels {
  readonly entries: { id: string; type: string; target: string }[] = [
    { id: 'rId1', type: `${OD_REL}/slideLayout`, target: '../slideLayouts/slideLayout1.xml' },
  ];
  private readonly byTarget = new Map<string, string>();

  image(target: string): string {
    const existing = this.byTarget.get(target);
    if (existing) return existing;
    const id = `rId${this.entries.length + 1}`;
    this.entries.push({ id, type: `${OD_REL}/image`, target: `../media/${target}` });
    this.byTarget.set(target, id);
    return id;
  }

  notes(idx: number): void {
    this.entries.push({
      id: `rId${this.entries.length + 1}`,
      type: `${OD_REL}/notesSlide`,
      target: `../notesSlides/notesSlide${idx}.xml`,
    });
  }
}

function contentTypesXml(deck: DeckScene, hasNotes: boolean): string {
  const defaults = [
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`,
    `<Default Extension="xml" ContentType="application/xml"/>`,
    ...(['png', 'jpeg', 'gif', 'svg'] as const).map(
      (ext) => `<Default Extension="${ext}" ContentType="${CONTENT_TYPES[ext]}"/>`,
    ),
  ];
  const overrides = [
    override('/ppt/presentation.xml', `${CT_PREFIX}.presentation.main+xml`),
    override('/ppt/presProps.xml', `${CT_PREFIX}.presProps+xml`),
    override('/ppt/slideMasters/slideMaster1.xml', `${CT_PREFIX}.slideMaster+xml`),
    override('/ppt/slideLayouts/slideLayout1.xml', `${CT_PREFIX}.slideLayout+xml`),
    override('/ppt/theme/theme1.xml', 'application/vnd.openxmlformats-officedocument.theme+xml'),
  ];
  if (hasNotes) {
    overrides.push(
      override('/ppt/notesMasters/notesMaster1.xml', `${CT_PREFIX}.notesMaster+xml`),
      override('/ppt/theme/theme2.xml', 'application/vnd.openxmlformats-officedocument.theme+xml'),
    );
  }
  deck.slides.forEach((slide, i) => {
    overrides.push(override(`/ppt/slides/slide${i + 1}.xml`, `${CT_PREFIX}.slide+xml`));
    if (slide.notes) {
      overrides.push(
        override(`/ppt/notesSlides/notesSlide${i + 1}.xml`, `${CT_PREFIX}.notesSlide+xml`),
      );
    }
  });
  return `${XML_DECL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">${defaults.join('')}${overrides.join('')}</Types>`;
}

function override(partName: string, contentType: string): string {
  return `<Override PartName="${partName}" ContentType="${contentType}"/>`;
}

function rootRelsXml(): string {
  return `${XML_DECL}<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OD_REL}/officeDocument" Target="ppt/presentation.xml"/></Relationships>`;
}

function presentationXml(n: number, hasNotes: boolean): string {
  const sldIds = Array.from(
    { length: n },
    (_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 3}"/>`,
  ).join('');
  const notesMaster = hasNotes
    ? `<p:notesMasterIdLst><p:notesMasterId r:id="rId${n + 3}"/></p:notesMasterIdLst>`
    : '';
  return `${XML_DECL}<p:presentation xmlns:a="${NS_A}" xmlns:r="${OD_REL}" xmlns:p="${NS_P}" saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>${notesMaster}<p:sldIdLst>${sldIds}</p:sldIdLst><p:sldSz cx="${SLIDE_EMU_W}" cy="${SLIDE_EMU_H}"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`;
}

function presentationRelsXml(n: number, hasNotes: boolean): string {
  const rels = [
    `<Relationship Id="rId1" Type="${OD_REL}/slideMaster" Target="slideMasters/slideMaster1.xml"/>`,
    `<Relationship Id="rId2" Type="${OD_REL}/presProps" Target="presProps.xml"/>`,
  ];
  for (let i = 0; i < n; i++) {
    rels.push(
      `<Relationship Id="rId${i + 3}" Type="${OD_REL}/slide" Target="slides/slide${i + 1}.xml"/>`,
    );
  }
  if (hasNotes) {
    rels.push(
      `<Relationship Id="rId${n + 3}" Type="${OD_REL}/notesMaster" Target="notesMasters/notesMaster1.xml"/>`,
    );
  }
  return `${XML_DECL}<Relationships xmlns="${REL_NS}">${rels.join('')}</Relationships>`;
}

function presPropsXml(): string {
  return `${XML_DECL}<p:presentationPr xmlns:a="${NS_A}" xmlns:r="${OD_REL}" xmlns:p="${NS_P}"/>`;
}

const EMPTY_GROUP = `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`;
const CLR_MAP = `bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"`;

function slideMasterXml(): string {
  return `${XML_DECL}<p:sldMaster xmlns:a="${NS_A}" xmlns:r="${OD_REL}" xmlns:p="${NS_P}"><p:cSld><p:spTree>${EMPTY_GROUP}</p:spTree></p:cSld><p:clrMap ${CLR_MAP}/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`;
}

function slideMasterRelsXml(): string {
  return `${XML_DECL}<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OD_REL}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="${OD_REL}/theme" Target="../theme/theme1.xml"/></Relationships>`;
}

function slideLayoutXml(): string {
  return `${XML_DECL}<p:sldLayout xmlns:a="${NS_A}" xmlns:r="${OD_REL}" xmlns:p="${NS_P}" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${EMPTY_GROUP}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
}

function slideLayoutRelsXml(): string {
  return `${XML_DECL}<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OD_REL}/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`;
}

function notesMasterXml(): string {
  return `${XML_DECL}<p:notesMaster xmlns:a="${NS_A}" xmlns:r="${OD_REL}" xmlns:p="${NS_P}"><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${EMPTY_GROUP}<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg" idx="2"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="1371600" y="685800"/><a:ext cx="4114800" cy="2314575"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln></p:spPr></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" sz="quarter" idx="3"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="4343400"/><a:ext cx="5486400" cy="4114800"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/><a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp></p:spTree></p:cSld><p:clrMap ${CLR_MAP}/><p:notesStyle><a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr></p:notesStyle></p:notesMaster>`;
}

function notesMasterRelsXml(): string {
  return `${XML_DECL}<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OD_REL}/theme" Target="../theme/theme2.xml"/></Relationships>`;
}

function notesSlideXml(notes: string): string {
  const paragraphs = notes
    .split(/\r?\n/)
    .map((line) =>
      line.length === 0
        ? `<a:p><a:endParaRPr lang="en-US"/></a:p>`
        : `<a:p><a:r><a:rPr lang="en-US" dirty="0"/><a:t>${escapeXml(line)}</a:t></a:r></a:p>`,
    )
    .join('');
  return `${XML_DECL}<p:notes xmlns:a="${NS_A}" xmlns:r="${OD_REL}" xmlns:p="${NS_P}"><p:cSld><p:spTree>${EMPTY_GROUP}<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${paragraphs}</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`;
}

function notesSlideRelsXml(idx: number): string {
  return `${XML_DECL}<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OD_REL}/notesMaster" Target="../notesMasters/notesMaster1.xml"/><Relationship Id="rId2" Type="${OD_REL}/slide" Target="../slides/slide${idx}.xml"/></Relationships>`;
}

function slideRelsXml(rels: SlideRels, notesIdx: number | null): string {
  if (notesIdx !== null) rels.notes(notesIdx);
  const body = rels.entries
    .map((r) => `<Relationship Id="${r.id}" Type="${r.type}" Target="${r.target}"/>`)
    .join('');
  return `${XML_DECL}<Relationships xmlns="${REL_NS}">${body}</Relationships>`;
}

export function slideXml(
  slide: SlideScene,
  rels: SlideRels,
  imageById: Map<number, SceneImage>,
): string {
  const ctx: EmitContext = { rels, imageById, nextId: 2 };
  const bg = slide.background
    ? `<p:bg><p:bgPr>${fillXml(slide.background, ctx)}<a:effectLst/></p:bgPr></p:bg>`
    : '';
  const shapes = slide.nodes.map((node) => nodeXml(node, ctx)).join('');
  return `${XML_DECL}<p:sld xmlns:a="${NS_A}" xmlns:r="${OD_REL}" xmlns:p="${NS_P}"><p:cSld>${bg}<p:spTree>${EMPTY_GROUP}${shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

type EmitContext = {
  rels: SlideRels;
  imageById: Map<number, SceneImage>;
  nextId: number;
};

function nodeXml(node: SceneNode, ctx: EmitContext): string {
  switch (node.kind) {
    case 'shape':
      return shapeXml(node, ctx);
    case 'picture':
      return pictureXml(node, ctx);
    case 'text':
      return textXml(node, ctx);
  }
}

function nvPr(id: number, name: string): string {
  return `<p:cNvPr id="${id}" name="${escapeXml(name.slice(0, 200))}"/>`;
}

function shapeXml(node: ShapeNode, ctx: EmitContext): string {
  const id = ctx.nextId++;
  return `<p:sp><p:nvSpPr>${nvPr(id, node.name)}<p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${xfrmXml(node)}${geometryXml(node.geometry, node.box)}${node.fill ? fillXml(node.fill, ctx) : '<a:noFill/>'}${outlineXml(node.outline)}${shadowXml(node.shadow, node.box)}</p:spPr></p:sp>`;
}

function pictureXml(node: PictureNode, ctx: EmitContext): string {
  const id = ctx.nextId++;
  const image = ctx.imageById.get(node.imageId);
  if (!image) return '';
  return `<p:pic><p:nvPicPr>${nvPr(id, node.name)}<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill>${blipXml(image, node.alpha, ctx)}${cropXml(node.crop)}<a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${xfrmXml(node)}${geometryXml(node.geometry, node.box)}${outlineXml(node.outline)}${shadowXml(node.shadow, node.box)}</p:spPr></p:pic>`;
}

function blipXml(image: SceneImage, alpha: number, ctx: EmitContext): string {
  const rId = ctx.rels.image(imageFileName(image));
  const alphaMod = alpha < 0.999 ? `<a:alphaModFix amt="${percent(alpha)}"/>` : '';
  let ext = '';
  if (image.svg) {
    const svgId = ctx.rels.image(`image${image.id}.svg`);
    ext = `<a:extLst><a:ext uri="${SVG_BLIP_URI}"><asvg:svgBlip xmlns:asvg="${NS_SVG}" r:embed="${svgId}"/></a:ext></a:extLst>`;
  }
  return `<a:blip r:embed="${rId}">${alphaMod}${ext}</a:blip>`;
}

function cropXml(crop: PictureNode['crop']): string {
  if (!crop) return '';
  const v = (n: number) => Math.round(Math.min(0.999, Math.max(0, n)) * 100000);
  if (v(crop.l) === 0 && v(crop.t) === 0 && v(crop.r) === 0 && v(crop.b) === 0) return '';
  return `<a:srcRect l="${v(crop.l)}" t="${v(crop.t)}" r="${v(crop.r)}" b="${v(crop.b)}"/>`;
}

function textXml(node: TextNode, ctx: EmitContext): string {
  const id = ctx.nextId++;
  const paragraphs = node.paragraphs.map(paragraphXml).join('');
  return `<p:sp><p:nvSpPr>${nvPr(id, node.name)}<p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr>${xfrmXml(node)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr><p:txBody><a:bodyPr wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="t"><a:noAutofit/></a:bodyPr><a:lstStyle/>${paragraphs}</p:txBody></p:sp>`;
}

function paragraphXml(p: Paragraph): string {
  const marL = p.marginLeftPx > 0 ? ` marL="${px(p.marginLeftPx)}"` : '';
  const indent = p.indentPx !== 0 ? ` indent="${px(p.indentPx)}"` : '';
  const pPr = `<a:pPr${marL}${indent} algn="${p.align}"><a:lnSpc><a:spcPts val="${pxToHundredthsPt(p.lineSpacingPx)}"/></a:lnSpc><a:spcBef><a:spcPts val="0"/></a:spcBef><a:spcAft><a:spcPts val="0"/></a:spcAft>${bulletXml(p.bullet)}</a:pPr>`;
  const body = p.lines
    .map((line, i) => {
      const runs = line.runs.map(runXml).join('');
      const br =
        i < p.lines.length - 1 ? `<a:br><a:rPr lang="en-US" sz="${sz(line.sizePx)}"/></a:br>` : '';
      return runs + br;
    })
    .join('');
  return `<a:p>${pPr}${body}<a:endParaRPr lang="en-US" sz="${sz(p.endSizePx)}" dirty="0"/></a:p>`;
}

function bulletXml(bullet: Bullet | null): string {
  if (!bullet) return '<a:buNone/>';
  const color = `<a:buClr>${colorXml(bullet.color)}</a:buClr>`;
  if (bullet.kind === 'number') {
    return `${color}<a:buFont typeface="+mj-lt"/><a:buAutoNum type="${bullet.scheme}" startAt="${Math.max(1, bullet.startAt)}"/>`;
  }
  const font = bullet.font ? `<a:buFont typeface="${escapeXml(bullet.font)}"/>` : '';
  return `${color}${font}<a:buChar char="${escapeXml(bullet.char)}"/>`;
}

function sz(sizePx: number): number {
  return Math.max(100, pxToHundredthsPt(sizePx));
}

function runXml(run: Run): string {
  const s = run.style;
  const attrs = [
    'lang="en-US"',
    `sz="${sz(s.sizePx)}"`,
    s.bold ? 'b="1"' : '',
    s.italic ? 'i="1"' : '',
    s.underline ? 'u="sng"' : '',
    s.strike ? 'strike="sngStrike"' : '',
    Math.abs(s.letterSpacingPx) > 0.01 ? `spc="${pxToHundredthsPt(s.letterSpacingPx)}"` : '',
    s.baselineShift === 'super'
      ? 'baseline="30000"'
      : s.baselineShift === 'sub'
        ? 'baseline="-25000"'
        : '',
    'dirty="0"',
  ]
    .filter(Boolean)
    .join(' ');
  const outline = s.outline
    ? `<a:ln w="${px(s.outline.width)}"><a:solidFill>${colorXml(s.outline.color)}</a:solidFill></a:ln>`
    : '';
  const shadow = s.shadow
    ? `<a:effectLst><a:outerShdw blurRad="${px(s.shadow.blur)}" dist="${px(s.shadow.dist)}" dir="${degrees(s.shadow.dirDeg)}" algn="ctr" rotWithShape="0">${colorXml(s.shadow.color)}</a:outerShdw></a:effectLst>`
    : '';
  const font = escapeXml(s.font);
  return `<a:r><a:rPr ${attrs}>${outline}<a:solidFill>${colorXml(s.color)}</a:solidFill>${shadow}<a:latin typeface="${font}"/><a:ea typeface="${font}"/><a:cs typeface="${font}"/></a:rPr><a:t>${escapeXml(run.text)}</a:t></a:r>`;
}

function xfrmXml(node: { box: Rect; rotationDeg: number; flipV: boolean }): string {
  const rot = Math.abs(node.rotationDeg) > 1e-4 ? ` rot="${degrees(node.rotationDeg)}"` : '';
  const flip = node.flipV ? ' flipV="1"' : '';
  return `<a:xfrm${rot}${flip}><a:off x="${px(node.box.x)}" y="${px(node.box.y)}"/><a:ext cx="${Math.max(0, px(node.box.w))}" cy="${Math.max(0, px(node.box.h))}"/></a:xfrm>`;
}

export function geometryXml(geometry: Geometry, box: Rect): string {
  switch (geometry.kind) {
    case 'rect':
      return '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>';
    case 'ellipse':
      return '<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom>';
    case 'roundRect': {
      const side = Math.max(1e-6, Math.min(box.w, box.h));
      const adj = Math.min(50000, Math.round((geometry.radius / side) * 100000));
      return `<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val ${adj}"/></a:avLst></a:prstGeom>`;
    }
    case 'custom':
      return roundedPathXml(geometry.radii, box);
  }
}

function roundedPathXml(radii: Radii, box: Rect): string {
  const w = Math.max(1, px(box.w));
  const h = Math.max(1, px(box.h));
  const [tl, tr, br, bl] = radii.map((c) => ({ x: px(c.x), y: px(c.y) }));
  const arc = (c: { x: number; y: number }, start: number) =>
    c.x > 0 && c.y > 0
      ? `<a:arcTo wR="${c.x}" hR="${c.y}" stAng="${start * 60000}" swAng="5400000"/>`
      : '';
  const ln = (x: number, y: number) => `<a:lnTo><a:pt x="${x}" y="${y}"/></a:lnTo>`;
  const path =
    `<a:moveTo><a:pt x="${tl.x}" y="0"/></a:moveTo>` +
    ln(w - tr.x, 0) +
    arc(tr, 270) +
    ln(w, h - br.y) +
    arc(br, 0) +
    ln(bl.x, h) +
    arc(bl, 90) +
    ln(0, tl.y) +
    arc(tl, 180) +
    '<a:close/>';
  return `<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/><a:pathLst><a:path w="${w}" h="${h}">${path}</a:path></a:pathLst></a:custGeom>`;
}

export function colorXml(color: Rgba): string {
  const alpha = color.a < 0.999 ? `<a:alpha val="${percent(color.a)}"/>` : '';
  return `<a:srgbClr val="${toHex(color)}">${alpha}</a:srgbClr>`;
}

function fillXml(fill: Fill, ctx: EmitContext): string {
  switch (fill.kind) {
    case 'solid':
      return `<a:solidFill>${colorXml(fill.color)}</a:solidFill>`;
    case 'gradient': {
      const stops = fill.stops
        .map((s) => `<a:gs pos="${percent(s.pos)}">${colorXml(s.color)}</a:gs>`)
        .join('');
      const ang = degrees(fill.angleDeg - 90);
      return `<a:gradFill rotWithShape="1"><a:gsLst>${stops}</a:gsLst><a:lin ang="${ang}" scaled="0"/></a:gradFill>`;
    }
    case 'image': {
      const image = ctx.imageById.get(fill.imageId);
      if (!image) return '<a:noFill/>';
      return `<a:blipFill dpi="0" rotWithShape="1">${blipXml(image, fill.alpha, ctx)}${cropXml(fill.crop)}<a:stretch><a:fillRect/></a:stretch></a:blipFill>`;
    }
  }
}

function outlineXml(outline: Outline | null): string {
  if (!outline) return '<a:ln><a:noFill/></a:ln>';
  const dash = outline.dash === 'solid' ? '' : `<a:prstDash val="${outline.dash}"/>`;
  return `<a:ln w="${Math.max(0, px(outline.width))}" cap="flat" cmpd="sng" algn="ctr"><a:solidFill>${colorXml(outline.color)}</a:solidFill>${dash}<a:miter lim="800000"/></a:ln>`;
}

function shadowXml(shadow: ShadowEffect | null, box: Rect): string {
  if (!shadow) return '';
  const color = colorXml(shadow.color);
  if (shadow.inner) {
    return `<a:effectLst><a:innerShdw blurRad="${px(shadow.blur)}" dist="${px(shadow.dist)}" dir="${degrees(shadow.dirDeg)}">${color}</a:innerShdw></a:effectLst>`;
  }
  const sx = box.w > 0 ? Math.round(((box.w + 2 * shadow.spread) / box.w) * 100000) : 100000;
  const sy = box.h > 0 ? Math.round(((box.h + 2 * shadow.spread) / box.h) * 100000) : 100000;
  return `<a:effectLst><a:outerShdw blurRad="${px(shadow.blur)}" dist="${px(shadow.dist)}" dir="${degrees(shadow.dirDeg)}" sx="${Math.max(0, sx)}" sy="${Math.max(0, sy)}" algn="ctr" rotWithShape="0">${color}</a:outerShdw></a:effectLst>`;
}

function themeXml(): string {
  return `${XML_DECL}<a:theme xmlns:a="${NS_A}" name="Office Theme"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:lumMod val="110000"/><a:satMod val="105000"/><a:tint val="67000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="103000"/><a:tint val="73000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="109000"/><a:tint val="81000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:satMod val="103000"/><a:lumMod val="102000"/><a:tint val="94000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:satMod val="110000"/><a:lumMod val="100000"/><a:shade val="100000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="99000"/><a:satMod val="120000"/><a:shade val="78000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/><a:satMod val="170000"/></a:schemeClr></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="93000"/><a:satMod val="150000"/><a:shade val="98000"/><a:lumMod val="102000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:tint val="98000"/><a:satMod val="130000"/><a:shade val="90000"/><a:lumMod val="103000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="63000"/><a:satMod val="120000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;
}
