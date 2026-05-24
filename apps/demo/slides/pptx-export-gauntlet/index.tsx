import {
  PptxBox,
  PptxGroup,
  PptxImage,
  PptxRasterLayer,
  PptxShape,
  PptxText,
  type DesignSystem,
  type Page,
  type SlideMeta,
} from '@open-slide/core';

export const design: DesignSystem = {
  palette: {
    bg: '#fbf6ea',
    text: '#171512',
    accent: '#b9472d',
  },
  fonts: {
    display: 'Georgia, "Times New Roman", serif',
    body: '"Aptos", "Segoe UI", Arial, sans-serif',
  },
  typeScale: {
    hero: 164,
    body: 34,
  },
  radius: 14,
};

const palette = {
  bg: '#fbf6ea',
  paper: '#fffaf0',
  ink: '#171512',
  muted: '#756c5d',
  faint: '#d9cdb8',
  rule: '#211d18',
  accent: '#b9472d',
  blue: '#284b63',
  green: '#436b4f',
  amber: '#c9822b',
  black: '#11100e',
};

const fonts = {
  display: 'var(--osd-font-display)',
  body: 'var(--osd-font-body)',
  mono: '"Cascadia Mono", Consolas, "Courier New", monospace',
};

const textureSvg = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#b9472d"/>
      <stop offset="0.55" stop-color="#284b63"/>
      <stop offset="1" stop-color="#fbf6ea"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="9"/>
      <feColorMatrix type="saturate" values="0"/>
      <feBlend mode="multiply" in2="SourceGraphic"/>
    </filter>
  </defs>
  <rect width="900" height="520" fill="url(#g)"/>
  <circle cx="690" cy="170" r="190" fill="#f4d5aa" opacity="0.68"/>
  <circle cx="180" cy="370" r="150" fill="#11100e" opacity="0.24"/>
  <rect width="900" height="520" filter="url(#grain)" opacity="0.35"/>
</svg>
`)}`;

const fill = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: fonts.body,
} as const;

const Pad = 112;

function GrainLayer() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage:
          'radial-gradient(circle at 20% 15%, rgba(185, 71, 45, 0.07), transparent 28%), radial-gradient(circle at 80% 70%, rgba(40, 75, 99, 0.08), transparent 30%)',
        filter: 'contrast(1.08)',
        mixBlendMode: 'multiply',
        opacity: 0.9,
      }}
    />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <PptxText
      style={{
        fontFamily: fonts.mono,
        fontSize: 22,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--osd-accent)',
      }}
    >
      {children}
    </PptxText>
  );
}

function Footer({ label }: { label: string }) {
  return (
    <PptxGroup
      style={{
        position: 'absolute',
        left: Pad,
        right: Pad,
        bottom: 58,
      }}
    >
      <PptxShape
        shape="line"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: 1,
          borderTop: `1px dashed ${palette.rule}`,
        }}
      />
      <PptxText
        style={{
          paddingTop: 18,
          fontFamily: fonts.mono,
          fontSize: 17,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: palette.muted,
        }}
      >
        PPTX EXPORT GAUNTLET / {label}
      </PptxText>
    </PptxGroup>
  );
}

const TypographyStress: Page = () => (
  <div style={{ ...fill, padding: `${Pad}px ${Pad}px 150px` }}>
    <GrainLayer />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Eyebrow>01 / typography drift</Eyebrow>
      <PptxText
        style={{
          marginTop: 36,
          fontFamily: fonts.display,
          fontSize: 148,
          lineHeight: 0.96,
          letterSpacing: '-0.035em',
          maxWidth: 1180,
          color: palette.ink,
        }}
      >
        Browser lines
        <br />
        must survive.
      </PptxText>

      <PptxShape
        shape="line"
        style={{
          marginTop: 46,
          width: 520,
          height: 1,
          borderTop: `1px solid ${palette.rule}`,
        }}
      />

      <PptxText
        style={{
          marginTop: 38,
          maxWidth: 1290,
          fontFamily: fonts.display,
          fontSize: 40,
          lineHeight: 1.42,
          color: palette.ink,
        }}
      >
        Rich text should keep <em style={{ color: palette.accent }}>accent italic</em>,{' '}
        <strong style={{ color: palette.blue }}>bold blue</strong>, and{' '}
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: '0.78em',
            background: '#efe2ca',
            padding: '2px 10px',
            borderRadius: 5,
          }}
        >
          mono spans
        </span>{' '}
        without flattening the whole paragraph.
      </PptxText>
    </div>
    <Footer label="text, runs, rules" />
  </div>
);

