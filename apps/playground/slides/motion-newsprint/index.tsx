import type { Page, SlideMeta } from '@open-slide/core';

const palette = {
  paper: '#F2EAD3',
  paperDeep: '#EFE7D2',
  ink: '#1A1612',
  red: '#E0573B',
  blue: '#3B5BA5',
  muted: '#7A6F58',
};

const serif = '"Playfair Display", "Times New Roman", Georgia, serif';
const slab = '"Roboto Slab", "Courier New", ui-monospace, monospace';
const body = '"Source Serif Pro", "Georgia", serif';

// Halftone dot pattern via radial-gradient — sized so it tiles & breathes.
const halftone = `radial-gradient(circle at 1px 1px, rgba(26, 22, 18, 0.22) 1px, transparent 1.6px)`;
const halftoneRed = `radial-gradient(circle at 1px 1px, rgba(224, 87, 59, 0.28) 1px, transparent 1.6px)`;

const fill = {
  width: '100%',
  height: '100%',
  position: 'relative' as const,
  overflow: 'hidden' as const,
  background: palette.paper,
  color: palette.ink,
  fontFamily: body,
};

const SharedStyles = () => (
  <style>{`
    @keyframes np-halftone-breathe {
      0%, 100% { background-size: 14px 14px, 14px 14px; opacity: 0.85; }
      50% { background-size: 18px 18px, 18px 18px; opacity: 1; }
    }
    @keyframes np-halftone-breathe-slow {
      0%, 100% { background-size: 22px 22px; opacity: 0.55; }
      50% { background-size: 28px 28px; opacity: 0.75; }
    }
    @keyframes np-offregister {
      0%, 88%, 100% { transform: translate(5px, 4px); }
      90% { transform: translate(2px, 6px); }
      93% { transform: translate(7px, 2px); }
      96% { transform: translate(4px, 5px); }
    }
    @keyframes np-offregister-soft {
      0%, 84%, 100% { transform: translate(4px, 3px); }
      87% { transform: translate(1px, 5px); }
      91% { transform: translate(6px, 1px); }
      95% { transform: translate(3px, 4px); }
    }
    @keyframes np-inkbleed {
      0% { clip-path: inset(0 100% 0 0); opacity: 0; filter: blur(2px); }
      100% { clip-path: inset(0 0 0 0); opacity: 1; filter: blur(0); }
    }
    @keyframes np-inkbleed-right {
      0% { clip-path: inset(0 0 0 100%); opacity: 0; filter: blur(2px); }
      100% { clip-path: inset(0 0 0 0); opacity: 1; filter: blur(0); }
    }
    @keyframes np-rule-draw {
      0% { transform: scaleX(0); }
      100% { transform: scaleX(1); }
    }
    @keyframes np-col-rule-draw {
      0% { transform: scaleY(0); }
      100% { transform: scaleY(1); }
    }
    @keyframes np-fade-up {
      0% { opacity: 0; transform: translateY(24px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes np-fade-in {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes np-dropcap {
      0% { opacity: 0; transform: scale(0.4) rotate(-18deg); }
      70% { opacity: 1; transform: scale(1.08) rotate(3deg); }
      100% { opacity: 1; transform: scale(1) rotate(0deg); }
    }
    @keyframes np-stamp {
      0% { opacity: 0; transform: scale(2.2) rotate(-32deg); filter: blur(6px); }
      55% { opacity: 1; transform: scale(0.86) rotate(-7deg); filter: blur(0); }
      72% { transform: scale(1.06) rotate(-13deg); }
      85% { transform: scale(0.98) rotate(-9deg); }
      100% { opacity: 1; transform: scale(1) rotate(-10deg); }
    }
    @keyframes np-press-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
    @keyframes np-grain-shift {
      0% { background-position: 0 0; }
      100% { background-position: 200px 200px; }
    }

    .np-halftone {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: ${halftone};
      background-size: 14px 14px;
      animation: np-halftone-breathe 6s ease-in-out infinite;
      mix-blend-mode: multiply;
    }
    .np-halftone-soft {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: ${halftone};
      background-size: 22px 22px;
      animation: np-halftone-breathe-slow 9s ease-in-out infinite;
      mix-blend-mode: multiply;
      opacity: 0.6;
    }
    .np-halftone-red {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: ${halftoneRed};
      background-size: 16px 16px;
      animation: np-halftone-breathe 7.5s ease-in-out infinite;
      mix-blend-mode: multiply;
      opacity: 0.55;
    }
    .np-grain {
      position: absolute;
      inset: -50px;
      pointer-events: none;
      background-image: repeating-conic-gradient(
        from 0deg at 50% 50%,
        rgba(26, 22, 18, 0.04) 0deg 1deg,
        transparent 1deg 3deg
      );
      animation: np-grain-shift 8s linear infinite;
      opacity: 0.4;
      mix-blend-mode: multiply;
    }
    .np-offset-shadow {
      position: absolute;
      inset: 0;
      color: ${palette.red};
      animation: np-offregister 3.2s steps(1, end) infinite;
      pointer-events: none;
      mix-blend-mode: multiply;
    }
    .np-offset-shadow-blue {
      position: absolute;
      inset: 0;
      color: ${palette.blue};
      animation: np-offregister-soft 4.1s steps(1, end) infinite;
      pointer-events: none;
      mix-blend-mode: multiply;
    }
  `}</style>
);

