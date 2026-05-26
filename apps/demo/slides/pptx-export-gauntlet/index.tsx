import {
  type DesignSystem,
  type Page,
  PptxBox,
  PptxEquation,
  PptxGroup,
  PptxRasterLayer,
  PptxShape,
  PptxTable,
  PptxText,
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

const mediaCompositeSvg =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3NjAiIGhlaWdodD0iNjMwIiB2aWV3Qm94PSIwIDAgNzYwIDYzMCI+CiAgPHJlY3Qgd2lkdGg9Ijc2MCIgaGVpZ2h0PSI2MzAiIHJ4PSIyMiIgZmlsbD0iIzExMTAwZSIvPgogIDxjaXJjbGUgY3g9IjM4MCIgY3k9IjMxNSIgcj0iMTU2IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZhZjAiIHN0cm9rZS13aWR0aD0iMjAiLz4KICA8cGF0aCBkPSJNMjMwIDM0NCBDMzEyIDE2MCA0NDggMTYwIDUzMCAzNDQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2I5NDcyZCIgc3Ryb2tlLXdpZHRoPSIyNiIvPgogIDxwYXRoIGQ9Ik0yNTAgMzkwIEw1MTAgMzkwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZhZjAiIHN0cm9rZS13aWR0aD0iMTQiIHN0cm9rZS1kYXNoYXJyYXk9IjIwIDE4Ii8+Cjwvc3ZnPg==';

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
        <PptxEquation
          fallbackText={'\u222B\u2080\u00B9 x\u00B2 dx = 1/3'}
          latex="\\int_0^1 x^2\\,dx = \\frac{1}{3}"
          style={{
            fontFamily: fonts.display,
            fontSize: 64,
            lineHeight: 1.2,
            color: palette.blue,
          }}
        >
          {'\\int_0^1 x^2 dx = 1/3'}
        </PptxEquation>
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
        {
          'Inline math should not become a screenshot: \u03B2 = \u03B1 + 1 appears inside the paragraph and should eventually be editable without leaving duplicate background text.'
        }
      </PptxText>
    </div>
    <Footer label="display equation, inline equation" />
  </div>
);

const MediaStress: Page = () => (
  <div style={{ ...fill, padding: `${Pad}px ${Pad}px 150px` }}>
    <GrainLayer />
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 72,
      }}
    >
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
          dataUrl={mediaCompositeSvg}
          alt="Dark composite SVG mark"
          reason="complex media card flattened to preserve blend and filter effects"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
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
        <div
          style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 70, marginTop: 36 }}
        >
          <PptxTable
            columns={['Case', 'Status']}
            rows={rows.map(([label, status]) => [label, status])}
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: `1px solid ${palette.faint}`,
              background: palette.paper,
              borderRadius: 'var(--osd-radius)',
              overflow: 'hidden',
              fontSize: 26,
            }}
          />

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
                <div
                  key={label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr 58px',
                    gap: 22,
                    alignItems: 'center',
                  }}
                >
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

