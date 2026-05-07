import { strToU8, zipSync } from 'fflate';

export type HexColor = `#${string}` | string;

export type PptxTextElement = {
  type: 'text';
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  fontSize?: number;
  fontFace?: string;
  color?: HexColor;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'mid' | 'bottom';
  fill?: HexColor;
};

export type PptxRectElement = {
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: HexColor;
  color?: HexColor;
  radius?: number;
  line?: HexColor;
  lineWidth?: number;
};

export type PptxLineElement = {
  type: 'line';
  x: number;
  y: number;
  w: number;
  h?: number;
  color?: HexColor;
  width?: number;
};

export type PptxElement = PptxTextElement | PptxRectElement | PptxLineElement;

export type PptxSlide = {
  background?: HexColor;
  elements: PptxElement[];
};

export type PptxDeck = {
  title?: string;
  author?: string;
  subject?: string;
  company?: string;
  slides: PptxSlide[];
};

const SLIDE_WIDTH_EMU = 12_192_000;
const SLIDE_HEIGHT_EMU = 6_858_000;
const PX_TO_EMU = 6_350;

export function pxToEmu(px: number): number {
  return Math.round(px * PX_TO_EMU);
}

export function createPptxBuffer(deck: PptxDeck): Uint8Array {
  if (!Array.isArray(deck.slides) || deck.slides.length === 0) {
    throw new Error('PPTX export requires at least one slide');
  }

  const files: Record<string, Uint8Array> = {};
  const add = (name: string, xml: string) => {
    files[name] = strToU8(xml);
  };

  add('[Content_Types].xml', contentTypesXml(deck.slides.length));
  add('_rels/.rels', packageRelsXml());
  add('docProps/core.xml', corePropsXml(deck));
  add('docProps/app.xml', appPropsXml(deck));
  add('ppt/presentation.xml', presentationXml(deck.slides.length));
  add('ppt/_rels/presentation.xml.rels', presentationRelsXml(deck.slides.length));
  add('ppt/slideMasters/slideMaster1.xml', slideMasterXml());
  add('ppt/slideMasters/_rels/slideMaster1.xml.rels', slideMasterRelsXml());
  add('ppt/slideLayouts/slideLayout1.xml', slideLayoutXml());
  add('ppt/slideLayouts/_rels/slideLayout1.xml.rels', slideLayoutRelsXml());
  add('ppt/theme/theme1.xml', themeXml());

  deck.slides.forEach((slide, i) => {
    const index = i + 1;
    add(`ppt/slides/slide${index}.xml`, slideXml(slide));
    add(`ppt/slides/_rels/slide${index}.xml.rels`, slideRelsXml());
  });

  return zipSync(files, { level: 6 });
}

function slideXml(slide: PptxSlide): string {
  const shapes = slide.elements.map((element, i) => elementXml(element, i + 2)).join('\n');
  return xml(`
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    ${backgroundXml(slide.background)}
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${shapes}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`);
}

function elementXml(element: PptxElement, id: number): string {
  if (element.type === 'text') return textShapeXml(element, id);
  if (element.type === 'rect') return rectShapeXml(element, id);
  return lineShapeXml(element, id);
}

function textShapeXml(element: PptxTextElement, id: number): string {
  const fontSize = Math.round((element.fontSize ?? 28) * 100);
  const color = normalizeColor(element.color ?? '#111827');
  const fontFace = element.fontFace ?? 'Aptos';
  const align = element.align ?? 'left';
  const anchor = element.valign ?? 'top';
  const fill = element.fill ? solidFillXml(element.fill) : '<a:noFill/>';

  return `
<p:sp>
  ${shapeNvXml(id, 'Text')}
  <p:spPr>${xfrmXml(element)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${fill}<a:ln><a:noFill/></a:ln></p:spPr>
  <p:txBody>
    <a:bodyPr wrap="square" anchor="${anchor}"/><a:lstStyle/>
    ${paragraphsXml(element.text, { fontSize, color, fontFace, bold: element.bold, italic: element.italic, align })}
  </p:txBody>
</p:sp>`;
}

function rectShapeXml(element: PptxRectElement, id: number): string {
  const geom = element.radius && element.radius > 0 ? 'roundRect' : 'rect';
  const fill = element.fill ? solidFillXml(element.fill) : '<a:noFill/>';
  const line = element.line
    ? `<a:ln w="${lineWidthToEmu(element.lineWidth ?? 1)}">${solidFillXml(element.line)}<a:prstDash val="solid"/></a:ln>`
    : '<a:ln><a:noFill/></a:ln>';

  return `
<p:sp>
  ${shapeNvXml(id, 'Rectangle')}
  <p:spPr>${xfrmXml(element)}<a:prstGeom prst="${geom}"><a:avLst/></a:prstGeom>${fill}${line}</p:spPr>
  <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
</p:sp>`;
}

function lineShapeXml(element: PptxLineElement, id: number): string {
  const line = `<a:ln w="${lineWidthToEmu(element.width ?? 2)}">${solidFillXml(element.color ?? '#111827')}<a:prstDash val="solid"/></a:ln>`;
  return `
<p:sp>
  ${shapeNvXml(id, 'Line')}
  <p:spPr>${xfrmXml({ ...element, h: element.h ?? 0 })}<a:prstGeom prst="line"><a:avLst/></a:prstGeom>${line}</p:spPr>
  <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
</p:sp>`;
}