// ---------- PAGE 1 — COVER ----------
const Cover: Page = () => (
  <div style={fill}>
    <SharedStyles />
    <div className="np-halftone" />
    <div className="np-grain" />

    {/* Top masthead bar */}
    <div
      style={{
        position: 'absolute',
        top: 80,
        left: 120,
        right: 120,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        animation: 'np-fade-in 1.2s ease-out both',
      }}
    >
      <div
        style={{
          fontFamily: slab,
          fontSize: 22,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: palette.muted,
        }}
      >
        Vol. I &nbsp;·&nbsp; No. 03 &nbsp;·&nbsp; Saturday Edition
      </div>
      <div
        style={{
          fontFamily: slab,
          fontSize: 22,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: palette.muted,
        }}
      >
        Price: Two Bits
      </div>
    </div>

    {/* Hairline rule under masthead bar */}
    <div
      style={{
        position: 'absolute',
        top: 130,
        left: 120,
        right: 120,
        height: 2,
        background: palette.ink,
        transformOrigin: 'left',
        animation: 'np-rule-draw 1.1s cubic-bezier(0.7, 0, 0.3, 1) 0.2s both',
      }}
    />

    {/* MASTHEAD title */}
    <div
      style={{
        position: 'absolute',
        top: 162,
        left: 120,
        right: 120,
        textAlign: 'center',
        fontFamily: serif,
        fontSize: 168,
        fontWeight: 900,
        lineHeight: 1,
        letterSpacing: '-0.01em',
        animation: 'np-fade-in 1.4s ease-out 0.4s both',
      }}
    >
      <span style={{ position: 'relative', display: 'inline-block' }}>
        <span aria-hidden className="np-offset-shadow" style={{ position: 'absolute', inset: 0 }}>
          The Motion Gazette
        </span>
        <span style={{ position: 'relative', color: palette.ink }}>The Motion Gazette</span>
      </span>
    </div>

    {/* Double rule below masthead */}
    <div
      style={{
        position: 'absolute',
        top: 360,
        left: 120,
        right: 120,
        height: 6,
        borderTop: `2px solid ${palette.ink}`,
        borderBottom: `2px solid ${palette.ink}`,
        transformOrigin: 'left',
        animation: 'np-rule-draw 1.0s cubic-bezier(0.7, 0, 0.3, 1) 1.0s both',
      }}
    />

    {/* Dateline / kicker row */}
    <div
      style={{
        position: 'absolute',
        top: 392,
        left: 120,
        right: 120,
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: slab,
        fontSize: 24,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: palette.muted,
        animation: 'np-fade-in 1s ease-out 1.3s both',
      }}
    >
      <span>Late City Final</span>
      <span>Established MMXXVI</span>
      <span>Saturday, April 25, 2026</span>
    </div>

    {/* Drop cap */}
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 560,
        fontFamily: serif,
        fontSize: 360,
        fontWeight: 900,
        lineHeight: 0.85,
        color: palette.red,
        transformOrigin: '50% 60%',
        animation: 'np-dropcap 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) 1.6s both',
        textShadow: `6px 5px 0 ${palette.ink}`,
      }}
    >
      M
    </div>

    {/* Headline — ink-bleed reveal */}
    <div
      style={{
        position: 'absolute',
        left: 480,
        top: 540,
        right: 120,
        fontFamily: serif,
        fontSize: 116,
        fontWeight: 800,
        lineHeight: 1.02,
        letterSpacing: '-0.015em',
        animation: 'np-inkbleed 1.5s cubic-bezier(0.6, 0, 0.2, 1) 1.9s both',
      }}
    >
      Motion Returns
      <br />
      to the Printed Page
    </div>

    {/* Subhead */}
    <div
      style={{
        position: 'absolute',
        left: 480,
        top: 820,
        right: 120,
        fontFamily: body,
        fontStyle: 'italic',
        fontSize: 34,
        lineHeight: 1.4,
        color: palette.muted,
        maxWidth: 1180,
        animation: 'np-fade-up 1s ease-out 2.6s both',
      }}
    >
      A correspondent's report on halftones, off-register ink, and the small joys
      of a print that refuses to sit perfectly still.
    </div>

    {/* Bottom byline rule */}
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: 120,
        right: 120,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: slab,
        fontSize: 22,
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color: palette.muted,
      }}
    >
      <span style={{ animation: 'np-fade-in 1s ease-out 2.9s both' }}>
        By Our Special Correspondent
      </span>
      <div
        style={{
          flex: 1,
          margin: '0 32px',
          height: 1,
          background: palette.ink,
          transformOrigin: 'left',
          animation: 'np-rule-draw 1.4s cubic-bezier(0.7, 0, 0.3, 1) 2.5s both',
        }}
      />
      <span style={{ animation: 'np-fade-in 1s ease-out 2.9s both' }}>
        Page One
      </span>
    </div>
  </div>
);

