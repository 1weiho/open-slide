import {
  type DesignSystem,
  type Page,
  type SlideMeta,
  useSlidePageNumber,
} from '@open-slide/react';
import type { ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#0a0e14', text: '#e6edf3', accent: '#6ee7ff' },
  fonts: {
    display: "'JetBrains Mono', 'Menlo', 'Consolas', monospace",
    body: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  },
  typeScale: { hero: 132, body: 34 },
  radius: 6,
};

const surface = '#121823';
const text2 = '#aab5c4';
const muted = '#6b7889';
const rule = '#1c2533';
const mint = '#84ffae';
const warm = '#ffa860';
const violet = '#c598ff';
const danger = '#ff7a85';

const keyframes = `
@keyframes osa-fadeUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
@keyframes osa-fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes osa-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes osa-typeIn { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes osa-dashFlow { to { stroke-dashoffset: -40; } }
@keyframes osa-pulse { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
@keyframes osa-glow { 0%, 100% { box-shadow: 0 0 0 1px ${rule}, 0 0 24px rgba(110, 231, 255, 0.06); } 50% { box-shadow: 0 0 0 1px rgba(110, 231, 255, 0.5), 0 0 40px rgba(110, 231, 255, 0.25); } }
@keyframes osa-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes osa-scaleIn { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes osa-spin { to { transform: rotate(360deg); } }
@keyframes osa-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes osa-fitScale { 0%, 12% { transform: scale(1); } 25%, 50% { transform: scale(0.55); } 62%, 88% { transform: scale(0.78); } 100% { transform: scale(1); } }
@keyframes osa-blip { 0%, 100% { opacity: 0; } 10%, 60% { opacity: 1; } }
@keyframes osa-trail { 0% { offset-distance: 0%; opacity: 0; } 20%, 80% { opacity: 1; } 100% { offset-distance: 100%; opacity: 0; } }
@keyframes osa-rotateBg { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes osa-rise { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes osa-sweep { 0%, 100% { transform: translateX(-100%); } 50% { transform: translateX(100%); } }
@keyframes osa-bgDrift { 0%, 100% { background-position: 0% 0%; } 50% { background-position: 100% 100%; } }
`;

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  position: 'relative' as const,
  overflow: 'hidden' as const,
  boxSizing: 'border-box' as const,
};

const Eyebrow = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => (
  <div
    style={{
      fontFamily: 'var(--osd-font-display)',
      fontSize: 24,
      fontWeight: 500,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--osd-accent)',
      animation: `osa-fadeUp 600ms ease-out ${delay}ms both`,
    }}
  >
    {children}
  </div>
);

const Heading = ({
  children,
  size = 80,
  delay = 0,
}: {
  children: ReactNode;
  size?: number;
  delay?: number;
}) => (
  <h2
    style={{
      fontFamily: 'var(--osd-font-display)',
      fontSize: size,
      fontWeight: 700,
      lineHeight: 1.05,
      letterSpacing: '-0.01em',
      margin: 0,
      color: 'var(--osd-text)',
      animation: `osa-fadeUp 700ms ease-out ${delay}ms both`,
    }}
  >
    {children}
  </h2>
);

const Footer = ({ section }: { section: string }) => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 100,
        right: 100,
        bottom: 48,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontFamily: 'var(--osd-font-display)',
        fontSize: 22,
        color: muted,
        borderTop: `1px solid ${rule}`,
        paddingTop: 18,
        letterSpacing: '0.06em',
      }}
    >
      <span>
        <span style={{ color: 'var(--osd-accent)', marginRight: 12 }}>●</span>
        {section}
        <span style={{ color: rule, margin: '0 18px' }}>·</span>
        <span style={{ color: text2 }}>open-slide</span>
      </span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  );
};

const Cover: Page = () => (
  <div style={{ ...fill, padding: '120px 100px' }}>
    <style>{keyframes}</style>
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: -200,
        background: `radial-gradient(closest-side, rgba(110,231,255,0.18), transparent 70%)`,
        animation: 'osa-float 6s ease-in-out infinite',
        pointerEvents: 'none',
      }}
    />
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(${rule} 1px, transparent 1px), linear-gradient(90deg, ${rule} 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
        opacity: 0.25,
        maskImage: 'radial-gradient(circle at 20% 50%, black, transparent 70%)',
      }}
    />
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        maxWidth: 1500,
      }}
    >
      <Eyebrow>[ deep dive · architecture · v1 ]</Eyebrow>
      <div style={{ height: 56 }} />
      <h1
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 'var(--osd-size-hero)',
          fontWeight: 800,
          lineHeight: 1.02,
          letterSpacing: '-0.02em',
          margin: 0,
        }}
      >
        <span
          style={{ display: 'inline-block', animation: 'osa-typeIn 900ms steps(28, end) both' }}
        >
          Inside open-slide
        </span>
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: '0.5em',
            height: '0.92em',
            background: 'var(--osd-accent)',
            marginLeft: 16,
            verticalAlign: '-8px',
            animation: 'osa-blink 1.1s steps(1) infinite',
            boxShadow: '0 0 18px rgba(110,231,255,0.6)',
          }}
        />
      </h1>
      <div style={{ height: 36 }} />
      <p
        style={{
          fontSize: 40,
          lineHeight: 1.45,
          color: text2,
          maxWidth: 1300,
          margin: 0,
          animation: 'osa-fadeUp 700ms ease-out 600ms both',
        }}
      >
        How a <span style={{ color: 'var(--osd-accent)' }}>Page[]</span> becomes a
        <span style={{ color: mint }}> 1920×1080 </span>
        deck — every hook, every virtual module, every wire in the runtime.
      </p>
      <div style={{ height: 64 }} />
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 18,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 22,
          color: muted,
          animation: 'osa-fadeIn 800ms ease-out 1200ms both',
        }}
      >
        <span style={{ color: mint }}>$</span>
        <span>pnpm dev</span>
        <span style={{ color: rule }}>·</span>
        <span>16 pages</span>
        <span style={{ color: rule }}>·</span>
        <span>
          press{' '}
          <kbd
            style={{
              padding: '2px 10px',
              border: `1px solid ${rule}`,
              borderRadius: 4,
              color: text2,
            }}
          >
            F
          </kbd>{' '}
          for play
        </span>
      </div>
    </div>
    <Footer section="cover" />
  </div>
);