const EquationStress: Page = () => (
  <div style={{ ...fill, padding: `${Pad}px ${Pad}px 150px` }}>
    <GrainLayer />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Eyebrow>02 / equations</Eyebrow>
      <PptxText
        style={{
          marginTop: 28,
          fontFamily: fonts.display,
          fontSize: 92,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          maxWidth: 1180,
        }}
      >
        Editable math, inline and display.
      </PptxText>

      {/* TODO: replace with <PptxEquation latex="\\int_0^1 x^2 dx = 1/3" />. */}
      <PptxBox
        style={{
          marginTop: 58,
          width: 940,
          border: `1px solid ${palette.faint}`,
          borderRadius: 'var(--osd-radius)',
          background: palette.paper,
          padding: '42px 52px',
          boxShadow: '0 20px 60px rgba(33, 29, 24, 0.12)',
        }}
      >
        <PptxText
          style={{
            fontFamily: fonts.display,
            fontSize: 64,
            lineHeight: 1.2,
            color: palette.blue,
          }}
        >
          {'\\int_0^1 x^2 dx = 1/3'}
        </PptxText>
      </PptxBox>

      <PptxText
        style={{
          marginTop: 54,
          maxWidth: 1260,
          fontSize: 34,
          lineHeight: 1.58,
          color: palette.muted,
        }}
      >
        Inline math should not become a screenshot: beta = alpha + 1 appears inside the paragraph
        and should eventually be editable without leaving duplicate background text.
      </PptxText>
    </div>
    <Footer label="display equation, inline equation" />
  </div>
);

const MediaStress: Page = () => (
  <div style={{ ...fill, padding: `${Pad}px ${Pad}px 150px` }}>
    <GrainLayer />
    <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72 }}>
      <div>
        <Eyebrow>03 / media and effects</Eyebrow>
        <PptxText
          style={{
            marginTop: 30,
            fontFamily: fonts.display,
            fontSize: 90,
            lineHeight: 1.04,
            letterSpacing: '-0.025em',
          }}
        >
          Native images,
          <br />
          raster effects.
        </PptxText>
        <PptxText
          style={{
            marginTop: 44,
            fontSize: 31,
            lineHeight: 1.55,
            color: palette.muted,
            maxWidth: 650,
          }}
        >
          The image should preserve cover/crop behavior. The shadowed grain layer should be reported
          as a raster fallback, not silently dropped.
        </PptxText>
      </div>

      <PptxBox
        style={{
          position: 'relative',
          height: 630,
          borderRadius: 22,
          background: palette.black,
          overflow: 'hidden',
          boxShadow: '0 34px 80px rgba(33, 29, 24, 0.28)',
        }}
      >
        <PptxRasterLayer
          dataUrl={textureSvg}
          alt="Abstract gradient texture"
          reason="complex decorative SVG texture"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: 0.92,
          }}
        />
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 760 630"
          style={{
            position: 'absolute',
            inset: 0,
            mixBlendMode: 'screen',
            filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.35))',
          }}
          aria-label="Complex SVG mark"
        >
          <title>Complex SVG mark</title>
          <circle cx="380" cy="315" r="156" fill="none" stroke="#fffaf0" strokeWidth="20" />
          <path d="M230 344 C312 160 448 160 530 344" fill="none" stroke="#b9472d" strokeWidth="26" />
          <path d="M250 390 L510 390" fill="none" stroke="#fffaf0" strokeWidth="14" strokeDasharray="20 18" />
        </svg>
      </PptxBox>
    </div>
    <Footer label="images, SVG, filters" />
  </div>
);

