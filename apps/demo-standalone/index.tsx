import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';

export const meta: SlideMeta = {
  title: 'Untitled deck',
};

// Edit these live from the Design panel (press `d`); read via `var(--osd-*)`.
export const design: DesignSystem = {
  palette: {
    bg: '#0a0a0b',
    text: '#f5f5f4',
    accent: '#6e56cf',
  },
  fonts: {
    display: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
    body: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
  },
  typeScale: {
    hero: 150,
    body: 34,
  },
  radius: 18,
};

const fill = {
  width: '100%',
  height: '100%',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
  letterSpacing: '-0.02em',
  overflow: 'hidden',
  position: 'relative' as const,
};

const mono = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace';

const styles = `
  @keyframes ss-rise {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ss-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .ss-rise { opacity: 0; animation: ss-rise 0.8s cubic-bezier(.2,.7,.2,1) forwards; }
  .ss-fade { opacity: 0; animation: ss-fade 1s ease forwards; }
`;

function Glow() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(900px 600px at 78% 18%, color-mix(in srgb, var(--osd-accent) 28%, transparent), transparent 70%)',
        pointerEvents: 'none',
      }}
    />
  );
}

const Cover: Page = () => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: 160,
    }}
  >
    <style>{styles}</style>
    <Glow />
    <div
      className="ss-rise"
      style={{
        fontFamily: mono,
        fontSize: 26,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--osd-accent)',
        marginBottom: 40,
      }}
    >
      open-slide · standalone
    </div>
    <h1
      className="ss-rise"
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 'var(--osd-size-hero)',
        lineHeight: 0.95,
        fontWeight: 600,
        margin: 0,
        maxWidth: 1400,
        animationDelay: '0.08s',
      }}
    >
      One file.
      <br />
      One deck.
    </h1>
    <p
      className="ss-rise"
      style={{
        fontSize: 'var(--osd-size-body)',
        lineHeight: 1.5,
        color: 'color-mix(in srgb, var(--osd-text) 70%, transparent)',
        marginTop: 48,
        maxWidth: 920,
        animationDelay: '0.16s',
      }}
    >
      This whole presentation lives in <code style={{ fontFamily: mono }}>index.tsx</code>. Edit it,
      press <kbd>F</kbd> to present, and you're done.
    </p>
  </div>
);

const HowItWorks: Page = () => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: 160,
    }}
  >
    <style>{styles}</style>
    <h2
      className="ss-rise"
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 92,
        fontWeight: 600,
        margin: 0,
        marginBottom: 72,
      }}
    >
      How a page works
    </h2>
    <div style={{ display: 'flex', gap: 40 }}>
      {[
        [
          'Pages are React',
          'Each entry in the default export is a zero-prop component on a 1920×1080 canvas.',
        ],
        [
          'Inline design',
          'Tweak palette, fonts, and scale from the Design panel — it writes back to this file.',
        ],
        ['Assets folder', 'Drop images in assets/ and import them with ./assets/your-file.png.'],
      ].map(([title, body], i) => (
        <div
          key={title}
          className="ss-rise"
          style={{
            flex: 1,
            padding: 44,
            borderRadius: 'var(--osd-radius)',
            background: 'color-mix(in srgb, var(--osd-text) 5%, transparent)',
            border: '1px solid color-mix(in srgb, var(--osd-text) 10%, transparent)',
            animationDelay: `${0.1 + i * 0.08}s`,
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 600, marginBottom: 20 }}>{title}</div>
          <div
            style={{
              fontSize: 26,
              lineHeight: 1.5,
              color: 'color-mix(in srgb, var(--osd-text) 65%, transparent)',
            }}
          >
            {body}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Outro: Page = () => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 160,
    }}
  >
    <style>{styles}</style>
    <Glow />
    <div
      className="ss-fade"
      style={{ fontFamily: mono, fontSize: 26, color: 'var(--osd-accent)', marginBottom: 36 }}
    >
      npm run dev
    </div>
    <h2
      className="ss-rise"
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 110,
        fontWeight: 600,
        margin: 0,
        animationDelay: '0.08s',
      }}
    >
      Make it yours.
    </h2>
  </div>
);

export default [Cover, HowItWorks, Outro] satisfies Page[];