const Agenda: Page = () => {
  const items: { n: string; label: string; tint: string }[] = [
    { n: '01', label: 'The mental model — a deck is a Page[]', tint: 'var(--osd-accent)' },
    { n: '02', label: 'The file contract — what every slide exports', tint: 'var(--osd-accent)' },
    { n: '03', label: 'Discovery — fast-glob → virtual modules', tint: mint },
    { n: '04', label: 'The Vite plugin — four hooks doing the work', tint: mint },
    { n: '05', label: 'Render pipeline — URL to mounted Page', tint: mint },
    { n: '06', label: 'Canvas scaling — 1920×1080, fit-to-fit', tint: warm },
    { n: '07', label: 'Hot reload — vmod invalidation + Fast Refresh', tint: warm },
    { n: '08', label: 'Design system + AST round-trip', tint: violet },
    { n: '09', label: 'Inspector, Present mode, CLI', tint: violet },
  ];
  return (
    <div style={{ ...fill, padding: '120px 100px' }}>
      <style>{keyframes}</style>
      <Eyebrow>02 · agenda</Eyebrow>
      <div style={{ height: 36 }} />
      <Heading size={88}>What we're going to dissect.</Heading>
      <div style={{ height: 56 }} />
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, columnCount: 2, columnGap: 80 }}>
        {items.map((item, i) => (
          <li
            key={item.n}
            style={{
              breakInside: 'avoid',
              display: 'flex',
              alignItems: 'baseline',
              gap: 24,
              padding: '14px 0',
              borderBottom: `1px dashed ${rule}`,
              animation: `osa-fadeUp 500ms ease-out ${300 + i * 70}ms both`,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--osd-font-display)',
                fontSize: 22,
                color: item.tint,
                width: 48,
                flexShrink: 0,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {item.n}
            </span>
            <span style={{ fontSize: 32, color: text2, lineHeight: 1.4 }}>{item.label}</span>
          </li>
        ))}
      </ol>
      <Footer section="agenda" />
    </div>
  );
};

const MentalModel: Page = () => {
  const pages = ['Cover', 'Agenda', 'Body', 'Body', 'Closing'];
  return (
    <div style={{ ...fill, padding: '120px 100px' }}>
      <style>{keyframes}</style>
      <Eyebrow>03 · foundation</Eyebrow>
      <div style={{ height: 28 }} />
      <Heading size={84}>A deck is a list.</Heading>
      <div style={{ height: 48 }} />
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 80, alignItems: 'center' }}
      >
        <div style={{ animation: 'osa-fadeUp 600ms ease-out 200ms both' }}>
          <p style={{ fontSize: 34, lineHeight: 1.55, color: text2, margin: 0 }}>
            Every slide file{' '}
            <code style={{ color: 'var(--osd-accent)', fontFamily: 'var(--osd-font-display)' }}>
              export default
            </code>
            s an array of zero-prop React components — one per page, in order.
          </p>
          <div style={{ height: 32 }} />
          <p style={{ fontSize: 30, lineHeight: 1.5, color: muted, margin: 0 }}>
            The framework is just{' '}
            <em style={{ color: text2, fontStyle: 'normal' }}>
              "render{' '}
              <code style={{ fontFamily: 'var(--osd-font-display)', color: 'var(--osd-accent)' }}>
                pages[index]
              </code>{' '}
              at 1920×1080"
            </em>{' '}
            wrapped in scaffolding for discovery, scaling, and dev-time tooling.
          </p>
          <div style={{ height: 40 }} />
          <pre
            style={{
              margin: 0,
              padding: 24,
              background: surface,
              border: `1px solid ${rule}`,
              borderRadius: 8,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 24,
              lineHeight: 1.6,
              color: text2,
            }}
          >
            <span style={{ color: violet }}>export default</span> [
            <span style={{ color: mint }}>Cover</span>, <span style={{ color: mint }}>Body</span>,{' '}
            <span style={{ color: mint }}>Closing</span>]{' '}
            <span style={{ color: violet }}>satisfies</span>{' '}
            <span style={{ color: warm }}>Page[]</span>
            <span>;</span>
          </pre>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pages.map((label, i) => (
            <div
              key={label + i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                padding: '20px 28px',
                background: surface,
                border: `1px solid ${rule}`,
                borderRadius: 8,
                animation: `osa-rise 500ms cubic-bezier(.2,.7,.3,1) ${400 + i * 140}ms both`,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--osd-font-display)',
                  fontSize: 26,
                  color: 'var(--osd-accent)',
                  width: 44,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {String(i).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 30, color: text2, fontFamily: 'var(--osd-font-display)' }}>
                {label}
              </span>
              <span
                aria-hidden
                style={{
                  marginLeft: 'auto',
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: i === 0 ? 'var(--osd-accent)' : rule,
                  boxShadow: i === 0 ? '0 0 14px rgba(110,231,255,0.6)' : 'none',
                  animation: i === 0 ? 'osa-pulse 1.6s ease-in-out infinite' : undefined,
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <Footer section="foundation" />
    </div>
  );
};

const Token = ({ c = text2, children }: { c?: string; children: ReactNode }) => (
  <span style={{ color: c }}>{children}</span>
);

const FileContract: Page = () => {
  const lines: { code: ReactNode; tag?: string; tagColor?: string }[] = [
    {
      code: (
        <>
          <Token c={violet}>import type</Token> {'{'} <Token c={warm}>DesignSystem</Token>,{' '}
          <Token c={warm}>Page</Token>, <Token c={warm}>SlideMeta</Token> {'}'}{' '}
          <Token c={violet}>from</Token> <Token c={mint}>'@open-slide/react'</Token>
          {';'}
        </>
      ),
    },
    { code: <>&nbsp;</> },
    {
      code: (
        <>
          <Token c={violet}>export const</Token> <Token c={'var(--osd-accent)'}>design</Token>:{' '}
          <Token c={warm}>DesignSystem</Token> = {'{ … }'}
          {';'}
        </>
      ),
      tag: 'tokens → CSS vars',
      tagColor: violet,
    },
    { code: <>&nbsp;</> },
    {
      code: (
        <>
          <Token c={violet}>const</Token> <Token c={mint}>Cover</Token>:{' '}
          <Token c={warm}>Page</Token> = () =&gt; &lt;div&gt;…&lt;/div&gt;;
        </>
      ),
      tag: 'page = component',
      tagColor: mint,
    },
    {
      code: (
        <>
          <Token c={violet}>const</Token> <Token c={mint}>Body</Token>: <Token c={warm}>Page</Token>{' '}
          = () =&gt; &lt;div&gt;…&lt;/div&gt;;
        </>
      ),
    },
    { code: <>&nbsp;</> },
    {
      code: (
        <>
          <Token c={violet}>export const</Token> <Token c={'var(--osd-accent)'}>meta</Token>:{' '}
          <Token c={warm}>SlideMeta</Token> = {'{'} title: <Token c={mint}>'My slide'</Token> {'}'}
          {';'}
        </>
      ),
      tag: 'header label',
      tagColor: warm,
    },
    {
      code: (
        <>
          <Token c={violet}>export default</Token> [<Token c={mint}>Cover</Token>,{' '}
          <Token c={mint}>Body</Token>] <Token c={violet}>satisfies</Token>{' '}
          <Token c={warm}>Page[]</Token>
          <span>;</span>
        </>
      ),
      tag: 'the deck',
      tagColor: 'var(--osd-accent)',
    },
  ];
  return (
    <div style={{ ...fill, padding: '120px 100px' }}>
      <style>{keyframes}</style>
      <Eyebrow>04 · foundation</Eyebrow>
      <div style={{ height: 28 }} />
      <Heading size={80}>The file contract.</Heading>
      <div style={{ height: 24 }} />
      <p style={{ fontSize: 30, color: text2, lineHeight: 1.5, margin: 0, maxWidth: 1500 }}>
        <code style={{ fontFamily: 'var(--osd-font-display)', color: 'var(--osd-accent)' }}>
          slides/&lt;id&gt;/index.tsx
        </code>{' '}
        — four moving parts. Anything else (assets, helpers) is yours to invent.
      </p>
      <div style={{ height: 40 }} />
      <div
        style={{
          background: surface,
          border: `1px solid ${rule}`,
          borderRadius: 10,
          padding: '32px 0',
          fontFamily: 'var(--osd-font-display)',
          fontSize: 26,
          lineHeight: 1.65,
          position: 'relative',
        }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '64px 1fr 240px',
              alignItems: 'center',
              padding: '4px 32px',
              borderLeft: line.tag ? `2px solid ${line.tagColor}` : '2px solid transparent',
              animation: `osa-fadeIn 400ms ease-out ${300 + i * 80}ms both`,
            }}
          >
            <span style={{ color: muted, fontVariantNumeric: 'tabular-nums', fontSize: 20 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ color: text2 }}>{line.code}</span>
            <span
              style={{
                color: line.tagColor ?? 'transparent',
                fontSize: 18,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                textAlign: 'right',
              }}
            >
              {line.tag ? `← ${line.tag}` : ''}
            </span>
          </div>
        ))}
      </div>
      <Footer section="foundation" />
    </div>
  );
};