// ---------- PAGE 2 — ARTICLE SPREAD ----------
const Article: Page = () => {
  const para = (text: string) => (
    <p style={{ margin: '0 0 18px 0', textIndent: 28 }}>{text}</p>
  );

  return (
    <div style={fill}>
      <SharedStyles />
      <div className="np-halftone-soft" />
      <div className="np-grain" />

      {/* Top header strip */}
      <div
        style={{
          position: 'absolute',
          top: 70,
          left: 120,
          right: 120,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: slab,
          fontSize: 22,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: palette.muted,
          animation: 'np-fade-in 0.8s ease-out both',
        }}
      >
        <span>The Motion Gazette</span>
        <span>Section A · Page 2</span>
        <span>Saturday, April 25, 2026</span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 110,
          left: 120,
          right: 120,
          height: 2,
          background: palette.ink,
          transformOrigin: 'left',
          animation: 'np-rule-draw 1.1s cubic-bezier(0.7, 0, 0.3, 1) 0.1s both',
        }}
      />

      {/* Kicker */}
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 120,
          fontFamily: slab,
          fontSize: 26,
          letterSpacing: '0.36em',
          textTransform: 'uppercase',
          color: palette.red,
          animation: 'np-fade-up 0.9s ease-out 0.5s both',
        }}
      >
        ⬥ Feature ⬥ Studio Notes
      </div>

      {/* Headline with off-register */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 120,
          right: 120,
          fontFamily: serif,
          fontSize: 124,
          fontWeight: 900,
          lineHeight: 0.98,
          letterSpacing: '-0.02em',
          animation: 'np-inkbleed 1.4s cubic-bezier(0.6, 0, 0.2, 1) 0.8s both',
        }}
      >
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <span aria-hidden className="np-offset-shadow-blue" style={{ position: 'absolute', inset: 0 }}>
            On Ink That Slips
          </span>
          <span style={{ position: 'relative' }}>On Ink That Slips</span>
        </span>
      </div>

      {/* Byline rule */}
      <div
        style={{
          position: 'absolute',
          top: 350,
          left: 120,
          right: 120,
          height: 1,
          background: palette.ink,
          transformOrigin: 'left',
          animation: 'np-rule-draw 1s cubic-bezier(0.7, 0, 0.3, 1) 1.3s both',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 364,
          left: 120,
          fontFamily: slab,
          fontSize: 22,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: palette.muted,
          animation: 'np-fade-in 1s ease-out 1.5s both',
        }}
      >
        By J. Halftone &nbsp;·&nbsp; Filed from the Press Room
      </div>

      {/* Drop cap for column 1 */}
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 432,
          fontFamily: serif,
          fontSize: 168,
          fontWeight: 900,
          lineHeight: 0.82,
          color: palette.red,
          transformOrigin: '50% 60%',
          animation: 'np-dropcap 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 1.7s both',
          textShadow: `4px 4px 0 ${palette.ink}`,
        }}
      >
        T
      </div>

      {/* Column 1 */}
      <div
        style={{
          position: 'absolute',
          top: 440,
          left: 240,
          width: 540,
          fontFamily: body,
          fontSize: 26,
          lineHeight: 1.55,
          color: palette.ink,
          columnFill: 'auto',
          animation: 'np-fade-up 1s ease-out 1.9s both',
        }}
      >
        {para('here is a particular romance to a print that does not arrive cleanly. The red plate, set down a hair to the right of the black, gives the headline a small shudder; a halftone dot pattern, breathing across the page, refuses to settle entirely.')}
        {para('Modern interfaces have grown unnervingly precise. Pixels meet on schedule. Edges hold their breath. We propose, in this dispatch, a return to the slip — the registration error, the ink that bleeds, the dot screen that pulses faintly under the eye.')}
        {para('Our correspondent has spent a fortnight at the press, observing what happens when motion is given back to a paper that should be still.')}
      </div>

      {/* Column rule (vertical — uses scaleY) */}
      <div
        style={{
          position: 'absolute',
          left: 830,
          top: 432,
          width: 1,
          height: 528,
          background: palette.ink,
          transformOrigin: 'top',
          animation: 'np-col-rule-draw 1.1s cubic-bezier(0.7, 0, 0.3, 1) 1.6s both',
        }}
      />

      {/* Column 2 */}
      <div
        style={{
          position: 'absolute',
          top: 440,
          left: 870,
          width: 460,
          fontFamily: body,
          fontSize: 26,
          lineHeight: 1.55,
          color: palette.ink,
          animation: 'np-fade-up 1s ease-out 2.1s both',
        }}
      >
        {para('It is, the printer insists, a question of restraint. A jiggle every few seconds, no more. A dot that grows by four pixels and shrinks back. The eye notices, but only on the second pass.')}
        {para('The ink-bleed reveal — a clip moving left to right across the type — borrows the rhythm of a hand setting wood blocks into a chase. The drop cap arrives last, snapping in with overshoot, like a stamp pressed firm.')}
        {para('When the system is well tuned, motion does not announce itself. It loiters. It waits to be caught.')}
      </div>

      {/* Pull quote — right column */}
      <div
        style={{
          position: 'absolute',
          top: 432,
          left: 1380,
          right: 120,
          padding: '32px 36px',
          borderTop: `4px solid ${palette.red}`,
          borderBottom: `4px solid ${palette.red}`,
          fontFamily: serif,
          fontStyle: 'italic',
          fontSize: 42,
          lineHeight: 1.25,
          color: palette.ink,
          animation: 'np-fade-up 1.2s ease-out 2.4s both',
        }}
      >
        <div
          style={{
            fontFamily: serif,
            fontSize: 110,
            color: palette.red,
            lineHeight: 0.6,
            marginBottom: 8,
          }}
        >
          &ldquo;
        </div>
        Motion does not announce itself. It loiters. It waits to be caught.
        <div
          style={{
            marginTop: 28,
            fontFamily: slab,
            fontStyle: 'normal',
            fontSize: 22,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: palette.muted,
          }}
        >
          — The Press Foreman
        </div>
      </div>

      {/* Sidebar caption box */}
      <div
        style={{
          position: 'absolute',
          top: 770,
          left: 1380,
          right: 120,
          padding: '20px 28px',
          background: palette.ink,
          color: palette.paper,
          fontFamily: slab,
          fontSize: 22,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          lineHeight: 1.4,
          animation: 'np-fade-in 1s ease-out 3s both',
        }}
      >
        Fig. 03 — A halftone screen, breathing at six-second intervals.
      </div>

      {/* Footer rule + meta */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 120,
          right: 120,
          height: 2,
          background: palette.ink,
          transformOrigin: 'right',
          animation: 'np-rule-draw 1.2s cubic-bezier(0.7, 0, 0.3, 1) 2.7s both',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: 120,
          right: 120,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: slab,
          fontSize: 20,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: palette.muted,
          animation: 'np-fade-in 1s ease-out 3.1s both',
        }}
      >
        <span>Continued on Page 4</span>
        <span>The Motion Gazette · Studio Notes</span>
        <span>A2</span>
      </div>
    </div>
  );
};

