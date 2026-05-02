import type { ReactNode } from 'react';
import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';
import vercelMark from './assets/vercel.svg';
import nextMark from './assets/next-js.svg';

export const design: DesignSystem = {
  palette: { bg: '#ffffff', text: '#000000', accent: '#ff0080' },
  fonts: {
    display: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    body: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  },
  typeScale: { hero: 176, body: 28 },
  radius: 12,
};

const palette = {
  bg: '#ffffff',
  text: '#000000',
  muted: '#666666',
  subtle: '#a1a1a1',
  border: '#eaeaea',
  surface: '#fafafa',
  surfaceAlt: '#f5f5f5',
  accent: '#0070f3',
  cyan: '#50e3c2',
  pink: '#ff0080',
  amber: '#f5a623',
  green: '#0cce6b',
  purple: '#7928ca',
};

const fontMono = "'Geist Mono', 'SF Mono', Menlo, Consolas, monospace";

const fill = {
  width: '100%',
  height: '100%',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
  position: 'relative' as const,
  overflow: 'hidden' as const,
  boxSizing: 'border-box' as const,
};

const Style = () => (
  <style>{`
    @keyframes ppr-fade-up {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes ppr-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes ppr-blink {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }
    @keyframes ppr-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes ppr-pulse {
      0%, 100% { opacity: 0.55; }
      50% { opacity: 1; }
    }
    @keyframes ppr-gradient-shift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    @keyframes ppr-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    @keyframes ppr-stream {
      0% { transform: translateX(-30px); opacity: 0; }
      100% { transform: translateX(0); opacity: 1; }
    }
    @keyframes ppr-arrow {
      0% { transform: translateX(0); opacity: 1; }
      100% { transform: translateX(40px); opacity: 0; }
    }
    @keyframes ppr-scan {
      0% { left: 0; }
      100% { left: 100%; }
    }
  `}</style>
);

const Logo = ({ size = 24 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.5 }}>
    <img
      src={vercelMark}
      alt="Vercel"
      style={{ height: size * 0.85, width: 'auto', display: 'block' }}
    />
    <span style={{ fontSize: size, fontWeight: 700, letterSpacing: '-0.02em' }}>Vercel</span>
  </div>
);

const Footer = ({ page, total }: { page: number; total: number }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 56,
      left: 120,
      right: 120,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 20,
      fontFamily: fontMono,
      color: palette.subtle,
      borderTop: `1px solid ${palette.border}`,
      paddingTop: 22,
    }}
  >
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <img src={nextMark} alt="Next.js" style={{ height: 22, width: 22, display: 'block' }} />
      <span>Next.js · partial pre-rendering &amp; 'use cache'</span>
    </span>
    <span>
      {String(page).padStart(2, '0')} / {String(total).padStart(2, '0')}
    </span>
  </div>
);

const Eyebrow = ({ index, label }: { index: string; label: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      fontSize: 22,
      fontFamily: fontMono,
      color: palette.muted,
      letterSpacing: '0.02em',
    }}
  >
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: palette.text,
      }}
    />
    <span style={{ fontWeight: 600, color: palette.text }}>{index}</span>
    <span style={{ color: palette.border }}>—</span>
    <span>{label}</span>
  </div>
);

const TOTAL = 8;

const Code = ({ children, fontSize = 20 }: { children: ReactNode; fontSize?: number }) => (
  <pre
    style={{
      margin: 0,
      padding: 24,
      background: palette.surface,
      border: `1px solid ${palette.border}`,
      borderRadius: 'var(--osd-radius)',
      fontFamily: fontMono,
      fontSize,
      lineHeight: 1.45,
      color: palette.text,
      overflow: 'hidden',
      whiteSpace: 'pre',
    }}
  >
    {children}
  </pre>
);