const Discovery: Page = () => {
  const tree = [
    'slides/',
    '  cover/index.tsx',
    '  agenda/index.tsx',
    '  body/index.tsx',
    '  closing/index.tsx',
  ];
  return (
    <div style={{ ...fill, padding: '120px 100px' }}>
      <style>{keyframes}</style>
      <Eyebrow>05 · discovery</Eyebrow>
      <div style={{ height: 28 }} />
      <Heading size={84}>fast-glob walks the tree.</Heading>
      <div style={{ height: 24 }} />
      <p style={{ fontSize: 30, color: text2, lineHeight: 1.5, margin: 0, maxWidth: 1600 }}>
        At server start, the plugin globs{' '}
        <code style={{ fontFamily: 'var(--osd-font-display)', color: 'var(--osd-accent)' }}>
          */index.{'{tsx,jsx,ts,js}'}
        </code>{' '}
        under your{' '}
        <code style={{ fontFamily: 'var(--osd-font-display)', color: mint }}>slides/</code>{' '}
        directory and turns each hit into an id.
      </p>
      <div style={{ height: 56 }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 80px 1fr 80px 1fr',
          alignItems: 'center',
          gap: 0,
        }}
      >
        <div
          style={{
            background: surface,
            border: `1px solid ${rule}`,
            borderRadius: 10,
            padding: 28,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 24,
            lineHeight: 1.7,
            color: text2,
            animation: 'osa-fadeUp 500ms ease-out 200ms both',
          }}
        >
          <div
            style={{
              color: muted,
              fontSize: 18,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            filesystem
          </div>
          {tree.map((line, i) => (
            <div key={i} style={{ color: line.includes('index') ? text2 : muted }}>
              {line.replace(/^/, '')}
            </div>
          ))}
        </div>

        <FlowArrow delay={500} />

        <div
          style={{
            background: surface,
            border: `1px solid ${'var(--osd-accent)'}`,
            borderRadius: 10,
            padding: 28,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 22,
            color: text2,
            animation: 'osa-glow 3s ease-in-out infinite, osa-fadeUp 500ms ease-out 600ms both',
          }}
        >
          <div
            style={{
              color: 'var(--osd-accent)',
              fontSize: 18,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            findSlides()
          </div>
          <div style={{ color: muted }}>fg('*/index.&#123;tsx,jsx,ts,js&#125;')</div>
          <div style={{ height: 14 }} />
          <div style={{ color: text2 }}>
            ['cover', 'agenda',
            <br />
            &nbsp;'body', 'closing']
          </div>
        </div>

        <FlowArrow delay={900} />

        <div
          style={{
            background: surface,
            border: `1px solid ${rule}`,
            borderRadius: 10,
            padding: 28,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 22,
            color: text2,
            animation: 'osa-fadeUp 500ms ease-out 1000ms both',
          }}
        >
          <div
            style={{
              color: mint,
              fontSize: 18,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            virtual module
          </div>
          <div style={{ color: 'var(--osd-accent)' }}>virtual:open-slide/slides</div>
          <div style={{ height: 14 }} />
          <div style={{ color: muted, fontSize: 20 }}>
            export const slideIds
            <br />
            export async function loadSlide(id)
          </div>
        </div>
      </div>
      <Footer section="discovery" />
    </div>
  );
};

const FlowArrow = ({ delay = 0 }: { delay?: number }) => (
  <svg width="80" height="40" viewBox="0 0 80 40" style={{ overflow: 'visible' }}>
    <line
      x1="0"
      y1="20"
      x2="64"
      y2="20"
      stroke="var(--osd-accent)"
      strokeWidth="2"
      strokeDasharray="6 6"
      style={{
        animation: `osa-dashFlow 1.4s linear infinite`,
        opacity: 0.9,
        animationDelay: `${delay}ms`,
      }}
    />
    <polygon points="64,12 80,20 64,28" fill="var(--osd-accent)" />
  </svg>
);

const VirtualModules: Page = () => {
  const mods = [
    {
      id: 'virtual:open-slide/slides',
      tint: 'var(--osd-accent)',
      bullets: ['slideIds: string[]', 'loadSlide(id) → import(...)', 'one async chunk per slide'],
    },
    {
      id: 'virtual:open-slide/config',
      tint: mint,
      bullets: ['runtime feature flags', 'showSlideBrowser, showSlideUi', 'allowHtmlDownload'],
    },
    {
      id: 'virtual:open-slide/folders',
      tint: warm,
      bullets: ['reads .folders.json', 'folder tree + slide → folder map', 'powers the sidebar UI'],
    },
  ];
  return (
    <div style={{ ...fill, padding: '120px 100px' }}>
      <style>{keyframes}</style>
      <Eyebrow>06 · discovery</Eyebrow>
      <div style={{ height: 28 }} />
      <Heading size={80}>Three virtual modules.</Heading>
      <div style={{ height: 24 }} />
      <p style={{ fontSize: 30, color: text2, lineHeight: 1.5, margin: 0, maxWidth: 1600 }}>
        Generated on demand by{' '}
        <code style={{ fontFamily: 'var(--osd-font-display)', color: 'var(--osd-accent)' }}>
          resolveId
        </code>
        /
        <code style={{ fontFamily: 'var(--osd-font-display)', color: 'var(--osd-accent)' }}>
          load
        </code>
        . The runtime imports them as if they were ordinary files.
      </p>
      <div style={{ height: 56 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
        {mods.map((m, i) => (
          <div
            key={m.id}
            style={{
              background: surface,
              border: `1px solid ${rule}`,
              borderTop: `3px solid ${m.tint}`,
              borderRadius: 8,
              padding: 36,
              animation: `osa-rise 600ms cubic-bezier(.2,.7,.3,1) ${300 + i * 180}ms both`,
              position: 'relative',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: -3,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg, transparent, ${m.tint}, transparent)`,
                animation: `osa-sweep 3.6s ease-in-out infinite`,
                animationDelay: `${i * 600}ms`,
                opacity: 0.7,
              }}
            />
            <div
              style={{
                fontFamily: 'var(--osd-font-display)',
                fontSize: 28,
                color: m.tint,
                marginBottom: 28,
                wordBreak: 'break-all',
              }}
            >
              {m.id}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {m.bullets.map((b, j) => (
                <li
                  key={j}
                  style={{
                    fontSize: 26,
                    lineHeight: 1.5,
                    color: text2,
                    paddingLeft: 24,
                    position: 'relative',
                    marginBottom: 14,
                    fontFamily:
                      b.includes('(') || b.includes(':')
                        ? 'var(--osd-font-display)'
                        : 'var(--osd-font-body)',
                  }}
                >
                  <span style={{ position: 'absolute', left: 0, color: m.tint }}>›</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Footer section="discovery" />
    </div>
  );
};

const VitePluginHooks: Page = () => {
  const hooks = [
    {
      name: 'config()',
      desc: 'set isDev flag · allow fs access to userCwd',
      tint: 'var(--osd-accent)',
    },
    { name: 'resolveId()', desc: 'claim the three virtual:open-slide/* ids', tint: mint },
    { name: 'load()', desc: 'generate slideIds + loadSlide() switch on the fly', tint: warm },
    {
      name: 'configureServer()',
      desc: 'watch slides/* — invalidate vmod, full-reload',
      tint: violet,
    },
  ];
  return (
    <div style={{ ...fill, padding: '120px 100px' }}>
      <style>{keyframes}</style>
      <Eyebrow>07 · plugin</Eyebrow>
      <div style={{ height: 28 }} />
      <Heading size={84}>Four hooks. That's the plugin.</Heading>
      <div style={{ height: 24 }} />
      <p style={{ fontSize: 30, color: text2, lineHeight: 1.5, margin: 0, maxWidth: 1600 }}>
        <code style={{ fontFamily: 'var(--osd-font-display)', color: 'var(--osd-accent)' }}>
          openSlidePlugin()
        </code>{' '}
        returns a tiny Vite plugin object — no esbuild transforms, no compiler hacks. Just glue.
      </p>
      <div style={{ height: 48 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }}>
        {hooks.map((h, i) => (
          <div
            key={h.name}
            style={{
              background: surface,
              border: `1px solid ${rule}`,
              borderRadius: 10,
              padding: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 28,
              animation: `osa-fadeUp 500ms ease-out ${300 + i * 140}ms both`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: h.tint,
                boxShadow: `0 0 18px ${h.tint}80`,
                animation: `osa-pulse 2s ease-in-out infinite`,
                animationDelay: `${i * 300}ms`,
                flexShrink: 0,
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: 'var(--osd-font-display)',
                  fontSize: 36,
                  color: h.tint,
                  marginBottom: 8,
                }}
              >
                {h.name}
              </div>
              <div style={{ fontSize: 26, color: text2, lineHeight: 1.4 }}>{h.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <Footer section="plugin" />
    </div>
  );
};

const RenderPipeline: Page = () => {
  const stages = [
    { label: '/s/<id>', sub: 'route match', tint: 'var(--osd-accent)' },
    { label: 'loadSlide(id)', sub: 'vmod export', tint: mint },
    { label: "import('./<id>/index.tsx')", sub: 'dynamic chunk', tint: warm },
    { label: 'pages = module.default', sub: 'Page[]', tint: violet },
    { label: '<SlideCanvas>', sub: '1920×1080', tint: 'var(--osd-accent)' },
    { label: 'pages[index]()', sub: 'mount', tint: mint },
  ];
  return (
    <div style={{ ...fill, padding: '120px 100px' }}>
      <style>{keyframes}</style>
      <Eyebrow>08 · render</Eyebrow>
      <div style={{ height: 28 }} />
      <Heading size={84}>From URL to mounted Page.</Heading>
      <div style={{ height: 24 }} />
      <p style={{ fontSize: 30, color: text2, lineHeight: 1.5, margin: 0, maxWidth: 1600 }}>
        Six stages, each one a single function call. The chunk is fetched once, then your Page
        renders inside the canvas.
      </p>
      <div style={{ height: 64 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>
        {stages.map((s, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 32,
              animation: `osa-fadeUp 450ms ease-out ${300 + i * 150}ms both`,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                border: `2px solid ${s.tint}`,
                background: surface,
                color: s.tint,
                fontFamily: 'var(--osd-font-display)',
                fontSize: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 0 24px ${s.tint}30`,
                animation: 'osa-pulse 2.4s ease-in-out infinite',
                animationDelay: `${i * 220}ms`,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </div>
            <div
              style={{
                flex: 1,
                background: surface,
                border: `1px solid ${rule}`,
                borderRadius: 8,
                padding: '18px 28px',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 32,
              }}
            >
              <code style={{ fontFamily: 'var(--osd-font-display)', fontSize: 30, color: s.tint }}>
                {s.label}
              </code>
              <span
                style={{
                  fontSize: 22,
                  color: muted,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                {s.sub}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Footer section="render" />
    </div>
  );
};

const CanvasScaling: Page = () => {
  return (
    <div style={{ ...fill, padding: '120px 100px' }}>
      <style>{keyframes}</style>
      <Eyebrow>09 · render</Eyebrow>
      <div style={{ height: 28 }} />
      <Heading size={80}>One canvas. 1920 × 1080. Scaled.</Heading>
      <div style={{ height: 28 }} />
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}
      >
        <div style={{ animation: 'osa-fadeUp 600ms ease-out 200ms both' }}>
          <p style={{ fontSize: 30, color: text2, lineHeight: 1.55, margin: 0 }}>
            <code style={{ fontFamily: 'var(--osd-font-display)', color: 'var(--osd-accent)' }}>
              SlideCanvas
            </code>{' '}
            mounts a{' '}
            <code style={{ fontFamily: 'var(--osd-font-display)', color: mint }}>
              ResizeObserver
            </code>{' '}
            on its container, computes the fit factor, and applies{' '}
            <code style={{ fontFamily: 'var(--osd-font-display)', color: warm }}>
              transform: scale(s)
            </code>
            .
          </p>
          <div style={{ height: 28 }} />
          <pre
            style={{
              margin: 0,
              padding: '20px 24px',
              background: surface,
              border: `1px solid ${rule}`,
              borderRadius: 8,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 26,
              lineHeight: 1.6,
              color: text2,
            }}
          >
            <span style={{ color: muted }}>const</span>{' '}
            <span style={{ color: 'var(--osd-accent)' }}>s</span> ={' '}
            <span style={{ color: mint }}>Math.min</span>(
            <br />
            {'  '}width / <span style={{ color: warm }}>1920</span>,
            <br />
            {'  '}height / <span style={{ color: warm }}>1080</span>,
            <br />
            );
          </pre>
          <div style={{ height: 28 }} />
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: 26,
              color: text2,
              lineHeight: 1.6,
            }}
          >
            <li style={{ marginBottom: 10 }}>
              <span style={{ color: 'var(--osd-accent)' }}>›</span> design as if the viewport{' '}
              <em style={{ fontStyle: 'normal', color: text2 }}>is</em> 1920×1080
            </li>
            <li style={{ marginBottom: 10 }}>
              <span style={{ color: 'var(--osd-accent)' }}>›</span> use absolute pixel values
              everywhere
            </li>
            <li>
              <span style={{ color: 'var(--osd-accent)' }}>›</span> overflow past 1080 is silently
              cropped
            </li>
          </ul>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div
            style={{
              width: 600,
              height: 360,
              border: `2px dashed ${muted}`,
              borderRadius: 8,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'osa-fadeIn 600ms ease-out 400ms both',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -36,
                left: 0,
                fontFamily: 'var(--osd-font-display)',
                fontSize: 20,
                color: muted,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              browser viewport
            </div>
            <div
              style={{
                width: 480,
                height: 270,
                background: 'linear-gradient(135deg, #1a2332, #0f1622)',
                border: `1px solid var(--osd-accent)`,
                borderRadius: 6,
                position: 'relative',
                transformOrigin: 'center',
                animation: 'osa-fitScale 6s ease-in-out infinite',
                boxShadow: '0 0 40px rgba(110,231,255,0.18)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 14,
                  fontFamily: 'var(--osd-font-display)',
                  fontSize: 16,
                  color: 'var(--osd-accent)',
                  letterSpacing: '0.14em',
                }}
              >
                1920 × 1080
              </div>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--osd-font-display)',
                  fontSize: 28,
                  color: text2,
                  fontWeight: 700,
                }}
              >
                Page
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 12,
                  fontFamily: 'var(--osd-font-display)',
                  fontSize: 14,
                  color: muted,
                }}
              >
                transform: scale(s)
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer section="render" />
    </div>
  );
};

const HotReload: Page = () => {
  const steps = [
    { time: 't = 0', label: 'fs writes slides/cover/index.tsx', tint: muted },
    { time: 't ≈ 8ms', label: 'chokidar fires "change"', tint: 'var(--osd-accent)' },
    { time: 't ≈ 12ms', label: 'Vite invalidates the module', tint: mint },
    { time: 't ≈ 14ms', label: 'React Fast Refresh re-renders', tint: warm },
    { time: 't ≈ 30ms', label: 'page repaints — same scroll, same state', tint: violet },
  ];
  return (
    <div style={{ ...fill, padding: '120px 100px' }}>
      <style>{keyframes}</style>
      <Eyebrow>10 · runtime</Eyebrow>
      <div style={{ height: 28 }} />
      <Heading size={80}>Hot reload, two flavors.</Heading>
      <div style={{ height: 24 }} />
      <p style={{ fontSize: 30, color: text2, lineHeight: 1.5, margin: 0, maxWidth: 1600 }}>
        Edit a slide file → <span style={{ color: 'var(--osd-accent)' }}>Fast Refresh</span>. Add or
        remove a slide folder → the watcher invalidates{' '}
        <code style={{ fontFamily: 'var(--osd-font-display)', color: mint }}>
          virtual:open-slide/slides
        </code>{' '}
        and triggers a<span style={{ color: warm }}> full reload</span>.
      </p>
      <div style={{ height: 56 }} />
      <div style={{ position: 'relative', paddingLeft: 40 }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 17,
            top: 8,
            bottom: 8,
            width: 2,
            background: `linear-gradient(${muted}, ${'var(--osd-accent)'}, ${mint}, ${warm}, ${violet})`,
            opacity: 0.5,
          }}
        />
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: '180px 1fr',
              gap: 32,
              alignItems: 'center',
              padding: '14px 0',
              animation: `osa-fadeUp 500ms ease-out ${300 + i * 220}ms both`,
            }}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: -32,
                top: '50%',
                width: 18,
                height: 18,
                marginTop: -9,
                borderRadius: 999,
                background: s.tint,
                boxShadow: `0 0 14px ${s.tint}80`,
                animation: 'osa-pulse 1.8s ease-in-out infinite',
                animationDelay: `${i * 300}ms`,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--osd-font-display)',
                fontSize: 24,
                color: muted,
                letterSpacing: '0.06em',
              }}
            >
              {s.time}
            </span>
            <span style={{ fontSize: 30, color: text2 }}>{s.label}</span>
          </div>
        ))}
      </div>
      <Footer section="runtime" />
    </div>
  );
};

