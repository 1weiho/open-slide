import type { Page, SlideMeta } from '@open-slide/core';

const palette = {
  bg: '#FAFAFA',
  text: '#111111',
  muted: '#8A8A8A',
} as const;

const fontStack = '"SF Pro Display", "Inter", -apple-system, system-ui, sans-serif';

const fill = {
  width: '100%',
  height: '100%',
  background: palette.bg,
  color: palette.text,
  fontFamily: fontStack,
  position: 'relative' as const,
  overflow: 'hidden' as const,
};

const styles = `
  @keyframes zn-fade-up {
    0% { opacity: 0; transform: translate3d(0, 24px, 0); }
    100% { opacity: 1; transform: translate3d(0, 0, 0); }
  }
  @keyframes zn-fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  @keyframes zn-tracking-breathe {
    0% { letter-spacing: 0.4em; opacity: 0; }
    25% { opacity: 1; }
    100% { letter-spacing: 0.0em; opacity: 1; }
  }
  @keyframes zn-line-draw {
    0% { transform: scaleX(0); }
    100% { transform: scaleX(1); }
  }
  @keyframes zn-parallax-drift {
    0% { transform: translate3d(0, -24px, 0); }
    100% { transform: translate3d(0, 24px, 0); }
  }
  @keyframes zn-dot-breathe {
    0%, 100% { opacity: 0.25; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.15); }
  }
  @keyframes zn-mark-rise {
    0% { opacity: 0; letter-spacing: 1.2em; transform: scale(0.92); }
    60% { opacity: 1; }
    100% { opacity: 1; letter-spacing: 0.6em; transform: scale(1); }
  }

  .zn-page { animation: zn-fade-in 1.2s ease-out both; }
  .zn-easing { animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1); }

  .zn-bg-numeral {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    color: rgba(17, 17, 17, 0.04);
    font-size: 1100px;
    font-weight: 200;
    letter-spacing: -0.04em;
    line-height: 1;
    animation: zn-parallax-drift 8s ease-in-out infinite alternate, zn-fade-in 2s ease-out both;
  }

  .zn-hero-word {
    font-size: 220px;
    font-weight: 200;
    line-height: 1;
    letter-spacing: 0.0em;
    animation: zn-tracking-breathe 2.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .zn-eyebrow {
    font-size: 22px;
    font-weight: 400;
    color: ${palette.muted};
    letter-spacing: 0.4em;
    text-transform: uppercase;
    animation: zn-fade-up 1.6s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: 0.6s;
  }

  .zn-caption {
    font-size: 24px;
    font-weight: 400;
    color: ${palette.muted};
    letter-spacing: 0.32em;
    text-transform: uppercase;
    animation: zn-fade-up 1.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .zn-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${palette.text};
    animation: zn-dot-breathe 3.2s ease-in-out infinite;
  }

  .zn-line {
    height: 1px;
    background: ${palette.text};
    transform-origin: left center;
    animation: zn-line-draw 1.8s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .zn-word {
    display: inline-block;
    opacity: 0;
    animation: zn-fade-up 1.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .zn-mark {
    font-size: 200px;
    font-weight: 200;
    line-height: 1;
    color: ${palette.text};
    animation: zn-mark-rise 2.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .zn-page-num {
    position: absolute;
    bottom: 80px;
    right: 160px;
    font-size: 22px;
    color: ${palette.muted};
    letter-spacing: 0.3em;
    animation: zn-fade-in 2s ease-out both;
    animation-delay: 1.2s;
  }
`;

const Cover: Page = () => (
  <div className="zn-page" style={fill}>
    <style>{styles}</style>

    <div className="zn-bg-numeral" aria-hidden>01</div>

    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 80,
      }}
    >
      <div className="zn-eyebrow">A quiet study</div>

      <h1 className="zn-hero-word" style={{ margin: 0 }}>
        Breathe.
      </h1>

      <div
        className="zn-dot"
        style={{ marginTop: 24 }}
        aria-hidden
      />
    </div>

    <div className="zn-page-num">01 / 03</div>
  </div>
);

const haiku = [
  ['Less', 'is', 'not', 'absence.'],
  ['It', 'is', 'attention,', 'made', 'visible.'],
  ['Stay', 'with', 'the', 'space.'],
];

const Manifesto: Page = () => {
  let wordCounter = 0;
  return (
    <div className="zn-page" style={fill}>
      <style>{styles}</style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '0 200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div className="zn-eyebrow" style={{ marginBottom: 96 }}>
          Manifesto
        </div>

        <div
          style={{
            fontSize: 72,
            fontWeight: 200,
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
            color: palette.text,
            maxWidth: 1400,
          }}
        >
          {haiku.map((line, lineIdx) => (
            <div key={lineIdx} style={{ display: 'block' }}>
              {line.map((word, wIdx) => {
                const delay = 0.9 + wordCounter * 0.12;
                wordCounter += 1;
                return (
                  <span
                    key={wIdx}
                    className="zn-word"
                    style={{
                      animationDelay: `${delay}s`,
                      marginRight: wIdx === line.length - 1 ? 0 : 24,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        <div
          className="zn-line"
          style={{
            marginTop: 120,
            width: '100%',
            maxWidth: 1520,
            animationDelay: '2.6s',
          }}
        />

        <div
          className="zn-caption"
          style={{
            marginTop: 40,
            animationDelay: '3.2s',
          }}
        >
          Three lines. Nothing more.
        </div>
      </div>

      <div className="zn-page-num">02 / 03</div>
    </div>
  );
};

const Closing: Page = () => (
  <div className="zn-page" style={fill}>
    <style>{styles}</style>

    <div className="zn-bg-numeral" aria-hidden>03</div>

    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 96,
      }}
    >
      <div className="zn-mark" aria-hidden>
        —
      </div>

      <div
        className="zn-line"
        style={{
          width: 240,
          animationDelay: '1.4s',
        }}
      />

      <div
        className="zn-caption"
        style={{
          animationDelay: '2.0s',
        }}
      >
        Thank you for the silence.
      </div>
    </div>

    <div className="zn-page-num">03 / 03</div>
  </div>
);

export const meta: SlideMeta = { title: 'Motion · Zen' };
export default [Cover, Manifesto, Closing] satisfies Page[];