const kw = (s: string) => <span style={{ color: palette.pink }}>{s}</span>;
const fn = (s: string) => <span style={{ color: palette.accent }}>{s}</span>;
const str = (s: string) => <span style={{ color: palette.green }}>{s}</span>;
const com = (s: string) => <span style={{ color: palette.subtle, fontStyle: 'italic' }}>{s}</span>;
const tag = (s: string) => <span style={{ color: palette.accent }}>{s}</span>;

// ─────────────────────────────────────────────────────────────────────────────
// 01 — Cover
// ─────────────────────────────────────────────────────────────────────────────
const Cover: Page = () => (
  <div
    style={{
      ...fill,
      padding: '0 120px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Style />

    <div style={{ position: 'absolute', top: 72, left: 120 }}>
      <Logo size={28} />
    </div>
    <div
      style={{
        position: 'absolute',
        top: 78,
        right: 120,
        fontSize: 22,
        fontFamily: fontMono,
        color: palette.muted,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <img src={nextMark} alt="Next.js" style={{ height: 26, width: 26, display: 'block' }} />
      <span>Next.js · 2026</span>
    </div>

    <div style={{ animation: 'ppr-fade-up 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both' }}>
      <div
        style={{
          fontSize: 28,
          fontFamily: fontMono,
          color: palette.muted,
          marginBottom: 32,
          letterSpacing: '0.02em',
        }}
      >
        rendering, reimagined.
      </div>
      <h1
        style={{
          fontSize: 'var(--osd-size-hero)',
          fontWeight: 700,
          margin: 0,
          lineHeight: 0.92,
          letterSpacing: '-0.045em',
        }}
      >
        Partial
        <br />
        Pre-Rendering
      </h1>
      <div
        style={{
          marginTop: 48,
          fontSize: 38,
          color: palette.muted,
          fontWeight: 400,
          maxWidth: 1400,
          lineHeight: 1.4,
        }}
      >
        Plus{' '}
        <code
          style={{
            fontFamily: fontMono,
            color: palette.text,
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            padding: '4px 14px',
            borderRadius: 10,
            fontSize: 32,
          }}
        >
          'use cache'
        </code>
        — the speed of static, the freshness of dynamic, in one request.
      </div>
    </div>

    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 6,
        background: `linear-gradient(90deg, ${palette.pink}, ${palette.purple}, ${palette.accent}, ${palette.purple}, ${palette.pink})`,
        backgroundSize: '300% 100%',
        animation: 'ppr-gradient-shift 7s ease-in-out infinite',
      }}
    />

    <div
      style={{
        position: 'absolute',
        bottom: 56,
        left: 120,
        right: 120,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        fontSize: 20,
        fontFamily: fontMono,
        color: palette.subtle,
      }}
    >
      <span style={{ color: palette.text, fontWeight: 600 }}>
        <span style={{ animation: 'ppr-blink 1.2s steps(1) infinite' }}>▍</span> ready when you are
      </span>
      <span>01 / {String(TOTAL).padStart(2, '0')}</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 02 — The old trade-off
// ─────────────────────────────────────────────────────────────────────────────
const TradeOff: Page = () => {
  const Card = ({
    title,
    tag,
    color,
    pros,
    cons,
    delay,
  }: {
    title: string;
    tag: string;
    color: string;
    pros: string[];
    cons: string;
    delay: number;
  }) => (
    <div
      style={{
        flex: 1,
        background: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 20,
        padding: 36,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        animation: `ppr-fade-up 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s both`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span
          style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: color,
          }}
        />
        <span
          style={{
            fontSize: 22,
            fontFamily: fontMono,
            color: palette.muted,
            letterSpacing: '0.04em',
          }}
        >
          {tag}
        </span>
      </div>
      <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 24, fontSize: 26, lineHeight: 1.5 }}>
        {pros.map((p) => (
          <li key={p} style={{ color: palette.text }}>
            {p}
          </li>
        ))}
      </ul>
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 16,
          borderTop: `1px dashed ${palette.border}`,
          fontSize: 22,
          color: palette.muted,
          fontFamily: fontMono,
        }}
      >
        ✕ {cons}
      </div>
    </div>
  );

  return (
    <div style={{ ...fill, padding: '120px 120px 0' }}>
      <Style />
      <div style={{ animation: 'ppr-fade-up 0.6s ease-out both' }}>
        <Eyebrow index="02" label="The old trade-off" />
        <h2
          style={{
            fontSize: 84,
            fontWeight: 700,
            margin: '28px 0 0',
            letterSpacing: '-0.035em',
            lineHeight: 1.0,
          }}
        >
          Static <span style={{ color: palette.muted }}>or</span> dynamic,
          <br />
          pick one?
        </h2>
        <p
          style={{
            fontSize: 'var(--osd-size-body)',
            color: palette.muted,
            margin: '24px 0 0',
            maxWidth: 1300,
            lineHeight: 1.5,
          }}
        >
          One route, one mode. Trade personalization for speed, or trade cache for freshness.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 32, marginTop: 48 }}>
        <Card
          title="Static"
          tag="SSG · ISR"
          color={palette.cyan}
          pros={['Edge CDN cache hits', 'Near-zero TTFB', 'Cheap and predictable']}
          cons="No personalization. Content goes stale."
          delay={0.15}
        />
        <Card
          title="Dynamic"
          tag="SSR · 'force-dynamic'"
          color={palette.pink}
          pros={['Recomputed per request', 'Reads cookies & headers', 'Always fresh']}
          cons="Slow. Hard to scale. Origin takes the hit."
          delay={0.3}
        />
      </div>

      <Footer page={2} total={TOTAL} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 03 — PPR concept: static shell + dynamic holes
