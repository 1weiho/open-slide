import { ImagePlaceholder, type Page, type SlideMeta } from '@open-slide/react';

const fill = {
  width: '100%',
  height: '100%',
  background: '#FAFAF7',
  color: '#1A1A1A',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "SF Pro Display", system-ui, sans-serif',
  position: 'relative',
  overflow: 'hidden',
} as const;

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 18,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: '#888',
      fontWeight: 600,
    }}
  >
    {children}
  </div>
);

const Hero: Page = () => (
  <div style={fill}>
    <div style={{ padding: '120px 140px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <Eyebrow>Image placeholder demo</Eyebrow>
      <h1
        style={{
          fontSize: 88,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          margin: 0,
          maxWidth: 1500,
        }}
      >
        Drop an image to try it.
      </h1>
      <p style={{ fontSize: 26, color: '#555', lineHeight: 1.5, maxWidth: 1100, margin: 0 }}>
        Drag any image file from your file manager onto the placeholder below — it uploads to{' '}
        <code style={{ background: '#EFEEEA', padding: '2px 8px', borderRadius: 6 }}>
          slides/image-placeholder-demo/assets/
        </code>{' '}
        and slots in automatically.
      </p>
      <div style={{ marginTop: 24 }}>
        <ImagePlaceholder hint="Hero image — drop a JPG or PNG here" width={1640} height={520} />
      </div>
    </div>
  </div>
);

const Grid: Page = () => (
  <div style={fill}>
    <div style={{ padding: '120px 140px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <Eyebrow>Multiple placeholders</Eyebrow>
      <h2
        style={{
          fontSize: 64,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          margin: 0,
        }}
      >
        Three slots, three drops.
      </h2>
      <p style={{ fontSize: 22, color: '#555', lineHeight: 1.5, margin: 0, maxWidth: 1100 }}>
        Each placeholder is independent — drop a different image on each, or use the inspector's{' '}
        <strong>Replace</strong> button to pick from your assets folder.
      </p>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 24 }}
      >
        <ImagePlaceholder hint="Portrait" width={520} height={680} />
        <ImagePlaceholder hint="Square" width={520} height={680} />
        <ImagePlaceholder hint="Landscape" width={520} height={680} />
      </div>
    </div>
  </div>
);

const InspectorTest: Page = () => (
  <div style={fill}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        padding: '0 140px',
        gap: 80,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Eyebrow>Inspector flow</Eyebrow>
        <h2
          style={{
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          Or upload from
          <br />
          the inspector.
        </h2>
        <ol
          style={{
            fontSize: 22,
            color: '#444',
            lineHeight: 1.7,
            margin: 0,
            paddingLeft: 28,
          }}
        >
          <li>Toggle Inspect, click the placeholder.</li>
          <li>
            Hit <strong>Replace</strong> in the inspector panel.
          </li>
          <li>
            In the dialog, click <strong>Upload</strong> or drop a file directly into the grid.
          </li>
        </ol>
      </div>
      <ImagePlaceholder hint="Click me, then Replace" width={680} height={680} />
    </div>
  </div>
);

export const meta: SlideMeta = {
  title: 'Image Placeholder Demo',
  createdAt: '2026-05-10T18:27:38+08:00',
};

export default [Hero, Grid, InspectorTest] satisfies Page[];