const StemMathStress: Page = () => (
  <div style={{ ...fill, padding: `${Pad}px ${Pad}px 150px` }}>
    <GrainLayer />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Eyebrow>05 / stem math</Eyebrow>
      <PptxText
        style={{
          marginTop: 28,
          fontFamily: fonts.display,
          fontSize: 80,
          lineHeight: 1.04,
          letterSpacing: '-0.02em',
          maxWidth: 1180,
        }}
      >
        Editable equations for university slides.
      </PptxText>
      <PptxText
        style={{
          marginTop: 28,
          maxWidth: 1280,
          fontSize: 30,
          lineHeight: 1.48,
          color: palette.muted,
        }}
      >
        Inline math should stay selectable in PowerPoint: as{' '}
        <span style={{ color: palette.blue, fontFamily: 'Cambria Math, Georgia, serif' }}>
          {'\u0394x \u2192 0'}
        </span>{' '}
        the derivative{' '}
        <span style={{ color: palette.blue, fontFamily: 'Cambria Math, Georgia, serif' }}>
          {'f\u2032(x)'}
        </span>{' '}
        describes local change in{' '}
        <span style={{ color: palette.blue, fontFamily: 'Cambria Math, Georgia, serif' }}>
          {'\u211D\u207F'}
        </span>
        .
      </PptxText>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.08fr 0.92fr',
          gap: 56,
          marginTop: 42,
        }}
      >
        <PptxBox
          style={{
            background: palette.paper,
            border: `1px solid ${palette.faint}`,
            borderRadius: 'var(--osd-radius)',
            padding: '34px 42px',
          }}
        >
          <PptxText
            style={{
              fontFamily: fonts.display,
              fontSize: 42,
              lineHeight: 1.1,
              color: palette.ink,
            }}
          >
            Step-by-step solution
          </PptxText>
          <div style={{ marginTop: 26, display: 'grid', gap: 18 }}>
            {[
              ['y\\prime - 2y = e^{3x}', "y' - 2y = e^(3x)"],
              ['e^{-2x}y\\prime - 2e^{-2x}y = e^x', "e^(-2x)y' - 2e^(-2x)y = e^x"],
              ['\\left(e^{-2x}y\\right)\\prime = e^x', "(e^(-2x)y)' = e^x"],
              ['y = C e^{2x} + e^{3x}', 'y = C e^(2x) + e^(3x)'],
            ].map(([latex, fallback]) => (
              <PptxEquation
                key={latex}
                fallbackText={fallback}
                latex={latex}
                style={{
                  fontFamily: 'Cambria Math, Georgia, serif',
                  fontSize: 34,
                  lineHeight: 1.25,
                  color: palette.blue,
                }}
              />
            ))}
          </div>
        </PptxBox>

        <div style={{ display: 'grid', gap: 26 }}>
          <PptxBox
            style={{
              background: palette.ink,
              color: palette.paper,
              borderRadius: 'var(--osd-radius)',
              padding: '30px 34px',
            }}
          >
            <PptxText
              style={{
                fontFamily: fonts.mono,
                fontSize: 18,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#d8cbb7',
              }}
            >
              Matrix check
            </PptxText>
            <PptxEquation
              fallbackText="A = [[2, 1], [1, 2]], lambda_1 = 3, lambda_2 = 1"
              latex="A=\\begin{bmatrix}2&1\\\\1&2\\end{bmatrix},\\quad \\lambda_1=3,\\;\\lambda_2=1"
              style={{
                marginTop: 28,
                fontFamily: 'Cambria Math, Georgia, serif',
                fontSize: 30,
                lineHeight: 1.3,
                color: palette.paper,
              }}
            />
          </PptxBox>

          <PptxBox
            style={{
              background: palette.paper,
              border: `1px solid ${palette.faint}`,
              borderRadius: 'var(--osd-radius)',
              padding: '30px 34px',
            }}
          >
            <PptxText
              style={{
                fontFamily: fonts.mono,
                fontSize: 18,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: palette.accent,
              }}
            >
              Discrete expansion
            </PptxText>
            <PptxEquation
              fallbackText="sum k=0 to n binom(n,k) x^k y^(n-k) = (x+y)^n"
              latex="\\sum_{k=0}^{n} \\binom{n}{k}x^k y^{n-k} = (x+y)^n"
              style={{
                marginTop: 28,
                fontFamily: 'Cambria Math, Georgia, serif',
                fontSize: 30,
                lineHeight: 1.3,
                color: palette.blue,
              }}
            />
          </PptxBox>
        </div>
      </div>
    </div>
    <Footer label="latex, omml, matrices, derivations" />
  </div>
);

export const meta: SlideMeta = { title: 'PPTX Export Gauntlet' };

export const notes = [
  'Typography stress page: verify line breaks, font fallback, rich runs, mono spans, and dashed footer rule.',
  'Equation stress page: verify display and inline math export as editable OfficeMath.',
  'Media stress page: verify image cover behavior and raster diagnostics for filters/blend modes.',
  'Structured stress page: table and chart should export as native editable objects.',
  'STEM math page: verify LaTeX equations export as editable OfficeMath, including derivation steps, matrices, and summations.',
];

export default [
  TypographyStress,
  EquationStress,
  MediaStress,
  StructuredStress,
  StemMathStress,
] satisfies Page[];
