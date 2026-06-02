import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { designToCssVars } from './design';
import { SlidePageProvider } from './page-context';
import { isFrameAnimationSettled, waitForDataWaitfor, waitForFonts } from './print-ready';
import type { SlideModule } from './sdk';

const SLIDE_W = 1920;
const SLIDE_H = 1080;
// 16:9 widescreen in English Metric Units (914400 EMU per inch → 13.333in × 7.5in).
const EMU_W = 12192000;
const EMU_H = 6858000;
const CAPTURE_PIXEL_RATIO = 2;

const ANIMATION_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 100;

const CAPTURE_CLASS = 'os-pptx-capture';
const CAPTURE_STYLE_ID = 'os-pptx-capture-style';
// Properties intro animations drive from a hidden start state to a visible end
// state. We read them back once settled and pin them inline so the capture clone
// can't re-run the keyframes from their invisible 0% frame (see freezeForCapture).
const FROZEN_PROPS = ['opacity', 'transform', 'filter', 'clip-path'] as const;

export type PptxExportProgress = {
  phase: 'processing' | 'generating' | 'done';
  /** Number of pages captured so far (0..total). */
  current: number;
  total: number;
  /** 0–95 while capturing, 98 while assembling, 100 when done. */
  percent: number;
};

export async function exportSlideAsImagePptx(
  slide: SlideModule,
  slideId: string,
  onProgress?: (progress: PptxExportProgress) => void,
): Promise<void> {
  const pages = slide.default ?? [];
  if (pages.length === 0) return;

  const total = pages.length;
  onProgress?.({ phase: 'processing', current: 0, total, percent: 0 });

  const container = document.createElement('div');
  container.className = CAPTURE_CLASS;
  container.setAttribute('aria-hidden', 'true');
  Object.assign(container.style, {
    position: 'fixed',
    left: '-99999px',
    top: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(container);

  // html-to-image clones each frame and copies its computed style — including the
  // intro animation — into the clone, which then re-runs the keyframes from their
  // hidden 0% frame in the rasterised SVG. Fast-forward every animation to its end
  // frame in the live DOM (a large negative delay lands past a 1ms duration, so
  // even pseudo-elements paint their final state on the first frame).
  const captureStyle = document.createElement('style');
  captureStyle.id = CAPTURE_STYLE_ID;
  captureStyle.textContent = `.${CAPTURE_CLASS} *, .${CAPTURE_CLASS} *::before, .${CAPTURE_CLASS} *::after {
    animation-delay: -1s !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    animation-fill-mode: forwards !important;
    transition: none !important;
  }`;
  document.head.appendChild(captureStyle);

  const designVars = slide.design ? designToCssVars(slide.design) : null;

  const reactRoots: Root[] = [];
  const frames: HTMLElement[] = [];
  for (let i = 0; i < pages.length; i++) {
    const Page = pages[i];
    if (!Page) continue;
    const host = document.createElement('div');
    host.setAttribute('data-osd-canvas', '');
    host.style.width = `${SLIDE_W}px`;
    host.style.height = `${SLIDE_H}px`;
    host.style.overflow = 'hidden';
    host.style.background = '#fff';
    if (designVars) {
      for (const [k, v] of Object.entries(designVars)) host.style.setProperty(k, v);
    }
    container.appendChild(host);
    frames.push(host);
    const r = createRoot(host);
    r.render(
      createElement(SlidePageProvider, { index: i, total: pages.length }, createElement(Page)),
    );
    reactRoots.push(r);
  }
  // Yield once so React commits all pages and intro animations actually start.
  await nextPaint();

  try {
    await waitForFonts();

    const deadline = performance.now() + ANIMATION_TIMEOUT_MS;
    while (performance.now() < deadline) {
      const settled = frames.every((frame) => isFrameAnimationSettled(frame));
      if (settled) break;
      await sleep(POLL_INTERVAL_MS);
    }
    await waitForDataWaitfor(container);

    const { toBlob } = await import('html-to-image');
    const images: Uint8Array[] = [];
    for (let i = 0; i < frames.length; i++) {
      freezeForCapture(frames[i]);
      const blob = await toBlob(frames[i], {
        width: SLIDE_W,
        height: SLIDE_H,
        pixelRatio: CAPTURE_PIXEL_RATIO,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      if (!blob) throw new Error(`failed to capture page ${i + 1}`);
      images.push(new Uint8Array(await blob.arrayBuffer()));
      onProgress?.({
        phase: 'processing',
        current: i + 1,
        total,
        percent: Math.min(95, ((i + 1) / total) * 95),
      });
    }

    onProgress?.({ phase: 'generating', current: total, total, percent: 98 });
    const pptx = await buildImagePptx(images);
    downloadBlob(
      new Blob([pptx as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      }),
      `${slideId}.pptx`,
    );
  } finally {
    onProgress?.({ phase: 'done', current: total, total, percent: 100 });
    for (const r of reactRoots) r.unmount();
    container.remove();
    captureStyle.remove();
  }
}

// Pin each element's settled visual state inline and remove its animation so the
// clone html-to-image rasterises renders the final frame instead of replaying the
// (initially invisible) keyframes. Pseudo-elements are handled by CAPTURE_STYLE_ID.
function freezeForCapture(root: HTMLElement): void {
  for (const el of root.querySelectorAll<HTMLElement>('*')) {
    const cs = getComputedStyle(el);
    for (const prop of FROZEN_PROPS) {
      el.style.setProperty(prop, cs.getPropertyValue(prop), 'important');
    }
    el.style.setProperty('animation', 'none', 'important');
    el.style.setProperty('transition', 'none', 'important');
  }
}

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const OD_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

async function buildImagePptx(images: Uint8Array[]): Promise<Uint8Array> {
  const { zipSync, strToU8 } = await import('fflate');
  const n = images.length;
  const files: Record<string, Uint8Array> = {};

  files['[Content_Types].xml'] = strToU8(contentTypesXml(n));
  files['_rels/.rels'] = strToU8(rootRelsXml());
  files['ppt/presentation.xml'] = strToU8(presentationXml(n));
  files['ppt/_rels/presentation.xml.rels'] = strToU8(presentationRelsXml(n));
  files['ppt/presProps.xml'] = strToU8(presPropsXml());
  files['ppt/theme/theme1.xml'] = strToU8(themeXml());
  files['ppt/slideMasters/slideMaster1.xml'] = strToU8(slideMasterXml());
  files['ppt/slideMasters/_rels/slideMaster1.xml.rels'] = strToU8(slideMasterRelsXml());
  files['ppt/slideLayouts/slideLayout1.xml'] = strToU8(slideLayoutXml());
  files['ppt/slideLayouts/_rels/slideLayout1.xml.rels'] = strToU8(slideLayoutRelsXml());

  for (let i = 0; i < n; i++) {
    const idx = i + 1;
    files[`ppt/slides/slide${idx}.xml`] = strToU8(slideXml());
    files[`ppt/slides/_rels/slide${idx}.xml.rels`] = strToU8(slideRelsXml(idx));
    files[`ppt/media/image${idx}.png`] = images[i];
  }

  return zipSync(files);
}

function contentTypesXml(n: number): string {
  const slideOverrides = Array.from(
    { length: n },
    (_, i) =>
      `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
  ).join('');
  return `${XML_DECL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${slideOverrides}</Types>`;
}

function rootRelsXml(): string {
  return `${XML_DECL}<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OD_REL}/officeDocument" Target="ppt/presentation.xml"/></Relationships>`;
}

function presentationXml(n: number): string {
  const sldIds = Array.from(
    { length: n },
    (_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 3}"/>`,
  ).join('');
  return `${XML_DECL}<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${OD_REL}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${sldIds}</p:sldIdLst><p:sldSz cx="${EMU_W}" cy="${EMU_H}"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`;
}

function presentationRelsXml(n: number): string {
  const rels = [
    `<Relationship Id="rId1" Type="${OD_REL}/slideMaster" Target="slideMasters/slideMaster1.xml"/>`,
    `<Relationship Id="rId2" Type="${OD_REL}/presProps" Target="presProps.xml"/>`,
  ];
  for (let i = 0; i < n; i++) {
    rels.push(
      `<Relationship Id="rId${i + 3}" Type="${OD_REL}/slide" Target="slides/slide${i + 1}.xml"/>`,
    );
  }
  return `${XML_DECL}<Relationships xmlns="${REL_NS}">${rels.join('')}</Relationships>`;
}

function presPropsXml(): string {
  return `${XML_DECL}<p:presentationPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${OD_REL}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>`;
}

function slideMasterXml(): string {
  return `${XML_DECL}<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${OD_REL}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`;
}

function slideMasterRelsXml(): string {
  return `${XML_DECL}<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OD_REL}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="${OD_REL}/theme" Target="../theme/theme1.xml"/></Relationships>`;
}

function slideLayoutXml(): string {
  return `${XML_DECL}<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${OD_REL}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
}

function slideLayoutRelsXml(): string {
  return `${XML_DECL}<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OD_REL}/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`;
}

function slideXml(): string {
  return `${XML_DECL}<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${OD_REL}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:pic><p:nvPicPr><p:cNvPr id="2" name="Slide"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${EMU_W}" cy="${EMU_H}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

function slideRelsXml(idx: number): string {
  return `${XML_DECL}<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${OD_REL}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="${OD_REL}/image" Target="../media/image${idx}.png"/></Relationships>`;
}

function themeXml(): string {
  return `${XML_DECL}<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:lumMod val="110000"/><a:satMod val="105000"/><a:tint val="67000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="103000"/><a:tint val="73000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="109000"/><a:tint val="81000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/><a:satMod val="170000"/></a:schemeClr></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="93000"/><a:satMod val="150000"/><a:shade val="98000"/><a:lumMod val="102000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:tint val="98000"/><a:satMod val="130000"/><a:shade val="90000"/><a:lumMod val="103000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="63000"/><a:satMod val="120000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    requestAnimationFrame(settle);
    setTimeout(settle, 50);
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