const DesignSystemPage: Page = () => {
  const vars: { name: string; from: string; tint: string }[] = [
    { name: '--osd-bg', from: 'palette.bg', tint: 'var(--osd-accent)' },
    { name: '--osd-text', from: 'palette.text', tint: 'var(--osd-accent)' },
    { name: '--osd-accent', from: 'palette.accent', tint: 'var(--osd-accent)' },
    { name: '--osd-font-display', from: 'fonts.display', tint: mint },
    { name: '--osd-font-body', from: 'fonts.body', tint: mint },
    { name: '--osd-size-hero', from: 'typeScale.hero', tint: warm },
    { name: '--osd-size-body', from: 'typeScale.body', tint: warm },
    { name: '--osd-radius', from: 'radius', tint: violet },
  ];
  return (
    <div style={{ ...fill, padding: '120px 100px' }}>
      <style>{keyframes}</style>
      <Eyebrow>11 · design</Eyebrow>
      <div style={{ height: 28 }} />
      <Heading size={80}>Tokens flow into 8 CSS variables.</Heading>
      <div style={{ height: 24 }} />
      <p style={{ fontSize: 30, color: text2, lineHeight: 1.5, margin: 0, maxWidth: 1600 }}>
        Declare{' '}
        <code style={{ fontFamily: 'var(--osd-font-display)', color: 'var(--osd-accent)' }}>
          export const design
        </code>
        <span>;</span> the framework runs{' '}
        <code style={{ fontFamily: 'var(--osd-font-display)', color: mint }}>
          designToCssVars()
        </code>{' '}
        and spreads the result onto the canvas root.
      </p>
      <div style={{ height: 40 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {vars.map((v, i) => (
          <div
            key={v.name}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 60px 1fr',
              alignItems: 'center',
              gap: 16,
              padding: '14px 24px',
              background: surface,
              border: `1px solid ${rule}`,
              borderRadius: 8,
              animation: `osa-fadeUp 400ms ease-out ${250 + i * 80}ms both`,
            }}
          >
            <code style={{ fontFamily: 'var(--osd-font-display)', fontSize: 24, color: muted }}>
              design.{v.from}
            </code>
            <span style={{ display: 'flex', justifyContent: 'center' }}>
              <FlowArrow delay={i * 100} />
            </span>
            <code
              style={{
                fontFamily: 'var(--osd-font-display)',
                fontSize: 26,
                color: v.tint,
                textAlign: 'right',
              }}
            >
              {v.name}
            </code>
          </div>
        ))}
      </div>
      <Footer section="design" />
    </div>
  );
};