function paragraphsXml(
  text: string,
  opts: {
    fontSize: number;
    color: string;
    fontFace: string;
    bold?: boolean;
    italic?: boolean;
    align: string;
  },
): string {
  const lines = text.split(/\r?\n/);
  return lines
    .map(
      (line) => `
    <a:p>
      <a:pPr algn="${opts.align}"/>
      <a:r>
        <a:rPr lang="en-US" sz="${opts.fontSize}"${opts.bold ? ' b="1"' : ''}${opts.italic ? ' i="1"' : ''}>
          <a:solidFill><a:srgbClr val="${opts.color}"/></a:solidFill>
          <a:latin typeface="${escapeXml(opts.fontFace)}"/><a:ea typeface="${escapeXml(opts.fontFace)}"/><a:cs typeface="${escapeXml(opts.fontFace)}"/>
        </a:rPr>
        <a:t>${escapeXml(line)}</a:t>
      </a:r>
    </a:p>`,
    )
    .join('');
}

function xfrmXml(box: { x: number; y: number; w: number; h?: number }): string {
  return `<a:xfrm><a:off x="${pxToEmu(box.x)}" y="${pxToEmu(box.y)}"/><a:ext cx="${pxToEmu(box.w)}" cy="${pxToEmu(box.h ?? 0)}"/></a:xfrm>`;
}

function shapeNvXml(id: number, name: string): string {
  return `<p:nvSpPr><p:cNvPr id="${id}" name="${name} ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>`;
}

function backgroundXml(color?: HexColor): string {
  if (!color) return '';
  return `<p:bg><p:bgPr>${solidFillXml(color)}<a:effectLst/></p:bgPr></p:bg>`;
}

function solidFillXml(color: HexColor): string {
  return `<a:solidFill><a:srgbClr val="${normalizeColor(color)}"/></a:solidFill>`;
}

function normalizeColor(color: HexColor): string {
  return String(color).replace(/^#/, '').toUpperCase();
}

function lineWidthToEmu(points: number): number {
  return Math.round(points * 12_700);
}

function contentTypesXml(slideCount: number): string {
  const slides = Array.from(
    { length: slideCount },
    (_, i) =>
      `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
  ).join('');
  return xml(`
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${slides}
</Types>`);
}

function packageRelsXml(): string {
  return xml(`
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);
}

function presentationXml(slideCount: number): string {
  const slideIds = Array.from(
    { length: slideCount },
    (_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`,
  ).join('');
  return xml(`
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>${slideIds}</p:sldIdLst>
  <p:sldSz cx="${SLIDE_WIDTH_EMU}" cy="${SLIDE_HEIGHT_EMU}" type="wide"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:defaultTextStyle/>
</p:presentation>`);
}

function presentationRelsXml(slideCount: number): string {
  const slides = Array.from(
    { length: slideCount },
    (_, i) =>
      `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`,
  ).join('');
  return xml(`
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  ${slides}
</Relationships>`);
}

function slideRelsXml(): string {
  return xml(
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
  );
}

function slideMasterXml(): string {
  return xml(`
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>`);
}

function slideMasterRelsXml(): string {
  return xml(`
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`);
}

function slideLayoutXml(): string {
  return xml(`
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`);
}

function slideLayoutRelsXml(): string {
  return xml(`
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`);
}

function themeXml(): string {
  return xml(`
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Open Slide">
  <a:themeElements>
    <a:clrScheme name="Open Slide"><a:dk1><a:srgbClr val="111827"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F2937"/></a:dk2><a:lt2><a:srgbClr val="F9FAFB"/></a:lt2><a:accent1><a:srgbClr val="2563EB"/></a:accent1><a:accent2><a:srgbClr val="22C55E"/></a:accent2><a:accent3><a:srgbClr val="F97316"/></a:accent3><a:accent4><a:srgbClr val="A855F7"/></a:accent4><a:accent5><a:srgbClr val="14B8A6"/></a:accent5><a:accent6><a:srgbClr val="EF4444"/></a:accent6><a:hlink><a:srgbClr val="2563EB"/></a:hlink><a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink></a:clrScheme>
    <a:fontScheme name="Open Slide"><a:majorFont><a:latin typeface="Aptos"/><a:ea typeface="Aptos"/><a:cs typeface="Aptos"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/><a:ea typeface="Aptos"/><a:cs typeface="Aptos"/></a:minorFont></a:fontScheme>
    <a:fmtScheme name="Open Slide"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
  </a:themeElements>
</a:theme>`);
}

function corePropsXml(deck: PptxDeck): string {
  const now = new Date().toISOString();
  return xml(`
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(deck.title ?? 'Open Slide export')}</dc:title>
  <dc:creator>${escapeXml(deck.author ?? 'Open Slide')}</dc:creator>
  <dc:subject>${escapeXml(deck.subject ?? '')}</dc:subject>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`);
}

function appPropsXml(deck: PptxDeck): string {
  return xml(`
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Open Slide</Application>
  <PresentationFormat>On-screen Show (16:9)</PresentationFormat>
  <Slides>${deck.slides.length}</Slides>
  <Company>${escapeXml(deck.company ?? '')}</Company>
</Properties>`);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xml(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${body.trim()}`;
}