// ─────────────────────────────────────────────────────────────────────────────
const PPRConcept: Page = () => {
  const Hole = ({
    top,
    left,
    width,
    height,
    label,
    delay,
  }: {
    top: number;
    left: number;
    width: number;
    height: number;
    label: string;
    delay: number;
  }) => (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width,
        height,
        borderRadius: 'var(--osd-radius)',
        background: `linear-gradient(110deg, ${palette.surface} 8%, #f0f0f0 18%, ${palette.surface} 33%)`,
        backgroundSize: '200% 100%',
        border: `1.5px dashed ${palette.pink}`,
        animation: `ppr-shimmer 2.4s linear infinite, ppr-fade ${0.6}s ease-out ${delay}s both`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fontMono,
        fontSize: 18,
        color: palette.pink,
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </div>
  );

  const StaticBlock = ({
    top,
    left,
    width,
    height,
  }: {
    top: number;
    left: number;
    width: number;
    height: number;
  }) => (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width,
        height,
        borderRadius: 8,
        background: palette.surfaceAlt,
      }}
    />
  );

  return (
    <div style={{ ...fill, padding: '120px 120px 0' }}>
      <Style />
      <div style={{ animation: 'ppr-fade-up 0.6s ease-out both' }}>
        <Eyebrow index="03" label="The idea" />
        <h2
          style={{
            fontSize: 80,
            fontWeight: 700,
            margin: '28px 0 0',
            letterSpacing: '-0.035em',
            lineHeight: 1.0,
          }}
        >
          One static shell.
          <br />A few dynamic holes.
        </h2>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 64,
          marginTop: 48,
          alignItems: 'flex-start',
        }}
      >
        {/* Diagram */}
        <div
          style={{
            position: 'relative',
            width: 760,
            height: 520,
            background: palette.bg,
            border: `1.5px solid ${palette.text}`,
            borderRadius: 20,
            padding: 32,
            boxSizing: 'border-box',
            animation: 'ppr-fade-up 0.7s ease-out 0.15s both',
          }}
        >
          {/* static header bar */}
          <StaticBlock top={32} left={32} width={696} height={28} />
          {/* static title */}
          <StaticBlock top={84} left={32} width={420} height={44} />
          {/* static subtitle */}
          <StaticBlock top={144} left={32} width={300} height={20} />

          {/* dynamic hole — cart */}
          <Hole top={32} left={540} width={188} height={52} label="<Cart/>" delay={0.4} />

          {/* dynamic hole — recommendations */}
          <Hole
            top={200}
            left={32}
            width={696}
            height={140}
            label="<Recommendations/>"
            delay={0.55}
          />

          {/* static footer */}
          <StaticBlock top={372} left={32} width={696} height={20} />
          <StaticBlock top={408} left={32} width={520} height={20} />
          <StaticBlock top={444} left={32} width={400} height={20} />

          {/* legend overlay corner */}
          <div
            style={{
              position: 'absolute',
              top: -16,
              left: 32,
              background: palette.bg,
              padding: '0 12px',
              fontSize: 18,
              fontFamily: fontMono,
              color: palette.muted,
            }}
          >
            page.tsx
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
            paddingTop: 24,
            animation: 'ppr-fade-up 0.7s ease-out 0.3s both',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  background: palette.surfaceAlt,
                  borderRadius: 4,
                }}
              />
              <span style={{ fontSize: 32, fontWeight: 700 }}>Static shell</span>
            </div>
            <p style={{ margin: 0, fontSize: 26, color: palette.muted, lineHeight: 1.55 }}>
              Prerendered at build. Served straight from the edge CDN. Instant.
            </p>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  border: `1.5px dashed ${palette.pink}`,
                  borderRadius: 4,
                }}
              />
              <span style={{ fontSize: 32, fontWeight: 700 }}>Dynamic holes</span>
            </div>
            <p style={{ margin: 0, fontSize: 26, color: palette.muted, lineHeight: 1.55 }}>
              Wrap them in{' '}
              <code style={{ fontFamily: fontMono, color: palette.text }}>&lt;Suspense&gt;</code>.
              Streamed in from origin.
            </p>
          </div>

          <div
            style={{
              marginTop: 'auto',
              padding: 20,
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 'var(--osd-radius)',
              fontSize: 24,
              fontFamily: fontMono,
              color: palette.muted,
            }}
          >
            <span style={{ color: palette.text, fontWeight: 600 }}>One request.</span> Two speeds.
          </div>
        </div>
      </div>

      <Footer page={3} total={TOTAL} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 04 — PPR in code