const DesignPanelWrite: Page = () => {
  const ring = [
    { label: 'drag slider', tint: 'var(--osd-accent)', sub: 'panel UI' },
    { label: 'live --osd-* update', tint: mint, sub: 'in-memory CSS var' },
    { label: 'click Save', tint: warm, sub: 'commit' },
    { label: 'PUT /design/<id>', tint: violet, sub: 'design-plugin endpoint' },
    { label: 'Babel parse → AST', tint: 'var(--osd-accent)', sub: 'find const design' },
    { label: 'rewrite literal in source', tint: mint, sub: 'applyDesignWrite()' },
    { label: 'HMR re-runs slide', tint: warm, sub: 'design const = new value' },
  ];
  return (
    <div style={{ ...fill, padding: '120px 100px' }}>
      <style>{keyframes}</style>
      <Eyebrow>12 · design</Eyebrow>
      <div style={{ height: 28 }} />
      <Heading size={80}>The AST round-trip.</Heading>
      <div style={{ height: 24 }} />
      <p style={{ fontSize: 30, color: text2, lineHeight: 1.5, margin: 0, maxWidth: 1700 }}>
        The Design panel previews changes against a live CSS-var draft.{' '}
        <span style={{ color: 'var(--osd-accent)' }}>Save</span> turns the draft into a Babel AST
        rewrite of the
        <code style={{ fontFamily: 'var(--osd-font-display)', color: warm }}> design </code>
        object literal — your source file stays the source of truth.
      </p>
      <div style={{ height: 48 }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 12,
          alignItems: 'stretch',
        }}
      >
        {ring.map((r, i) => (
          <div
            key={i}
            style={{
              background: surface,
              border: `1px solid ${rule}`,
              borderTop: `2px solid ${r.tint}`,
              borderRadius: 8,
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              animation: `osa-rise 500ms cubic-bezier(.2,.7,.3,1) ${300 + i * 140}ms both`,
              position: 'relative',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--osd-font-display)',
                fontSize: 18,
                color: r.tint,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              0{i + 1}
            </div>
            <div style={{ fontSize: 22, color: text2, lineHeight: 1.3, fontWeight: 500 }}>
              {r.label}
            </div>
            <div style={{ fontSize: 18, color: muted, fontFamily: 'var(--osd-font-display)' }}>
              {r.sub}
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 32 }} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 22,
          color: muted,
          padding: '14px 24px',
          border: `1px dashed ${rule}`,
          borderRadius: 8,
          maxWidth: 'fit-content',
          animation: 'osa-fadeIn 600ms ease-out 1500ms both',
        }}
      >
        <span style={{ color: mint }}>↻</span>
        round-trip: live preview never lies, but the file always wins.
      </div>
      <Footer section="design" />
    </div>
  );
};