const StructuredStress: Page = () => {
  const rows = [
    ['Native text', 'Expected', palette.green],
    ['Rich text runs', 'Required', palette.blue],
    ['Equation OMML', 'Planned', palette.amber],
    ['Raster effects', 'Reported', palette.accent],
  ];

  return (
    <div style={{ ...fill, padding: `${Pad}px ${Pad}px 150px` }}>
      <GrainLayer />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Eyebrow>04 / structured data</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 70, marginTop: 36 }}>
          {/* TODO: replace with <PptxTable /> once native editable tables land. */}
          <PptxBox
            style={{
              border: `1px solid ${palette.faint}`,
              background: palette.paper,
              borderRadius: 'var(--osd-radius)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 220px 42px',
                background: palette.ink,
                color: palette.paper,
                fontFamily: fonts.mono,
                fontSize: 20,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '22px 28px',
              }}
            >
              <span>Case</span>
              <span>Status</span>
              <span />
            </div>
            {rows.map(([label, status, color]) => (
              <div
                key={label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 220px 42px',
                  alignItems: 'center',
                  padding: '28px',
                  borderTop: `1px solid ${palette.faint}`,
                  fontSize: 28,
                }}
              >
                <PptxText>{label}</PptxText>
                <PptxText style={{ color: palette.muted }}>{status}</PptxText>
                <PptxShape
                  shape="ellipse"
                  style={{ width: 22, height: 22, borderRadius: 999, background: color }}
                />
              </div>
            ))}
          </PptxBox>

          {/* TODO: replace with <PptxChart /> once native editable charts land. */}
          <PptxBox
            style={{
              background: palette.ink,
              color: palette.paper,
              borderRadius: 'var(--osd-radius)',
              padding: 38,
            }}
          >
            <PptxText
              style={{
                fontFamily: fonts.display,
                fontSize: 58,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}
            >
              Editability score
            </PptxText>
            <div style={{ marginTop: 54, display: 'grid', gap: 28 }}>
              {[
                ['Text', 92, palette.green],
                ['Images', 76, palette.blue],
                ['Effects', 38, palette.accent],
                ['Math', 61, palette.amber],
              ].map(([label, value, color]) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 58px', gap: 22, alignItems: 'center' }}>
                  <PptxText style={{ fontSize: 24, color: '#d8cbb7' }}>{label}</PptxText>
                  <PptxBox style={{ height: 24, background: '#332d25', borderRadius: 999 }}>
                    <PptxShape
                      shape="roundRect"
                      style={{
                        height: 24,
                        width: `${value}%`,
                        background: color,
                        borderRadius: 999,
                      }}
                    />
                  </PptxBox>
                  <PptxText style={{ fontFamily: fonts.mono, fontSize: 22 }}>{value}%</PptxText>
                </div>
              ))}
            </div>
          </PptxBox>
        </div>
      </div>
      <Footer label="tables, charts, notes" />
    </div>
  );
};

export const meta: SlideMeta = { title: 'PPTX Export Gauntlet' };

export const notes = [
  'Typography stress page: verify line breaks, font fallback, rich runs, mono spans, and dashed footer rule.',
  'Equation stress page: display and inline math are placeholders until PptxEquation writes native OfficeMath.',
  'Media stress page: verify image cover behavior and raster diagnostics for filters/blend modes.',
  'Structured stress page: table and chart placeholders should become native editable objects in later tasks.',
];

export default [TypographyStress, EquationStress, MediaStress, StructuredStress] satisfies Page[];
