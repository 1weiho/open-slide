import { strFromU8, unzipSync } from 'fflate';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildEditablePptx, collectEditableSlide } from './export-pptx-editable';

const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

afterEach(() => {
  vi.unstubAllGlobals();
});

function unzip(bytes: Uint8Array): Record<string, Uint8Array> {
  return unzipSync(bytes);
}

function xml(files: Record<string, Uint8Array>, path: string): string {
  return strFromU8(files[path]);
}

describe('editable PPTX OOXML', () => {
  it('writes text, shape, and image nodes as editable PowerPoint objects', async () => {
    const bytes = await buildEditablePptx([
      {
        background: '#ffffff',
        objects: [
          {
            kind: 'shape',
            x: 80,
            y: 96,
            w: 420,
            h: 150,
            radius: 24,
            fill: '#f8fafc',
            stroke: { color: '#0f172a', width: 4 },
          },
          {
            kind: 'text',
            x: 120,
            y: 132,
            w: 340,
            h: 84,
            fontFamily: 'Arial',
            fontSize: 48,
            color: '#111827',
            align: 'center',
            paragraphs: [
              [
                { text: 'Hello ', bold: true, letterSpacing: 2 },
                { text: 'world', italic: true, color: '#ef4444' },
              ],
            ],
          },
          {
            kind: 'image',
            x: 560,
            y: 150,
            w: 220,
            h: 120,
            alt: 'Logo',
            mime: 'image/png',
            data: pngBytes,
          },
        ],
      },
    ]);

    const files = unzip(bytes);
    const slide = xml(files, 'ppt/slides/slide1.xml');
    const rels = xml(files, 'ppt/slides/_rels/slide1.xml.rels');

    expect(slide).toContain(
      '<p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>',
    );
    expect(slide).toContain('<p:sp>');
    expect(slide).toContain('<a:gd name="adj" fmla="val 16000"/>');
    expect(slide).toContain('name="Text 3"');
    expect(slide).toContain('<a:t>Hello </a:t>');
    expect(slide).toContain('<a:t>world</a:t>');
    expect(slide).toContain('<a:pPr algn="ctr"/>');
    expect(slide).toContain('sz="2400"');
    expect(slide).toContain('spc="100"');
    expect(slide).toContain('b="1"');
    expect(slide).toContain('i="1"');
    expect(slide).toContain('<p:pic>');
    expect(slide).toContain('name="Logo"');
    expect(slide).not.toContain('name="Slide"');
    expect(rels).toContain('Target="../media/image1.png"');
    expect(files['ppt/media/image1.png']).toEqual(pngBytes);
  });

  it('writes linear gradients as vector gradient fills', async () => {
    const bytes = await buildEditablePptx([
      {
        background: '#ffffff',
        objects: [
          {
            kind: 'shape',
            x: 0,
            y: 0,
            w: 1920,
            h: 1080,
            fill: {
              kind: 'linearGradient',
              angle: 90,
              stops: [
                { color: '#ff0000', position: 0 },
                { color: '#0000ff', position: 1 },
              ],
            },
          },
        ],
      },
    ]);

    const slide = xml(unzip(bytes), 'ppt/slides/slide1.xml');

    expect(slide).toContain('<a:gradFill rotWithShape="1">');
    expect(slide).toContain('<a:gs pos="0"><a:srgbClr val="FF0000"/></a:gs>');
    expect(slide).toContain('<a:gs pos="100000"><a:srgbClr val="0000FF"/></a:gs>');
    expect(slide).toContain('<a:lin ang="0" scaled="0"/>');
  });

  it('uses ellipse geometry for square fully-rounded number badges', async () => {
    const bytes = await buildEditablePptx([
      {
        background: '#ffffff',
        objects: [
          {
            kind: 'shape',
            x: 80,
            y: 96,
            w: 41,
            h: 41,
            radius: 999,
            fill: '#0f172a',
          },
          {
            kind: 'shape',
            x: 160,
            y: 96,
            w: 120,
            h: 41,
            radius: 999,
            fill: '#0f172a',
          },
        ],
      },
    ]);

    const slide = xml(unzip(bytes), 'ppt/slides/slide1.xml');

    expect(slide).toContain('<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom>');
    expect(slide).toContain('<a:prstGeom prst="roundRect">');
    expect(slide).toContain('<a:gd name="adj" fmla="val 50000"/>');
  });

  it('maps diagonal CSS linear-gradient directions to PowerPoint angles', async () => {
    const panel = fakeElement('DIV', {
      rect: { left: 40, top: 48, width: 320, height: 180 },
      styles: {
        display: 'block',
        backgroundImage: 'linear-gradient(to bottom right, #ff0000 0%, #0000ff 100%)',
      },
    });
    const frame = fakeElement('DIV', {
      rect: { left: 0, top: 0, width: 1920, height: 1080 },
      children: [panel],
      queryResults: [panel],
      styles: { backgroundColor: '#050505', display: 'block' },
    });
    stubDom();

    const slide = await collectEditableSlide(frame as unknown as HTMLElement);
    const shape = slide.objects.find((object) => object.kind === 'shape');

    expect(shape).toMatchObject({
      kind: 'shape',
      fill: { kind: 'linearGradient', angle: 135 },
    });

    const bytes = await buildEditablePptx([slide]);
    expect(xml(unzip(bytes), 'ppt/slides/slide1.xml')).toContain(
      '<a:lin ang="2700000" scaled="0"/>',
    );
  });

  it('keeps vertical gradient direction and 8px corner radius for planning cards', async () => {
    const slideRoot = fakeElement('SECTION', {
      rect: { left: 0, top: 0, width: 1920, height: 1080 },
      styles: { backgroundColor: '#050505', display: 'block' },
    });
    const panel = fakeElement('DIV', {
      rect: { left: 75, top: 295, width: 510, height: 265 },
      styles: {
        display: 'block',
        backgroundImage:
          'linear-gradient(180deg, rgba(7,35,28,0.72) 0%, rgba(255,255,255,0.025) 100%)',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        borderBottomRightRadius: '8px',
        borderBottomLeftRadius: '8px',
        borderTopWidth: '1px',
        borderRightWidth: '1px',
        borderBottomWidth: '1px',
        borderLeftWidth: '1px',
        borderTopColor: 'rgba(110,231,183,0.34)',
        borderRightColor: 'rgba(110,231,183,0.34)',
        borderBottomColor: 'rgba(110,231,183,0.34)',
        borderLeftColor: 'rgba(110,231,183,0.34)',
      },
    });
    const frame = fakeElement('DIV', {
      rect: { left: 0, top: 0, width: 1920, height: 1080 },
      children: [slideRoot, panel],
      queryResults: [slideRoot, panel],
      styles: { backgroundColor: '#ffffff', display: 'block' },
    });
    stubDom();

    const slide = await collectEditableSlide(frame as unknown as HTMLElement);
    const shape = slide.objects.find(
      (object) => object.kind === 'shape' && object.x === 75 && object.y === 295,
    );

    expect(shape).toMatchObject({
      kind: 'shape',
      radius: 8,
      fill: { kind: 'linearGradient', angle: 180 },
    });

    const slideXml = xml(unzip(await buildEditablePptx([slide])), 'ppt/slides/slide1.xml');
    expect(slideXml).toContain('<a:gd name="adj" fmla="val 3019"/>');
    expect(slideXml).toContain('<a:gs pos="0"><a:srgbClr val="061B16"/></a:gs>');
    expect(slideXml).toContain('<a:gs pos="100000"><a:srgbClr val="0B0B0B"/></a:gs>');
    expect(slideXml).toContain('<a:lin ang="5400000" scaled="0"/>');
    expect(slideXml).toContain('<a:srgbClr val="6EE7B7"><a:alpha val="34000"/></a:srgbClr>');
  });

  it('can disable wrapping for single-line text boxes', async () => {
    const bytes = await buildEditablePptx([
      {
        background: '#ffffff',
        objects: [
          {
            kind: 'text',
            x: 80,
            y: 96,
            w: 180,
            h: 28,
            wrap: false,
            paragraphs: [[{ text: 'open-slide dev' }]],
          },
        ],
      },
    ]);

    const slide = xml(unzip(bytes), 'ppt/slides/slide1.xml');

    expect(slide).toContain('<a:bodyPr wrap="none"');
  });

  it('keeps pre-line text boxes wrappable', async () => {
    const text = fakeTextNode('From AI Coding to AI Engineering');
    const heading = fakeElement('H1', {
      rect: { left: 0, top: 0, width: 900, height: 128 },
      textContent: text.textContent,
      childNodes: [text],
      styles: {
        display: 'block',
        fontSize: '48px',
        lineHeight: '56px',
        whiteSpace: 'pre-line',
      },
    });
    const frame = fakeElement('DIV', {
      rect: { left: 0, top: 0, width: 1920, height: 1080 },
      children: [heading],
      queryResults: [heading],
      styles: { backgroundColor: '#ffffff', display: 'block' },
    });
    stubDom();

    const slide = await collectEditableSlide(frame as unknown as HTMLElement);
    const textObject = slide.objects.find((object) => object.kind === 'text');

    expect(textObject).toMatchObject({ kind: 'text', wrap: true });
  });

  it('uses flex centering for native PowerPoint text boxes', async () => {
    const text = fakeTextNode('Center');
    const badge = fakeElement('DIV', {
      rect: { left: 32, top: 44, width: 180, height: 72 },
      textContent: text.textContent,
      childNodes: [text],
      styles: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        fontSize: '24px',
      },
    });
    const frame = fakeElement('DIV', {
      rect: { left: 0, top: 0, width: 1920, height: 1080 },
      children: [badge],
      queryResults: [badge],
      styles: { backgroundColor: '#ffffff', display: 'block' },
    });
    stubDom();

    const slide = await collectEditableSlide(frame as unknown as HTMLElement);
    const textObject = slide.objects.find((object) => object.kind === 'text');

    expect(textObject).toMatchObject({
      kind: 'text',
      x: 32,
      y: 44,
      w: 180,
      h: 72,
      align: 'center',
      vertical: 'middle',
    });

    const bytes = await buildEditablePptx([slide]);
    const slideXml = xml(unzip(bytes), 'ppt/slides/slide1.xml');
    expect(slideXml).toContain('<a:bodyPr wrap="square" anchor="ctr"');
    expect(slideXml).toContain('<a:pPr algn="ctr"/>');
  });

  it('exports text labels from flex chips that also contain SVG icons', async () => {
    const icon = fakeSvgElement({
      rect: { left: 88, top: 136, width: 20, height: 20 },
      styles: {
        color: '#6EE7B7',
        fill: 'none',
        stroke: '#6EE7B7',
      },
    });
    const label = fakeTextNode('知识库');
    const chip = fakeElement('DIV', {
      rect: { left: 72, top: 112, width: 226, height: 73 },
      textContent: label.textContent,
      children: [icon],
      childNodes: [icon, label],
      queryResults: [icon],
      styles: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        backgroundColor: 'rgba(110, 231, 183, 0.11)',
        color: '#6EE7B7',
        fontSize: '28px',
        fontWeight: '700',
      },
    });
    const frame = fakeElement('DIV', {
      rect: { left: 0, top: 0, width: 1920, height: 1080 },
      children: [chip],
      queryResults: [chip, icon],
      styles: { backgroundColor: '#050505', display: 'block' },
    });
    stubDom();
    vi.stubGlobal(
      'XMLSerializer',
      class FakeXmlSerializer {
        serializeToString(node: FakeSvgElement) {
          return `<svg stroke="${node.getAttribute('stroke')}"></svg>`;
        }
      },
    );

    const slide = await collectEditableSlide(frame as unknown as HTMLElement);

    expect(slide.objects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'shape', x: 72, y: 112, w: 226, h: 73 }),
        expect.objectContaining({ kind: 'image', x: 88, y: 136, w: 20, h: 20 }),
        expect.objectContaining({
          kind: 'text',
          x: 104,
          y: 112,
          w: 194,
          h: 73,
          align: 'center',
          vertical: 'middle',
        }),
      ]),
    );

    const slideXml = xml(unzip(await buildEditablePptx([slide])), 'ppt/slides/slide1.xml');
    expect(slideXml).toContain('<a:t>知识库</a:t>');
    expect(slideXml).toContain('<p:pic>');
  });

  it('keeps SVG plus span rows from exporting the parent as a duplicate text box', async () => {
    const icon = fakeSvgElement({
      rect: { left: 112, top: 142, width: 20, height: 20 },
      styles: {
        color: '#6EE7B7',
        fill: 'none',
        stroke: '#6EE7B7',
      },
    });
    const text = fakeTextNode('直播 / 社交：BIGO LIVE 周报');
    const span = fakeElement('SPAN', {
      rect: { left: 145, top: 136, width: 620, height: 36 },
      textContent: text.textContent,
      childNodes: [text],
      styles: {
        display: 'inline',
        color: '#F7F8F8',
        fontSize: '23px',
      },
    });
    const row = fakeElement('DIV', {
      rect: { left: 112, top: 128, width: 787, height: 56 },
      textContent: text.textContent,
      children: [icon, span],
      childNodes: [icon, span],
      queryResults: [icon, span],
      styles: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '13px',
        fontSize: '23px',
      },
    });
    const frame = fakeElement('DIV', {
      rect: { left: 0, top: 0, width: 1920, height: 1080 },
      children: [row],
      queryResults: [row, icon, span],
      styles: { backgroundColor: '#050505', display: 'block' },
    });
    stubDom();
    vi.stubGlobal(
      'XMLSerializer',
      class FakeXmlSerializer {
        serializeToString(node: FakeSvgElement) {
          return `<svg stroke="${node.getAttribute('stroke')}"></svg>`;
        }
      },
    );

    const slide = await collectEditableSlide(frame as unknown as HTMLElement);
    const textObjects = slide.objects.filter((object) => object.kind === 'text');

    expect(textObjects).toHaveLength(1);
    expect(textObjects[0]).toMatchObject({
      kind: 'text',
      x: 145,
      y: 136,
      w: 620,
      h: 36,
    });
  });

  it('centers text inside rounded single-line chips', async () => {
    const text = fakeTextNode('设计结构化');
    const chip = fakeElement('SPAN', {
      rect: { left: 1127, top: 686, width: 171, height: 31 },
      textContent: text.textContent,
      childNodes: [text],
      styles: {
        display: 'block',
        whiteSpace: 'nowrap',
        fontSize: '15px',
        lineHeight: '15px',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        borderBottomRightRadius: '8px',
        borderBottomLeftRadius: '8px',
        borderTopWidth: '1px',
        borderRightWidth: '1px',
        borderBottomWidth: '1px',
        borderLeftWidth: '1px',
        borderTopColor: 'rgba(110,231,183,0.36)',
        borderRightColor: 'rgba(110,231,183,0.36)',
        borderBottomColor: 'rgba(110,231,183,0.36)',
        borderLeftColor: 'rgba(110,231,183,0.36)',
        backgroundColor: 'rgba(110,231,183,0.08)',
      },
    });
    const frame = fakeElement('DIV', {
      rect: { left: 0, top: 0, width: 1920, height: 1080 },
      children: [chip],
      queryResults: [chip],
      styles: { backgroundColor: '#050505', display: 'block' },
    });
    stubDom();

    const slide = await collectEditableSlide(frame as unknown as HTMLElement);
    const textObject = slide.objects.find((object) => object.kind === 'text');

    expect(textObject).toMatchObject({
      kind: 'text',
      align: 'center',
      vertical: 'middle',
    });

    const slideXml = xml(unzip(await buildEditablePptx([slide])), 'ppt/slides/slide1.xml');
    expect(slideXml).toContain('<a:bodyPr wrap="none" anchor="ctr"');
    expect(slideXml).toContain('<a:pPr algn="ctr"/>');
  });

  it('centers text inside circle-like number badges', async () => {
    const text = fakeTextNode('01');
    const badge = fakeElement('DIV', {
      rect: { left: 91, top: 239, width: 41, height: 41 },
      textContent: text.textContent,
      childNodes: [text],
      styles: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'normal',
        borderTopLeftRadius: '999px',
        borderTopRightRadius: '999px',
        borderBottomRightRadius: '999px',
        borderBottomLeftRadius: '999px',
        backgroundColor: '#0f172a',
      },
    });
    const frame = fakeElement('DIV', {
      rect: { left: 0, top: 0, width: 1920, height: 1080 },
      children: [badge],
      queryResults: [badge],
      styles: { backgroundColor: '#ffffff', display: 'block' },
    });
    stubDom();

    const slide = await collectEditableSlide(frame as unknown as HTMLElement);
    const shape = slide.objects.find((object) => object.kind === 'shape');
    const textObject = slide.objects.find((object) => object.kind === 'text');

    expect(shape).toMatchObject({ kind: 'shape', radius: 999 });
    expect(textObject).toMatchObject({
      kind: 'text',
      align: 'center',
      vertical: 'middle',
    });

    const slideXml = xml(unzip(await buildEditablePptx([slide])), 'ppt/slides/slide1.xml');
    expect(slideXml).toContain('<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom>');
    expect(slideXml).toContain('<a:bodyPr wrap="square" anchor="ctr"');
    expect(slideXml).toContain('<a:pPr algn="ctr"/>');
  });

  it('collects inline SVG roots as vector SVG media', async () => {
    const svg = fakeSvgElement({
      rect: { left: 12, top: 24, width: 96, height: 48 },
      styles: {
        color: 'rgb(110, 231, 183)',
        fill: 'none',
        stroke: 'rgb(110, 231, 183)',
      },
    });
    const frame = fakeElement('DIV', {
      rect: { left: 0, top: 0, width: 1920, height: 1080 },
      children: [svg],
      queryResults: [svg],
      styles: { backgroundColor: '#ffffff', display: 'block' },
    });
    stubDom();
    vi.stubGlobal(
      'XMLSerializer',
      class FakeXmlSerializer {
        serializeToString(node: FakeSvgElement) {
          return `<svg xmlns="${node.getAttribute('xmlns')}" width="${node.getAttribute('width')}" height="${node.getAttribute('height')}" color="${node.getAttribute('color')}"></svg>`;
        }
      },
    );

    const slide = await collectEditableSlide(frame as unknown as HTMLElement);
    const image = slide.objects.find((object) => object.kind === 'image');

    expect(image).toMatchObject({
      kind: 'image',
      mime: 'image/svg+xml',
      x: 12,
      y: 24,
      w: 96,
      h: 48,
    });
    expect(new TextDecoder().decode((image as { data: Uint8Array }).data)).toContain('#6EE7B7');

    const bytes = await buildEditablePptx([slide]);
    const files = unzip(bytes);
    expect(files['ppt/media/image1.svg']).toEqual((image as { data: Uint8Array }).data);
  });

  it('normalizes SVG rgba paint attributes for PowerPoint compatibility', async () => {
    const svg = fakeSvgElement({
      rect: { left: 12, top: 24, width: 96, height: 48 },
      styles: {
        color: 'rgb(110, 231, 183)',
        fill: 'rgba(110, 231, 183, 0.2)',
        stroke: 'rgba(255, 255, 255, 0.34)',
      },
    });
    svg.setAttribute('fill', 'rgba(110, 231, 183, 0.2)');
    svg.setAttribute('stroke', 'rgba(255, 255, 255, 0.34)');
    const frame = fakeElement('DIV', {
      rect: { left: 0, top: 0, width: 1920, height: 1080 },
      children: [svg],
      queryResults: [svg],
      styles: { backgroundColor: '#ffffff', display: 'block' },
    });
    stubDom();
    vi.stubGlobal(
      'XMLSerializer',
      class FakeXmlSerializer {
        serializeToString(node: FakeSvgElement) {
          return `<svg fill="${node.getAttribute('fill')}" fill-opacity="${node.getAttribute('fill-opacity')}" stroke="${node.getAttribute('stroke')}" stroke-opacity="${node.getAttribute('stroke-opacity')}"></svg>`;
        }
      },
    );

    const slide = await collectEditableSlide(frame as unknown as HTMLElement);
    const image = slide.objects.find((object) => object.kind === 'image');
    const svgText = new TextDecoder().decode((image as { data: Uint8Array }).data);

    expect(svgText).toContain('fill="#6EE7B7"');
    expect(svgText).toContain('fill-opacity="0.2"');
    expect(svgText).toContain('stroke="#FFFFFF"');
    expect(svgText).toContain('stroke-opacity="0.34"');
    expect(svgText).not.toContain('rgba(');
  });

  it('removes capture-only SVG style attributes before embedding', async () => {
    const svg = fakeSvgElement({
      rect: { left: 12, top: 24, width: 96, height: 48 },
      styles: {
        color: 'rgb(110, 231, 183)',
        fill: 'none',
        stroke: 'rgb(110, 231, 183)',
      },
    });
    svg.setAttribute(
      'style',
      'opacity: 1 !important; filter: none !important; transition: none !important;',
    );
    svg.setAttribute('data-slide-loc', '1927:4');
    const frame = fakeElement('DIV', {
      rect: { left: 0, top: 0, width: 1920, height: 1080 },
      children: [svg],
      queryResults: [svg],
      styles: { backgroundColor: '#ffffff', display: 'block' },
    });
    stubDom();
    vi.stubGlobal(
      'XMLSerializer',
      class FakeXmlSerializer {
        serializeToString(node: FakeSvgElement) {
          const style = node.getAttribute('style');
          const loc = node.getAttribute('data-slide-loc');
          return `<svg${style ? ` style="${style}"` : ''}${loc ? ` data-slide-loc="${loc}"` : ''} stroke="${node.getAttribute('stroke')}"></svg>`;
        }
      },
    );

    const slide = await collectEditableSlide(frame as unknown as HTMLElement);
    const image = slide.objects.find((object) => object.kind === 'image');
    const svgText = new TextDecoder().decode((image as { data: Uint8Array }).data);

    expect(svgText).not.toContain('!important');
    expect(svgText).not.toContain('style=');
    expect(svgText).not.toContain('data-slide-loc');
    expect(svgText).toContain('stroke="#6EE7B7"');
  });

  it('writes SVG images with a PNG fallback blip for PowerPoint compatibility', async () => {
    const svgBytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>');
    const bytes = await buildEditablePptx([
      {
        background: '#ffffff',
        objects: [
          {
            kind: 'image',
            x: 0,
            y: 0,
            w: 120,
            h: 80,
            mime: 'image/png',
            data: pngBytes,
            svgData: svgBytes,
          },
        ],
      },
    ]);

    const files = unzip(bytes);
    const slide = xml(files, 'ppt/slides/slide1.xml');
    const rels = xml(files, 'ppt/slides/_rels/slide1.xml.rels');

    expect(slide).toContain('<a:blip r:embed="rId2">');
    expect(slide).toContain('<asvg:svgBlip');
    expect(slide).toContain('r:embed="rId3"');
    expect(rels).toContain('Target="../media/image1.png"');
    expect(rels).toContain('Target="../media/image2.svg"');
    expect(files['ppt/media/image1.png']).toEqual(pngBytes);
    expect(files['ppt/media/image2.svg']).toEqual(svgBytes);
  });

  it('writes image source cropping for cover-fitted images', async () => {
    const bytes = await buildEditablePptx([
      {
        background: '#ffffff',
        objects: [
          {
            kind: 'image',
            x: 0,
            y: 0,
            w: 400,
            h: 300,
            mime: 'image/png',
            data: pngBytes,
            crop: { left: 0.125, right: 0.125, top: 0, bottom: 0 },
          },
        ],
      },
    ]);

    const slide = xml(unzip(bytes), 'ppt/slides/slide1.xml');

    expect(slide).toContain('<a:srcRect l="12500" r="12500"/>');
  });

  it('writes an East Asian font fallback for CJK text runs', async () => {
    const bytes = await buildEditablePptx([
      {
        background: '#ffffff',
        objects: [
          {
            kind: 'text',
            x: 80,
            y: 96,
            w: 360,
            h: 80,
            fontFamily: 'Arial',
            paragraphs: [[{ text: '研发效率', fontFamily: 'Arial' }]],
          },
        ],
      },
    ]);

    const slide = xml(unzip(bytes), 'ppt/slides/slide1.xml');

    expect(slide).toContain('<a:latin typeface="Arial"/><a:ea typeface="PingFang SC"/>');
  });

  it('preserves transparent colors, opacity, shadows, and rotation', async () => {
    const bytes = await buildEditablePptx([
      {
        background: '#ffffff',
        objects: [
          {
            kind: 'shape',
            x: 100,
            y: 120,
            w: 320,
            h: 180,
            rotate: 12,
            opacity: 0.5,
            fill: 'rgba(15, 23, 42, 0.6)',
            stroke: { color: 'rgba(110, 231, 255, 0.45)', width: 2 },
            shadow: { color: 'rgba(110, 231, 255, 0.5)', blur: 18, distance: 6, angle: 135 },
          },
          {
            kind: 'text',
            x: 140,
            y: 150,
            w: 240,
            h: 80,
            opacity: 0.75,
            paragraphs: [[{ text: 'Dim text', color: 'rgba(255, 255, 255, 0.8)' }]],
          },
        ],
      },
    ]);

    const slide = xml(unzip(bytes), 'ppt/slides/slide1.xml');

    expect(slide).toContain('<a:xfrm rot="720000">');
    expect(slide).toContain('<a:srgbClr val="0F172A"><a:alpha val="30000"/></a:srgbClr>');
    expect(slide).toContain('<a:srgbClr val="6EE7FF"><a:alpha val="22500"/></a:srgbClr>');
    expect(slide).toContain('<a:outerShdw blurRad="114300" dist="38100" dir="8100000"');
    expect(slide).toContain('<a:srgbClr val="6EE7FF"><a:alpha val="25000"/></a:srgbClr>');
    expect(slide).toContain('<a:srgbClr val="FFFFFF"><a:alpha val="60000"/></a:srgbClr>');
  });

  it('normalizes CSS Color 4 srgb colors from computed styles', async () => {
    const bytes = await buildEditablePptx([
      {
        background: 'color(srgb 0.039216 0.043137 0.058824)',
        objects: [
          {
            kind: 'text',
            x: 60,
            y: 52,
            w: 120,
            h: 40,
            color: 'color(srgb 0.952941 0.94902 0.92549)',
            paragraphs: [[{ text: 'Tone' }]],
          },
        ],
      },
    ]);

    const slide = xml(unzip(bytes), 'ppt/slides/slide1.xml');

    expect(slide).toContain('<p:bg><p:bgPr><a:solidFill><a:srgbClr val="0A0B0F"/>');
    expect(slide).toContain('<a:srgbClr val="F3F2EC"/>');
  });

  it('normalizes OKLCH colors from computed styles', async () => {
    const bytes = await buildEditablePptx([
      {
        background: 'oklch(0.66 0.19 28 / 0.5)',
        objects: [
          {
            kind: 'text',
            x: 60,
            y: 52,
            w: 120,
            h: 40,
            color: 'oklch(0.945 0.005 80)',
            paragraphs: [[{ text: 'Tone' }]],
          },
        ],
      },
    ]);

    const slide = xml(unzip(bytes), 'ppt/slides/slide1.xml');

    expect(slide).toContain('<a:srgbClr val="F0584B"><a:alpha val="50000"/></a:srgbClr>');
    expect(slide).toContain('<a:srgbClr val="EEECE9"/>');
  });

  it('writes tables as native PowerPoint table objects', async () => {
    const bytes = await buildEditablePptx([
      {
        background: '#ffffff',
        objects: [
          {
            kind: 'table',
            x: 100,
            y: 120,
            w: 600,
            h: 180,
            rows: [
              [
                { text: 'Name', bold: true, fill: '#e2e8f0' },
                { text: 'Count', bold: true, fill: '#e2e8f0' },
              ],
              [{ text: 'Slides' }, { text: '12' }],
            ],
          },
        ],
      },
    ]);

    const slide = xml(unzip(bytes), 'ppt/slides/slide1.xml');

    expect(slide).toContain('<p:graphicFrame>');
    expect(slide).toContain('<a:tbl>');
    expect(slide).toContain('<a:t>Name</a:t>');
    expect(slide).toContain('<a:t>Count</a:t>');
    expect(slide).toContain('<a:t>Slides</a:t>');
    expect(slide).toContain('<a:solidFill><a:srgbClr val="E2E8F0"/></a:solidFill>');
  });
});

type FakeRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type FakeElementOptions = {
  rect: FakeRect;
  textContent?: string;
  children?: FakeElement[];
  childNodes?: unknown[];
  queryResults?: FakeElement[];
  styles?: Partial<CSSStyleDeclaration>;
};

class FakeElement {
  tagName: string;
  textContent: string;
  children: FakeElement[];
  childNodes: unknown[];
  private rect: FakeRect;
  private queryResults: FakeElement[];
  private styles: Partial<CSSStyleDeclaration>;

  constructor(tagName: string, options: FakeElementOptions) {
    this.tagName = tagName;
    this.textContent = options.textContent ?? '';
    this.children = options.children ?? [];
    this.childNodes = options.childNodes ?? this.children;
    this.rect = options.rect;
    this.queryResults = options.queryResults ?? [];
    this.styles = options.styles ?? {};
  }

  getBoundingClientRect() {
    const { left, top, width, height } = this.rect;
    return {
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
    };
  }

  querySelectorAll() {
    return this.queryResults;
  }

  get styleMap() {
    return this.styles;
  }
}

function fakeElement(tagName: string, options: FakeElementOptions): FakeElement {
  return new FakeElement(tagName, options);
}

class FakeSvgElement extends FakeElement {
  ownerSVGElement: FakeSvgElement | null = null;
  private attrs = new Map<string, string>();