// ---------- PAGE 3 — STOP THE PRESS ----------
const StopPress: Page = () => (
  <div style={fill}>
    <SharedStyles />
    <div className="np-halftone-red" />
    <div className="np-halftone-soft" />
    <div className="np-grain" />

    {/* Heavy black border like a printed poster */}
    <div
      style={{
        position: 'absolute',
        inset: 60,
        border: `6px solid ${palette.ink}`,
        animation: 'np-fade-in 0.8s ease-out both',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 76,
        border: `1px solid ${palette.ink}`,
        animation: 'np-fade-in 1s ease-out 0.2s both',
      }}
    />

    {/* Top kicker */}
    <div
      style={{
        position: 'absolute',
        top: 120,
        left: 120,
        right: 120,
        textAlign: 'center',
        fontFamily: slab,
        fontSize: 28,
        letterSpacing: '0.5em',
        textTransform: 'uppercase',
        color: palette.muted,
        animation: 'np-fade-in 1s ease-out 0.4s both',
      }}
    >
      Extra ⋄ Extra ⋄ Final Edition
    </div>

    {/* Top hairline */}
    <div
      style={{
        position: 'absolute',
        top: 175,
        left: 220,
        right: 220,
        height: 2,
        background: palette.ink,
        transformOrigin: 'center',
        animation: 'np-rule-draw 1.2s cubic-bezier(0.7, 0, 0.3, 1) 0.5s both',
      }}
    />

    {/* MAIN HEADLINE — STOP THE PRESS */}
    <div
      style={{
        position: 'absolute',
        top: 250,
        left: 120,
        right: 120,
        textAlign: 'center',
        fontFamily: serif,
        fontWeight: 900,
        animation: 'np-press-pulse 4s ease-in-out 1.4s infinite',
      }}
    >
      <div
        style={{
          fontSize: 244,
          lineHeight: 0.92,
          letterSpacing: '-0.02em',
          position: 'relative',
          display: 'inline-block',
        }}
      >
        <span aria-hidden className="np-offset-shadow" style={{ position: 'absolute', inset: 0 }}>
          STOP THE
        </span>
        <span
          style={{
            position: 'relative',
            display: 'inline-block',
            animation: 'np-inkbleed 1.4s cubic-bezier(0.6, 0, 0.2, 1) 0.6s both',
          }}
        >
          STOP THE
        </span>
      </div>
      <div
        style={{
          fontSize: 308,
          lineHeight: 0.92,
          letterSpacing: '-0.03em',
          position: 'relative',
          display: 'inline-block',
          marginTop: 8,
          color: palette.red,
        }}
      >
        <span
          aria-hidden
          className="np-offset-shadow-blue"
          style={{ position: 'absolute', inset: 0, color: palette.blue }}
        >
          PRESS
        </span>
        <span
          style={{
            position: 'relative',
            display: 'inline-block',
            color: palette.red,
            animation: 'np-inkbleed-right 1.4s cubic-bezier(0.6, 0, 0.2, 1) 1.0s both',
            textShadow: `5px 4px 0 ${palette.ink}`,
          }}
        >
          PRESS
        </span>
      </div>
    </div>

    {/* Stamp element — rotates and snaps */}
    <div
      style={{
        position: 'absolute',
        top: 140,
        right: 160,
        width: 280,
        height: 280,
        borderRadius: '50%',
        border: `8px double ${palette.red}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontFamily: slab,
        color: palette.red,
        textTransform: 'uppercase',
        letterSpacing: '0.18em',
        boxShadow: `0 0 0 4px ${palette.paper}, 0 0 0 5px ${palette.red}`,
        animation: 'np-stamp 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) 1.8s both',
        transformOrigin: 'center',
        mixBlendMode: 'multiply',
      }}
    >
      <div style={{ fontSize: 28, opacity: 0.85 }}>Approved</div>
      <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, margin: '6px 0' }}>
        25·IV
      </div>
      <div style={{ fontSize: 22, opacity: 0.85 }}>MMXXVI</div>
      <div
        style={{
          marginTop: 8,
          paddingTop: 6,
          borderTop: `2px solid ${palette.red}`,
          fontSize: 18,
          letterSpacing: '0.32em',
        }}
      >
        Press · No. 03
      </div>
    </div>

    {/* Lower hairline */}
    <div
      style={{
        position: 'absolute',
        bottom: 280,
        left: 220,
        right: 220,
        height: 2,
        background: palette.ink,
        transformOrigin: 'right',
        animation: 'np-rule-draw 1.2s cubic-bezier(0.7, 0, 0.3, 1) 2.4s both',
      }}
    />

    {/* Subhead */}
    <div
      style={{
        position: 'absolute',
        bottom: 170,
        left: 120,
        right: 120,
        textAlign: 'center',
        fontFamily: serif,
        fontStyle: 'italic',
        fontSize: 44,
        lineHeight: 1.3,
        color: palette.ink,
        animation: 'np-fade-up 1s ease-out 2.6s both',
      }}
    >
      An invitation to halftones, hairline rules, and ink that refuses to dry quietly.
    </div>

    {/* Footer */}
    <div
      style={{
        position: 'absolute',
        bottom: 100,
        left: 120,
        right: 120,
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: slab,
        fontSize: 22,
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: palette.muted,
        animation: 'np-fade-in 1s ease-out 2.9s both',
      }}
    >
      <span>The Motion Gazette</span>
      <span>— End of Edition —</span>
      <span>Vol. I · No. 03</span>
    </div>
  </div>
);

export const meta: SlideMeta = { title: 'The Motion Gazette' };
export default [Cover, Article, StopPress] satisfies Page[];