const Inspector: Page = () => {
  return (
    <div style={{ ...fill, padding: '120px 100px' }}>
      <style>{keyframes}</style>
      <Eyebrow>13 · tools</Eyebrow>
      <div style={{ height: 28 }} />
      <Heading size={84}>Inspect → jump to source.</Heading>
      <div style={{ height: 24 }} />
      <p style={{ fontSize: 30, color: text2, lineHeight: 1.5, margin: 0, maxWidth: 1700 }}>
        A small Babel plugin tags every JSX element with{' '}
        <code style={{ fontFamily: 'var(--osd-font-display)', color: 'var(--osd-accent)' }}>
          data-slide-loc="line:col"
        </code>
        . The overlay reads it on hover; React Fiber is a fallback.
      </p>
      <div style={{ height: 48 }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: 60,
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            background: surface,
            border: `1px solid ${rule}`,
            borderRadius: 10,
            padding: 32,
            position: 'relative',
            animation: 'osa-fadeUp 500ms ease-out 200ms both',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 18,
              color: muted,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            in the rendered DOM
          </div>
          <pre
            style={{
              margin: 0,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 22,
              lineHeight: 1.7,
              color: text2,
              whiteSpace: 'pre-wrap',
            }}
          >
            <span style={{ color: muted }}>&lt;</span>
            <span style={{ color: violet }}>h1</span>
            {'\n  '}
            <span style={{ color: 'var(--osd-accent)' }}>style</span>={'{'}
            <span style={{ color: warm }}>{'{ … }'}</span>
            {'}'}
            {'\n  '}
            <span style={{ color: mint }}>data-slide-loc</span>=
            <span
              style={{
                color: warm,
                background: 'rgba(255,168,96,0.12)',
                padding: '2px 8px',
                borderRadius: 4,
                animation: 'osa-glow 2.4s ease-in-out infinite',
              }}
            >
              "42:8"
            </span>
            {'\n'}
            <span style={{ color: muted }}>&gt;</span>
            {'\n  '}Inside open-slide
            {'\n'}
            <span style={{ color: muted }}>&lt;/</span>
            <span style={{ color: violet }}>h1</span>
            <span style={{ color: muted }}>&gt;</span>
          </pre>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: 24,
              bottom: 24,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 18,
              color: muted,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            loc-tags-plugin
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            animation: 'osa-fadeUp 500ms ease-out 500ms both',
          }}
        >
          {[
            { n: '01', label: 'click "Inspect" in the slide header', tint: 'var(--osd-accent)' },
            { n: '02', label: 'hover the canvas — outline + label', tint: mint },
            { n: '03', label: 'click → reveal "42:8" in your editor', tint: warm },
            { n: '04', label: 'Comment / Replace flows reuse the loc', tint: violet },
          ].map((s, i) => (
            <div
              key={s.n}
              style={{
                display: 'flex',
                gap: 24,
                alignItems: 'center',
                padding: '20px 24px',
                background: surface,
                border: `1px solid ${rule}`,
                borderLeft: `3px solid ${s.tint}`,
                borderRadius: 8,
                animation: `osa-rise 450ms cubic-bezier(.2,.7,.3,1) ${600 + i * 180}ms both`,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--osd-font-display)',
                  fontSize: 22,
                  color: s.tint,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {s.n}
              </span>
              <span style={{ fontSize: 26, color: text2, lineHeight: 1.4 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <Footer section="tools" />
    </div>
  );
};

const PresentMode: Page = () => {
  const keys: { k: string; label: string; tint: string }[] = [
    { k: 'F', label: 'enter / exit fullscreen', tint: 'var(--osd-accent)' },
    { k: '→ / Space', label: 'next page', tint: mint },
    { k: '←', label: 'previous page', tint: mint },
    { k: 'B', label: 'blackout', tint: warm },
    { k: 'L', label: 'laser pointer', tint: danger },
    { k: 'O', label: 'overview grid', tint: violet },
    { k: 'Esc', label: 'exit', tint: muted },
  ];
  return (
    <div style={{ ...fill, padding: '120px 100px' }}>
      <style>{keyframes}</style>
      <Eyebrow>14 · tools</Eyebrow>
      <div style={{ height: 28 }} />
      <Heading size={84}>Press F. The chrome disappears.</Heading>
      <div style={{ height: 24 }} />
      <p style={{ fontSize: 30, color: text2, lineHeight: 1.5, margin: 0, maxWidth: 1700 }}>
        <code style={{ fontFamily: 'var(--osd-font-display)', color: 'var(--osd-accent)' }}>
          Player
        </code>{' '}
        calls{' '}
        <code style={{ fontFamily: 'var(--osd-font-display)', color: mint }}>
          requestFullscreen()
        </code>
        , binds keyboard handlers, and renders only the scaled canvas — no rail, no header.
      </p>
      <div style={{ height: 48 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        {keys.map((k, i) => (
          <div
            key={k.k}
            style={{
              background: surface,
              border: `1px solid ${rule}`,
              borderRadius: 10,
              padding: '24px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              animation: `osa-rise 500ms cubic-bezier(.2,.7,.3,1) ${300 + i * 100}ms both`,
            }}
          >
            <kbd
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 64,
                height: 56,
                padding: '0 14px',
                fontFamily: 'var(--osd-font-display)',
                fontSize: 26,
                fontWeight: 700,
                color: k.tint,
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${k.tint}80`,
                borderRadius: 6,
                boxShadow: `0 2px 0 ${k.tint}30, 0 0 18px ${k.tint}30`,
                animation: i === 0 ? 'osa-glow 2.4s ease-in-out infinite' : undefined,
              }}
            >
              {k.k}
            </kbd>
            <span style={{ fontSize: 24, color: text2, lineHeight: 1.3 }}>{k.label}</span>
          </div>
        ))}
      </div>
      <Footer section="tools" />
    </div>
  );
};

const Cli: Page = () => {
  const cmds = [
    {
      cmd: 'open-slide dev',
      desc: 'createServer() → Vite dev with the plugin',
      tint: 'var(--osd-accent)',
    },
    { cmd: 'open-slide build', desc: 'viteBuild() → static SPA in dist/', tint: mint },
    { cmd: 'open-slide preview', desc: 'serve dist/ for local check', tint: warm },
    {
      cmd: 'npx @open-slide/cli init',
      desc: 'scaffold a new project from packages/cli/templates/react/',
      tint: violet,
    },
  ];
  return (
    <div style={{ ...fill, padding: '120px 100px' }}>
      <style>{keyframes}</style>
      <Eyebrow>15 · tools</Eyebrow>
      <div style={{ height: 28 }} />
      <Heading size={84}>The CLI is a thin Vite wrapper.</Heading>
      <div style={{ height: 24 }} />
      <p style={{ fontSize: 30, color: text2, lineHeight: 1.5, margin: 0, maxWidth: 1700 }}>
        All the cleverness lives in the plugin. The CLI just builds a config, hands it to Vite, and
        gets out of the way.
        <code style={{ fontFamily: 'var(--osd-font-display)', color: mint }}> dist/</code> is a
        static SPA — host it anywhere.
      </p>
      <div style={{ height: 40 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cmds.map((c, i) => (
          <div
            key={c.cmd}
            style={{
              display: 'grid',
              gridTemplateColumns: '480px 1fr',
              gap: 32,
              alignItems: 'center',
              padding: '22px 28px',
              background: surface,
              border: `1px solid ${rule}`,
              borderLeft: `3px solid ${c.tint}`,
              borderRadius: 8,
              animation: `osa-fadeUp 500ms ease-out ${300 + i * 130}ms both`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <span style={{ color: c.tint, fontFamily: 'var(--osd-font-display)', fontSize: 26 }}>
                $
              </span>
              <code style={{ fontFamily: 'var(--osd-font-display)', fontSize: 30, color: text2 }}>
                {c.cmd}
              </code>
            </div>
            <span style={{ fontSize: 26, color: text2, lineHeight: 1.4 }}>{c.desc}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 24 }} />
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 22,
          color: muted,
          padding: '14px 24px',
          border: `1px dashed ${rule}`,
          borderRadius: 8,
          maxWidth: 'fit-content',
          animation: 'osa-fadeIn 600ms ease-out 1200ms both',
        }}
      >
        <span style={{ color: 'var(--osd-accent)' }}>›</span> per-slide chunks come for free from{' '}
        <span style={{ color: mint }}>import()</span> — Vite handles splitting.
      </div>
      <Footer section="tools" />
    </div>
  );
};

const Closing: Page = () => {
  const recap = [
    { tint: 'var(--osd-accent)', title: 'discovery', body: 'fast-glob → 3 virtual modules' },
    { tint: mint, title: 'plugin', body: 'four hooks, no compiler hacks' },
    { tint: warm, title: 'render', body: '1920×1080 canvas, transform: scale' },
    { tint: violet, title: 'tools', body: 'design AST, inspector, present mode' },
  ];
  return (
    <div style={{ ...fill, padding: '120px 100px' }}>
      <style>{keyframes}</style>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: -300,
          background:
            'radial-gradient(closest-side at 80% 40%, rgba(132,255,174,0.10), transparent 60%), radial-gradient(closest-side at 20% 80%, rgba(110,231,255,0.12), transparent 60%)',
          animation: 'osa-bgDrift 14s ease-in-out infinite',
          backgroundSize: '200% 200%',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative' }}>
        <Eyebrow>16 · closing</Eyebrow>
        <div style={{ height: 36 }} />
        <h1
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 140,
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            margin: 0,
            animation: 'osa-fadeUp 700ms ease-out 200ms both',
          }}
        >
          That's the whole machine.
        </h1>
        <div style={{ height: 36 }} />
        <p
          style={{
            fontSize: 36,
            lineHeight: 1.5,
            color: text2,
            maxWidth: 1500,
            margin: 0,
            animation: 'osa-fadeUp 700ms ease-out 500ms both',
          }}
        >
          A globber. Three virtual modules. Four plugin hooks. One scaled canvas. Everything else is
          React you wrote yourself.
        </p>
        <div style={{ height: 64 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {recap.map((r, i) => (
            <div
              key={r.title}
              style={{
                padding: '24px 24px',
                background: surface,
                border: `1px solid ${rule}`,
                borderTop: `3px solid ${r.tint}`,
                borderRadius: 8,
                animation: `osa-rise 600ms cubic-bezier(.2,.7,.3,1) ${800 + i * 160}ms both`,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--osd-font-display)',
                  fontSize: 20,
                  color: r.tint,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                {r.title}
              </div>
              <div style={{ fontSize: 26, color: text2, lineHeight: 1.4 }}>{r.body}</div>
            </div>
          ))}
        </div>
      </div>
      <Footer section="closing" />
    </div>
  );
};

export const meta: SlideMeta = { title: 'Inside open-slide', createdAt: '2026-05-05T17:45:52Z' };

export default [
  Cover,
  Agenda,
  MentalModel,
  FileContract,
  Discovery,
  VirtualModules,
  VitePluginHooks,
  RenderPipeline,
  CanvasScaling,
  HotReload,
  DesignSystemPage,
  DesignPanelWrite,
  Inspector,
  PresentMode,
  Cli,
  Closing,
] satisfies Page[];