  getAttribute(name: string) {
    return this.attrs.get(name) ?? null;
  }

  setAttribute(name: string, value: string) {
    this.attrs.set(name, value);
  }

  removeAttribute(name: string) {
    this.attrs.delete(name);
  }

  cloneNode() {
    const clone = new FakeSvgElement('svg', {
      rect: { left: 0, top: 0, width: 1, height: 1 },
      styles: this.styleMap,
    });
    clone.attrs = new Map(this.attrs);
    return clone;
  }
}

function fakeSvgElement(options: FakeElementOptions): FakeSvgElement {
  return new FakeSvgElement('svg', options);
}

function fakeTextNode(textContent: string) {
  return { nodeType: 3, textContent };
}

function stubDom(): void {
  function FakeNode() {}
  Object.assign(FakeNode, { TEXT_NODE: 3 });
  vi.stubGlobal('Node', FakeNode);
  vi.stubGlobal('Element', FakeElement);
  vi.stubGlobal('HTMLElement', FakeElement);
  vi.stubGlobal('HTMLImageElement', class FakeImageElement extends FakeElement {});
  vi.stubGlobal('HTMLTableElement', class FakeTableElement extends FakeElement {});
  vi.stubGlobal('HTMLCanvasElement', class FakeCanvasElement extends FakeElement {});
  vi.stubGlobal('SVGElement', FakeSvgElement);
  vi.stubGlobal('HTMLVideoElement', class FakeVideoElement extends FakeElement {});
  vi.stubGlobal('getComputedStyle', (el: FakeElement) =>
    styleDeclaration({
      display: 'block',
      visibility: 'visible',
      opacity: '1',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      backgroundImage: 'none',
      borderTopWidth: '0px',
      borderRightWidth: '0px',
      borderBottomWidth: '0px',
      borderLeftWidth: '0px',
      borderTopColor: 'rgba(0, 0, 0, 0)',
      borderRightColor: 'rgba(0, 0, 0, 0)',
      borderBottomColor: 'rgba(0, 0, 0, 0)',
      borderLeftColor: 'rgba(0, 0, 0, 0)',
      borderTopLeftRadius: '0px',
      borderTopRightRadius: '0px',
      borderBottomRightRadius: '0px',
      borderBottomLeftRadius: '0px',
      boxShadow: 'none',
      textShadow: 'none',
      color: '#000000',
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'normal',
      fontWeight: '400',
      letterSpacing: 'normal',
      lineHeight: 'normal',
      textAlign: 'left',
      textTransform: 'none',
      whiteSpace: 'normal',
      alignItems: 'normal',
      justifyContent: 'normal',
      flexDirection: 'row',
      fill: 'rgb(0, 0, 0)',
      stroke: 'none',
      filter: 'none',
      backdropFilter: 'none',
      clipPath: 'none',
      maskImage: 'none',
      mixBlendMode: 'normal',
      transform: 'none',
      ...el.styleMap,
    }),
  );
}

function styleDeclaration(styles: Record<string, unknown>): CSSStyleDeclaration {
  return new Proxy(styles, {
    get(target, prop) {
      if (prop === 'getPropertyValue') {
        return (name: string) => {
          const value = target[name];
          return typeof value === 'string' ? value : '';
        };
      }
      const value = target[prop as string];
      return typeof value === 'string' ? value : '';
    },
  }) as unknown as CSSStyleDeclaration;
}