// ─────────────────────────────────────────────────────────────────────────────
const PPRCode: Page = () => (
  <div style={{ ...fill, padding: '120px 120px 0' }}>
    <Style />
    <div style={{ animation: 'ppr-fade-up 0.6s ease-out both' }}>
      <Eyebrow index="04" label="In code" />
      <h2
        style={{
          fontSize: 88,
          fontWeight: 700,
          margin: '36px 0 0',
          letterSpacing: '-0.035em',
          lineHeight: 1.0,
        }}
      >
        Suspense is the boundary.
      </h2>
      <p
        style={{
          fontSize: 'var(--osd-size-body)',
          color: palette.muted,
          margin: '24px 0 0',
          maxWidth: 1300,
        }}
      >
        Inside the boundary: dynamic. Outside: static. Next.js walks the tree and decides.
      </p>
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: 48,
        marginTop: 56,
        alignItems: 'start',
      }}
    >
      <div style={{ animation: 'ppr-fade-up 0.7s ease-out 0.2s both' }}>
        <Code fontSize={20}>
          {com('// app/page.tsx')}
          {'\n'}
          {kw('export default function')} {fn('Page')}() {'{'}
          {'\n'}
          {'  '}
          {kw('return')} ({'\n'}
          {'    '}&lt;{tag('main')}&gt;
          {'\n'}
          {'      '}&lt;{tag('Header')} /&gt; {com('// static, prerendered')}
          {'\n'}
          {'      '}&lt;{tag('ProductInfo')} /&gt; {com('// static')}
          {'\n'}
          {'\n'}
          {'      '}&lt;{tag('Suspense')} {fn('fallback')}={'{'}&lt;{tag('CartSkeleton')} /&gt;{'}'}
          &gt;
          {'\n'}
          {'        '}&lt;{tag('Cart')} /&gt; {com('// dynamic, streamed')}
          {'\n'}
          {'      '}&lt;/{tag('Suspense')}&gt;
          {'\n'}
          {'\n'}
          {'      '}&lt;{tag('Footer')} /&gt; {com('// static')}
          {'\n'}
          {'    '}&lt;/{tag('main')}&gt;
          {'\n'}
          {'  '});
          {'\n'}
          {'}'}
        </Code>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          animation: 'ppr-fade-up 0.7s ease-out 0.35s both',
        }}
      >
        <div
          style={{
            padding: '24px 28px',
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 14,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontFamily: fontMono,
              color: palette.cyan,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            ◆ STATIC
          </div>
          <div style={{ fontSize: 26, lineHeight: 1.5 }}>
            Everything <em style={{ fontStyle: 'normal', fontWeight: 600 }}>outside</em> a Suspense
            boundary.
          </div>
        </div>

        <div
          style={{
            padding: '24px 28px',
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 14,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontFamily: fontMono,
              color: palette.pink,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            ◇ DYNAMIC
          </div>
          <div style={{ fontSize: 26, lineHeight: 1.5 }}>
            The Suspense fallback is prerendered into the shell. The real content streams in.
          </div>
        </div>

        <div
          style={{
            padding: '20px 24px',
            background: palette.text,
            color: palette.bg,
            borderRadius: 14,
            fontSize: 22,
            fontFamily: fontMono,
            lineHeight: 1.5,
          }}
        >
          experimental.ppr = <span style={{ color: palette.cyan }}>'incremental'</span>
        </div>
      </div>
    </div>

    <Footer page={4} total={TOTAL} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 05 — 'use cache'
// ─────────────────────────────────────────────────────────────────────────────
const UseCache: Page = () => (
  <div style={{ ...fill, padding: '120px 120px 0' }}>
    <Style />
    <div style={{ animation: 'ppr-fade-up 0.6s ease-out both' }}>
      <Eyebrow index="05" label="The directive" />
      <h2
        style={{
          fontSize: 132,
          fontWeight: 700,
          margin: '32px 0 0',
          letterSpacing: '-0.045em',
          lineHeight: 0.95,
          fontFamily: fontMono,
        }}
      >
        '<span style={{ color: 'var(--osd-accent)' }}>use cache</span>'
      </h2>
      <p
        style={{
          fontSize: 32,
          color: palette.muted,
          margin: '32px 0 0',
          maxWidth: 1400,
          lineHeight: 1.45,
        }}
      >
        Not an API call, not a wrapper — just a{' '}
        <em style={{ fontStyle: 'normal', fontWeight: 600, color: palette.text }}>directive</em>.
        The compiler sees it and turns the whole function, component, or route into a cacheable
        unit.
      </p>
    </div>

    <div
      style={{
        marginTop: 56,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 32,
      }}
    >
      <div style={{ animation: 'ppr-fade-up 0.7s ease-out 0.2s both' }}>
        <div
          style={{
            fontSize: 22,
            fontFamily: fontMono,
            color: palette.muted,
            marginBottom: 16,
            letterSpacing: '0.04em',
          }}
        >
          BEFORE — manual key + revalidate
        </div>
        <Code fontSize={20}>
          {kw('const')} product = {kw('await')} {fn('unstable_cache')}({'\n'}
          {'  '}() =&gt; db.products.{fn('find')}(id),
          {'\n'}
          {'  '}[{str("'product'")}, id],
          {'\n'}
          {'  '}
          {'{ '}revalidate: {str('3600')}, tags: [{str("'product'")}] {'}'}
          {'\n'}
          )();
        </Code>
      </div>

      <div style={{ animation: 'ppr-fade-up 0.7s ease-out 0.35s both' }}>
        <div
          style={{
            fontSize: 22,
            fontFamily: fontMono,
            color: palette.pink,
            marginBottom: 16,
            letterSpacing: '0.04em',
          }}
        >
          AFTER — just declare it
        </div>
        <Code fontSize={20}>
          {kw('async function')} {fn('getProduct')}(id: {kw('string')}) {'{'}
          {'\n'}
          {'  '}
          <span style={{ color: palette.pink }}>'use cache'</span>
          {'\n'}
          {'  '}
          {fn('cacheLife')}({str("'hours'")});
          {'\n'}
          {'  '}
          {fn('cacheTag')}({str('`product:${id}`')});
          {'\n'}
          {'\n'}
          {'  '}
          {kw('return')} db.products.{fn('find')}(id);
          {'\n'}
          {'}'}
        </Code>
      </div>
    </div>

    <div
      style={{
        marginTop: 40,
        display: 'flex',
        gap: 16,
        fontSize: 22,
        fontFamily: fontMono,
        color: palette.muted,
        animation: 'ppr-fade 0.8s ease-out 0.6s both',
      }}
    >
      <span style={{ color: palette.text }}>→</span>
      <span>
        Args become the cache key · return values auto-serialized · backed by Next.js & Vercel Data
        Cache.
      </span>
    </div>

    <Footer page={5} total={TOTAL} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 06 — Where can you put it
// ─────────────────────────────────────────────────────────────────────────────
const CacheScopes: Page = () => {
  const Scope = ({
    label,
    title,
    code,
    delay,
  }: {
    label: string;
    title: string;
    code: ReactNode;
    delay: number;
  }) => (
    <div
      style={{
        flex: 1,
        background: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 18,
        padding: 36,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        animation: `ppr-fade-up 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s both`,
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontFamily: fontMono,
          color: palette.muted,
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em' }}>{title}</div>
      <pre
        style={{
          margin: 0,
          padding: '20px 22px',
          background: palette.bg,
          border: `1px solid ${palette.border}`,
          borderRadius: 10,
          fontFamily: fontMono,
          fontSize: 22,
          lineHeight: 1.55,
          whiteSpace: 'pre',
          color: palette.text,
          flex: 1,
        }}
      >
        {code}
      </pre>
    </div>
  );

  return (
    <div style={{ ...fill, padding: '120px 120px 0' }}>
      <Style />
      <div style={{ animation: 'ppr-fade-up 0.6s ease-out both' }}>
        <Eyebrow index="06" label="Where it goes" />
        <h2
          style={{
            fontSize: 88,
            fontWeight: 700,
            margin: '36px 0 0',
            letterSpacing: '-0.035em',
            lineHeight: 1.0,
          }}
        >
          Three places it lives.
        </h2>
        <p style={{ fontSize: 'var(--osd-size-body)', color: palette.muted, margin: '20px 0 0' }}>
          Function, component, or an entire route — the directive knows them all.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 28, marginTop: 56 }}>
        <Scope
          label="01 · FUNCTION"
          title="Fine-grained"
          delay={0.15}
          code={
            <>
              {kw('async function')} {fn('getUser')}(id) {'{'}
              {'\n'}
              {'  '}
              <span style={{ color: palette.pink }}>'use cache'</span>
              {'\n'}
              {'  '}
              {kw('return')} db.{fn('find')}(id);
              {'\n'}
              {'}'}
            </>
          }
        />
        <Scope
          label="02 · COMPONENT"
          title="UI block"
          delay={0.3}
          code={
            <>
              {kw('async function')} {fn('Sidebar')}() {'{'}
              {'\n'}
              {'  '}
              <span style={{ color: palette.pink }}>'use cache'</span>
              {'\n'}
              {'  '}
              {kw('return')} &lt;{tag('nav')}&gt;…&lt;/{tag('nav')}&gt;;
              {'\n'}
              {'}'}
            </>
          }
        />
        <Scope
          label="03 · ROUTE"
          title="Whole file"
          delay={0.45}
          code={
            <>
              {com('// app/blog/page.tsx')}
              {'\n'}
              <span style={{ color: palette.pink }}>'use cache'</span>
              {'\n'}
              {'\n'}
              {kw('export default function')} {fn('Page')}() {'{'}
              {'\n'}
              {'  '}…{'\n'}
              {'}'}
            </>
          }
        />
      </div>

      <div
        style={{
          marginTop: 40,
          padding: '22px 28px',
          background: palette.text,
          color: palette.bg,
          borderRadius: 14,
          fontSize: 24,
          fontFamily: fontMono,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          animation: 'ppr-fade 0.8s ease-out 0.7s both',
        }}
      >
        <span style={{ color: palette.cyan }}>cacheLife()</span>
        <span style={{ color: palette.subtle }}>—</span>
        <span>TTL profile（minutes / hours / days / max）</span>
        <span style={{ flex: 1 }} />
        <span style={{ color: palette.pink }}>cacheTag()</span>
        <span style={{ color: palette.subtle }}>—</span>
        <span>tag-based revalidation</span>
      </div>

      <Footer page={6} total={TOTAL} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 07 — Request lifecycle
// ─────────────────────────────────────────────────────────────────────────────
const Lifecycle: Page = () => {
  const Step = ({
    n,
    title,
    sub,
    accent,
    delay,
  }: {
    n: string;
    title: string;
    sub: string;
    accent: string;
    delay: number;
  }) => (
    <div
      style={{
        flex: 1,
        background: palette.bg,
        border: `1.5px solid ${palette.border}`,
        borderRadius: 16,
        padding: '28px 28px 32px',
        position: 'relative',
        animation: `ppr-fade-up 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s both`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: 24,
          background: palette.bg,
          padding: '0 10px',
          fontSize: 20,
          fontFamily: fontMono,
          color: accent,
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}
      >
        {n}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 22, color: palette.muted, lineHeight: 1.5, marginTop: 12 }}>
        {sub}
      </div>
    </div>
  );

  const Arrow = ({ delay }: { delay: number }) => (
    <div
      style={{
        width: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        animation: `ppr-fade 0.5s ease-out ${delay}s both`,
      }}
    >
      <div style={{ height: 1.5, width: '100%', background: palette.border }} />
      <div
        style={{
          position: 'absolute',
          right: 0,
          width: 0,
          height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderLeft: `10px solid ${palette.subtle}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: 16,
          height: 6,
          background: palette.text,
          borderRadius: 3,
          animation: `ppr-arrow 1.6s ease-in-out ${delay + 0.4}s infinite`,
        }}
      />
    </div>
  );

  return (
    <div style={{ ...fill, padding: '120px 120px 0' }}>
      <Style />
      <div style={{ animation: 'ppr-fade-up 0.6s ease-out both' }}>
        <Eyebrow index="07" label="Anatomy of a request" />
        <h2
          style={{
            fontSize: 88,
            fontWeight: 700,
            margin: '36px 0 0',
            letterSpacing: '-0.035em',
            lineHeight: 1.0,
          }}
        >
          One request,
          <br />
          two journeys.
        </h2>
      </div>

      <div
        style={{
          marginTop: 80,
          display: 'flex',
          alignItems: 'stretch',
          gap: 4,
        }}
      >
        <Step
          n="REQ"
          title="HTTP GET"
          sub="User hits the edge"
          accent={palette.muted}
          delay={0.15}
        />
        <Arrow delay={0.3} />
        <Step
          n="① INSTANT"
          title="Static shell"
          sub="Served from CDN with fallback skeletons baked in"
          accent={palette.cyan}
          delay={0.35}
        />
        <Arrow delay={0.5} />
        <Step
          n="② STREAM"
          title="Dynamic holes"
          sub="Suspense content streams from origin; 'use cache' hits skip the work"
          accent={palette.pink}
          delay={0.55}
        />
        <Arrow delay={0.75} />
        <Step
          n="DONE"
          title="Hydrated"
          sub="Full page, interactive"
          accent={palette.text}
          delay={0.8}
        />
      </div>

      {/* timeline ruler */}
      <div
        style={{
          marginTop: 56,
          background: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 14,
          padding: '28px 32px',
          position: 'relative',
          overflow: 'hidden',
          animation: 'ppr-fade-up 0.7s ease-out 0.7s both',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 22,
            fontFamily: fontMono,
            color: palette.muted,
            marginBottom: 16,
          }}
        >
          <span>0 ms</span>
          <span>TTFB</span>
          <span>~ first paint</span>
          <span>~ stream complete</span>
        </div>
        <div
          style={{
            position: 'relative',
            height: 16,
            background: palette.border,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '32%',
              background: palette.cyan,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '32%',
              height: '100%',
              width: '68%',
              background: `repeating-linear-gradient(45deg, ${palette.pink} 0, ${palette.pink} 8px, #ff66a8 8px, #ff66a8 16px)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              width: 80,
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              animation: 'ppr-scan 2.4s linear infinite',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 14,
            fontSize: 20,
            fontFamily: fontMono,
          }}
        >
          <span style={{ color: palette.cyan }}>■ static shell · cached</span>
          <span style={{ color: palette.pink }}>■ dynamic stream · maybe cached</span>
        </div>
      </div>

      <Footer page={7} total={TOTAL} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 08 — TL;DR
// ─────────────────────────────────────────────────────────────────────────────
const TLDR: Page = () => {
  const Row = ({ k, v, delay }: { k: string; v: ReactNode; delay: number }) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        alignItems: 'baseline',
        gap: 32,
        padding: '32px 0',
        borderBottom: `1px solid ${palette.border}`,
        animation: `ppr-fade-up 0.6s ease-out ${delay}s both`,
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontFamily: fontMono,
          color: palette.muted,
          letterSpacing: '0.04em',
        }}
      >
        {k}
      </div>
      <div style={{ fontSize: 38, fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.015em' }}>
        {v}
      </div>
    </div>
  );

  return (
    <div style={{ ...fill, padding: '120px 120px 0' }}>
      <Style />
      <div style={{ animation: 'ppr-fade-up 0.6s ease-out both' }}>
        <Eyebrow index="08" label="TL;DR" />
        <h2
          style={{
            fontSize: 112,
            fontWeight: 700,
            margin: '32px 0 0',
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
          }}
        >
          Remember two things.
        </h2>
      </div>

      <div style={{ marginTop: 56 }}>
        <Row
          k="PARTIAL PRE-RENDERING"
          v={
            <>
              One route can have a <span style={{ color: palette.cyan }}>static shell</span> and{' '}
              <span style={{ color: palette.pink }}>dynamic holes</span> at the same time. Suspense
              draws the line.
            </>
          }
          delay={0.15}
        />
        <Row
          k="'use cache'"
          v={
            <>
              One directive turns a function, component, or route into a cacheable unit.
              <code style={{ fontFamily: fontMono }}> cacheLife</code> sets the TTL;
              <code style={{ fontFamily: fontMono }}> cacheTag</code> drives tag-based invalidation.
            </>
          }
          delay={0.3}
        />
        <Row
          k="MENTAL MODEL"
          v={
            <>
              <span style={{ fontStyle: 'italic' }}>
                "The fastest dynamic page is a static one with a few holes."
              </span>
            </>
          }
          delay={0.45}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 140,
          left: 120,
          right: 120,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'ppr-fade 0.8s ease-out 0.8s both',
        }}
      >
        <Logo size={28} />
        <div
          style={{
            fontSize: 22,
            fontFamily: fontMono,
            color: palette.muted,
          }}
        >
          nextjs.org/docs · vercel.com/blog
        </div>
      </div>

      <Footer page={8} total={TOTAL} />
    </div>
  );
};

export const meta: SlideMeta = { title: "Next.js: Partial Pre-Rendering & 'use cache'" };
export default [
  Cover,
  TradeOff,
  PPRConcept,
  PPRCode,
  UseCache,
  CacheScopes,
  Lifecycle,
  TLDR,
] satisfies Page[];
