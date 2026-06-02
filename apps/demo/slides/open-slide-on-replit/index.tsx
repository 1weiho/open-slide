import type { DesignSystem, Page, SlideMeta, SlideTransition } from '@open-slide/core';
import createSlideSkill from './assets/create-slide-skill.webp';
import initCommand from './assets/init-command.webp';
import openslideHome from './assets/openslide-home.webp';
import replitAgentHome from './assets/replit-agent-home.webp';
import replitDeploy from './assets/replit-deploy.webp';
import replitFeaturesResult from './assets/replit-features-result.webp';

const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');

@keyframes rf-fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes rf-fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.rf-fadeUp { opacity: 0; animation: rf-fadeUp 0.8s cubic-bezier(.2,.7,.2,1) forwards; }
.rf-fadeIn { opacity: 0; animation: rf-fadeIn 1s ease forwards; }
`;

const Styles = () => <style>{css}</style>;

export const design: DesignSystem = {
  palette: {
    bg: '#FAF6F1',
    text: '#2F3034',
    accent: '#FF3C00',
  },
  fonts: {
    display: '"Space Grotesk", system-ui, -apple-system, sans-serif',
    body: '"IBM Plex Sans", system-ui, -apple-system, sans-serif',
  },
  typeScale: {
    hero: 164,
    body: 40,
  },
  radius: 10,
};

const p = {
  bg: design.palette.bg,
  text: design.palette.text,
  accent: design.palette.accent,
  surface: '#EDE8E1',
  muted: '#71727A',
  dark: '#17181B',
  darkSurface: '#1E2025',
  darkBorder: 'rgba(255,255,255,0.09)',
  cream: '#FAF6F1',
  mutedLight: 'rgba(250,246,241,0.55)',
};

const font = {
  display: design.fonts.display,
  body: design.fonts.body,
  mono: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
};

const fillLight: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
  overflow: 'hidden',
  position: 'relative',
};

const fillDark: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: p.dark,
  color: p.cream,
  fontFamily: 'var(--osd-font-body)',
  overflow: 'hidden',
  position: 'relative',
};

const DotGrid = ({ opacity = 0.06, light = false }: { opacity?: number; light?: boolean }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `radial-gradient(circle, rgba(${light ? '255,255,255' : '47,48,52'},${opacity}) 1.5px, transparent 1.5px)`,
      backgroundSize: '52px 52px',
      pointerEvents: 'none',
    }}
  />
);

const OrangeGlow = ({
  corner = 'top-right',
}: {
  corner?: 'top-right' | 'top-left' | 'bottom-right';
}) => {
  const pos: React.CSSProperties =
    corner === 'top-right'
      ? { top: -120, right: -120 }
      : corner === 'top-left'
        ? { top: -160, left: -160 }
        : { bottom: -140, right: -140 };
  return (
    <div
      style={{
        position: 'absolute',
        ...pos,
        width: 660,
        height: 660,
        background: `radial-gradient(circle, ${p.accent}22, transparent 65%)`,
        pointerEvents: 'none',
      }}
    />
  );
};

const Eyebrow = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <div
    style={{
      fontFamily: font.mono,
      fontSize: 22,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: light ? p.mutedLight : p.accent,
      marginBottom: 24,
    }}
  >
    {children}
  </div>
);

const LogoMark = ({ size = 36 }: { size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      background: p.accent,
      borderRadius: Math.round(size * 0.19),
      flexShrink: 0,
    }}
  />
);

const Shot = ({
  src,
  ratio,
  alt,
  light = false,
}: {
  src: string;
  ratio: number;
  alt: string;
  light?: boolean;
}) => (
  <div
    style={{
      width: '100%',
      aspectRatio: ratio,
      borderRadius: 'var(--osd-radius)',
      overflow: 'hidden',
      border: light ? '1px solid rgba(47,48,52,0.14)' : `1px solid ${p.darkBorder}`,
      background: light ? '#fff' : p.darkSurface,
    }}
  >
    <img
      src={src}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  </div>
);

const Caption = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <div
    style={{
      marginTop: 16,
      fontFamily: font.mono,
      fontSize: 20,
      letterSpacing: '0.02em',
      color: light ? p.muted : p.mutedLight,
    }}
  >
    {children}
  </div>
);

const FeatureCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div
    style={{
      background: p.surface,
      borderRadius: 'var(--osd-radius)',
      padding: '28px 36px',
      borderLeft: `4px solid ${p.accent}`,
    }}
  >
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: '-0.01em',
        marginBottom: 8,
      }}
    >
      {title}
    </div>
    <div style={{ fontSize: 27, color: p.muted, lineHeight: 1.44 }}>{children}</div>
  </div>
);

const Step = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 24 }}>
    <div
      style={{
        fontFamily: font.mono,
        fontSize: 24,
        fontWeight: 500,
        color: p.accent,
        paddingTop: 4,
        minWidth: 40,
      }}
    >
      {n}
    </div>
    <div>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: p.cream,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 24, color: p.mutedLight, lineHeight: 1.45 }}>{children}</div>
    </div>
  </div>
);

const DragHandle = () => (
  <span style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 3px)', gap: 3 }}>
    <span style={{ width: 3, height: 3, borderRadius: '50%', background: p.mutedLight }} />
    <span style={{ width: 3, height: 3, borderRadius: '50%', background: p.mutedLight }} />
    <span style={{ width: 3, height: 3, borderRadius: '50%', background: p.mutedLight }} />
    <span style={{ width: 3, height: 3, borderRadius: '50%', background: p.mutedLight }} />
    <span style={{ width: 3, height: 3, borderRadius: '50%', background: p.mutedLight }} />
    <span style={{ width: 3, height: 3, borderRadius: '50%', background: p.mutedLight }} />
  </span>
);

const PromptCard = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      background: p.darkSurface,
      border: `1px solid ${p.darkBorder}`,
      borderRadius: 16,
      padding: '30px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
    }}
  >
    <div
      style={{
        fontFamily: 'var(--osd-font-body)',
        fontSize: 31,
        lineHeight: 1.45,
        color: p.cream,
      }}
    >
      {children}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 28, color: p.mutedLight, lineHeight: 1 }}>+</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: font.mono,
            fontSize: 18,
            color: p.mutedLight,
          }}
        >
          <DragHandle />
          <span>Economy</span>
          <span style={{ fontSize: 13 }}>▾</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: font.mono,
            fontSize: 18,
            color: p.mutedLight,
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              border: `1.5px solid ${p.mutedLight}`,
            }}
          />
          Plan
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: p.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: p.cream,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          ↑
        </div>
      </div>
    </div>
  </div>
);

const Cover: Page = () => (
  <div style={fillLight}>
    <Styles />
    <DotGrid opacity={0.06} />
    <OrangeGlow corner="top-right" />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '120px 140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div
        className="rf-fadeIn"
        style={{ animationDelay: '0.05s', display: 'flex', alignItems: 'center', gap: 16 }}
      >
        <LogoMark />
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 22,
            color: p.muted,
            letterSpacing: '0.04em',
          }}
        >
          open-slide × Replit — Setup Guide
        </span>
      </div>

      <div>
        <div className="rf-fadeUp" style={{ animationDelay: '0.1s' }}>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 'var(--osd-size-hero)',
              fontWeight: 700,
              margin: 0,
              lineHeight: 0.96,
              letterSpacing: '-0.04em',
              color: 'var(--osd-text)',
            }}
          >
            Build slides
          </h1>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 'var(--osd-size-hero)',
              fontWeight: 700,
              margin: 0,
              lineHeight: 0.96,
              letterSpacing: '-0.04em',
              color: 'var(--osd-accent)',
            }}
          >
            inside Replit.
          </h1>
        </div>

        <p
          className="rf-fadeUp"
          style={{
            animationDelay: '0.22s',
            marginTop: 52,
            fontSize: 42,
            fontWeight: 400,
            color: p.muted,
            maxWidth: 1120,
            lineHeight: 1.4,
          }}
        >
          A hands-on guide to running open-slide in the Replit Agent — install it, preview the
          examples, and author your own deck without leaving the browser.
        </p>
      </div>

      <div
        className="rf-fadeUp"
        style={{ animationDelay: '0.38s', display: 'flex', gap: 48, alignItems: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, background: p.accent, borderRadius: '50%' }} />
          <span style={{ fontFamily: font.body, fontSize: 28, color: p.muted }}>Browser-based</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, background: p.accent, borderRadius: '50%' }} />
          <span style={{ fontFamily: font.body, fontSize: 28, color: p.muted }}>AI Agent</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, background: p.accent, borderRadius: '50%' }} />
          <span style={{ fontFamily: font.body, fontSize: 28, color: p.muted }}>
            One-command setup
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, background: p.accent, borderRadius: '50%' }} />
          <span style={{ fontFamily: font.body, fontSize: 28, color: p.muted }}>
            Author with a skill
          </span>
        </div>
      </div>
    </div>
  </div>
);

const WhatIsReplit: Page = () => (
  <div style={fillLight}>
    <Styles />
    <DotGrid opacity={0.05} />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '110px 140px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 80,
        alignItems: 'center',
      }}
    >
      <div>
        <div className="rf-fadeUp" style={{ animationDelay: '0.05s' }}>
          <Eyebrow>What is Replit?</Eyebrow>
          <h2
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 80,
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
            }}
          >
            Build software, right from your browser.
          </h2>
        </div>

        <p
          className="rf-fadeUp"
          style={{
            animationDelay: '0.18s',
            marginTop: 36,
            fontSize: 36,
            color: p.muted,
            lineHeight: 1.5,
            maxWidth: 760,
          }}
        >
          Replit is an AI-native platform for building, running, and deploying software — no local
          setup, all in the browser.
        </p>

        <div
          className="rf-fadeUp"
          style={{
            animationDelay: '0.3s',
            marginTop: 40,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            background: p.surface,
            borderRadius: 'var(--osd-radius)',
            borderLeft: `4px solid ${p.accent}`,
            padding: '20px 32px',
          }}
        >
          <span style={{ fontFamily: font.mono, fontSize: 24, color: p.muted }}>↳ visit</span>
          <span
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: p.text,
            }}
          >
            replit.com
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="rf-fadeUp" style={{ animationDelay: '0.16s' }}>
          <FeatureCard title="AI Agent">
            Describe what you want — the Agent writes the code, runs it, and iterates until it
            works.
          </FeatureCard>
        </div>
        <div className="rf-fadeUp" style={{ animationDelay: '0.24s' }}>
          <FeatureCard title="Browser IDE">
            A full cloud workspace — editor, terminal, and preview — ready the moment you open it.
          </FeatureCard>
        </div>
        <div className="rf-fadeUp" style={{ animationDelay: '0.32s' }}>
          <FeatureCard title="Instant deploy">
            Ship to a live URL in one click. No DevOps, no config, no local environment.
          </FeatureCard>
        </div>
      </div>
    </div>
  </div>
);

const CreateProject: Page = () => (
  <div style={fillDark}>
    <Styles />
    <DotGrid opacity={0.055} light />
    <OrangeGlow corner="top-left" />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '100px 140px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="rf-fadeUp" style={{ animationDelay: '0.05s' }}>
        <Eyebrow light>Step 01 · Create a project</Eyebrow>
        <h2
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 72,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.04,
            letterSpacing: '-0.035em',
            color: p.cream,
          }}
        >
          Start a new Repl.
        </h2>
      </div>

      <div
        style={{
          flex: 1,
          marginTop: 56,
          display: 'grid',
          gridTemplateColumns: '0.55fr 1fr',
          gap: 56,
          alignItems: 'center',
        }}
      >
        <div
          className="rf-fadeUp"
          style={{ animationDelay: '0.18s', display: 'flex', flexDirection: 'column', gap: 30 }}
        >
          <Step n="01" title="Open the Replit home">
            Sign in at replit.com and you land on the Agent home.
          </Step>
          <Step n="02" title="Create something new">
            Click <span style={{ color: p.cream }}>+ Create</span>, or pick one of the starter
            categories.
          </Step>
          <Step n="03" title="Describe it in the input">
            Type what you want to build — the Agent scaffolds a fresh Repl for you.
          </Step>
        </div>

        <div className="rf-fadeUp" style={{ animationDelay: '0.3s' }}>
          <Shot
            src={replitAgentHome}
            ratio={3309 / 1609}
            alt="The Replit Agent home asking what you want to make, with a prompt input and starter categories"
          />
          <Caption>The Replit Agent home — type in the input to begin.</Caption>
        </div>
      </div>
    </div>
  </div>
);

const SetUp: Page = () => (
  <div style={fillDark}>
    <Styles />
    <DotGrid opacity={0.055} light />
    <OrangeGlow corner="bottom-right" />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '100px 140px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="rf-fadeUp" style={{ animationDelay: '0.05s' }}>
        <Eyebrow light>Step 02 · Install &amp; run</Eyebrow>
        <h2
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 72,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.04,
            letterSpacing: '-0.035em',
            color: p.cream,
          }}
        >
          Add open-slide, then run it.
        </h2>
      </div>

      <div
        style={{
          flex: 1,
          marginTop: 56,
          display: 'grid',
          gridTemplateColumns: '0.66fr 1fr',
          gap: 56,
          alignItems: 'center',
        }}
      >
        <div
          className="rf-fadeUp"
          style={{ animationDelay: '0.18s', display: 'flex', flexDirection: 'column', gap: 36 }}
        >
          <Step n="01" title="Ask the Agent to init">
            <div>In the input, tell the Agent to scaffold the project by running:</div>
            <code
              style={{
                display: 'inline-block',
                marginTop: 12,
                fontFamily: font.mono,
                fontSize: 22,
                color: p.cream,
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${p.darkBorder}`,
                borderRadius: 6,
                padding: '8px 14px',
              }}
            >
              <span style={{ color: p.accent }}>$</span> npx @open-slide/cli init
            </code>
          </Step>
          <Step n="02" title="Open &amp; explore">
            open-slide boots in the webview. Click any example slide to view it in the deck.
          </Step>
        </div>

        <div
          className="rf-fadeUp"
          style={{ animationDelay: '0.3s', display: 'flex', flexDirection: 'column', gap: 28 }}
        >
          <div>
            <Shot
              src={initCommand}
              ratio={1534 / 238}
              alt="Typing the open-slide init command into the Replit Agent prompt"
            />
            <Caption>Tell the Agent which command to run.</Caption>
          </div>
          <div>
            <Shot
              src={openslideHome}
              ratio={3818 / 1780}
              alt="open-slide home page running inside Replit with an example slide"
            />
            <Caption>open-slide running in your Repl — examples ready to open.</Caption>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AuthorPrompt: Page = () => (
  <div style={fillDark}>
    <Styles />
    <DotGrid opacity={0.055} light />
    <OrangeGlow corner="top-left" />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '100px 140px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="rf-fadeUp" style={{ animationDelay: '0.05s' }}>
        <Eyebrow light>Step 03 · Author with AI</Eyebrow>
        <h2
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 64,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.06,
            letterSpacing: '-0.03em',
            color: p.cream,
          }}
        >
          Start with a prompt.
        </h2>
      </div>

      <div
        style={{
          flex: 1,
          marginTop: 52,
          display: 'grid',
          gridTemplateColumns: '0.62fr 1fr',
          gap: 56,
          alignItems: 'center',
        }}
      >
        <div className="rf-fadeUp" style={{ animationDelay: '0.18s' }}>
          <div
            style={{
              fontFamily: font.mono,
              fontSize: 20,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: p.accent,
              marginBottom: 20,
            }}
          >
            The prompt I used
          </div>
          <PromptCard>
            use the <span style={{ fontFamily: font.mono, color: p.accent }}>/create-slide</span>{' '}
            skill to make slides introducing Replit's features, and apply the Replit brand theme.
          </PromptCard>
        </div>

        <div className="rf-fadeUp" style={{ animationDelay: '0.3s' }}>
          <Shot
            src={createSlideSkill}
            ratio={3817 / 1781}
            alt="The create-slide skill interviewing the user about the deck's visual direction"
          />
          <Caption>The skill reads it, then asks a few questions before it builds.</Caption>
        </div>
      </div>
    </div>
  </div>
);

const AuthorResult: Page = () => (
  <div style={fillDark}>
    <Styles />
    <DotGrid opacity={0.055} light />
    <OrangeGlow corner="bottom-right" />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '100px 140px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="rf-fadeUp" style={{ animationDelay: '0.05s' }}>
        <Eyebrow light>Step 04 · The result</Eyebrow>
        <h2
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 64,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.06,
            letterSpacing: '-0.03em',
            color: p.cream,
          }}
        >
          A polished, on-brand deck.
        </h2>
      </div>

      <div
        style={{
          flex: 1,
          marginTop: 52,
          display: 'grid',
          gridTemplateColumns: '1fr 0.5fr',
          gap: 56,
          alignItems: 'center',
        }}
      >
        <div className="rf-fadeUp" style={{ animationDelay: '0.3s' }}>
          <Shot
            src={replitFeaturesResult}
            ratio={3815 / 1783}
            alt="A finished Replit features slide deck rendered in open-slide inside Replit"
          />
          <Caption>Here: a Replit features overview, generated end to end.</Caption>
        </div>

        <p
          className="rf-fadeUp"
          style={{
            animationDelay: '0.18s',
            margin: 0,
            fontSize: 32,
            color: p.mutedLight,
            lineHeight: 1.5,
          }}
        >
          Minutes later you have a real deck — and it hot-reloads as the Agent edits it. Live,
          editable, and ready to present.
        </p>
      </div>
    </div>
  </div>
);

const Deploy: Page = () => (
  <div style={fillDark}>
    <Styles />
    <DotGrid opacity={0.055} light />
    <OrangeGlow corner="top-left" />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '100px 140px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="rf-fadeUp" style={{ animationDelay: '0.05s' }}>
        <Eyebrow light>Step 05 · Deploy &amp; share</Eyebrow>
        <h2
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 64,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.06,
            letterSpacing: '-0.03em',
            color: p.cream,
          }}
        >
          Share it the moment it's done.
        </h2>
      </div>

      <div
        style={{
          flex: 1,
          marginTop: 52,
          display: 'grid',
          gridTemplateColumns: '0.62fr 1fr',
          gap: 56,
          alignItems: 'center',
        }}
      >
        <div className="rf-fadeUp" style={{ animationDelay: '0.18s' }}>
          <p style={{ margin: 0, fontSize: 32, color: p.mutedLight, lineHeight: 1.5 }}>
            Your deck is a real web app — nothing extra to host. Hit Deploy and Replit publishes it
            to a live URL. Share the link, and anyone can open the slides in their browser.
          </p>
          <div
            style={{
              marginTop: 28,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${p.darkBorder}`,
              borderLeft: `4px solid ${p.accent}`,
              borderRadius: 'var(--osd-radius)',
              padding: '18px 24px',
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: p.accent,
                flexShrink: 0,
              }}
            />
            <span
              style={{ fontFamily: font.mono, fontSize: 20, color: p.cream, whiteSpace: 'nowrap' }}
            >
              open-slide-init--ridemountainpig.replit.app
            </span>
          </div>
        </div>

        <div className="rf-fadeUp" style={{ animationDelay: '0.3s' }}>
          <Shot
            src={replitDeploy}
            ratio={2950 / 1158}
            alt="Replit Publishing panel showing the open-slide deck deploying to a live replit.app URL"
          />
          <Caption>Replit builds, bundles, and publishes your deck in seconds.</Caption>
        </div>
      </div>
    </div>
  </div>
);

const Closing: Page = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: p.accent,
      color: p.cream,
      fontFamily: 'var(--osd-font-body)',
      overflow: 'hidden',
      position: 'relative',
    }}
  >
    <Styles />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1.5px, transparent 1.5px)',
        backgroundSize: '52px 52px',
      }}
    />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '120px 140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div className="rf-fadeIn" style={{ animationDelay: '0.05s' }}>
        <Eyebrow light>Get started</Eyebrow>
      </div>

      <div>
        <h2
          className="rf-fadeUp"
          style={{
            animationDelay: '0.12s',
            fontFamily: 'var(--osd-font-display)',
            fontSize: 132,
            fontWeight: 700,
            margin: 0,
            lineHeight: 0.96,
            letterSpacing: '-0.04em',
            color: p.cream,
          }}
        >
          Build your deck.
        </h2>
        <p
          className="rf-fadeUp"
          style={{
            animationDelay: '0.26s',
            marginTop: 48,
            fontSize: 44,
            color: 'rgba(250,246,241,0.72)',
            lineHeight: 1.35,
            maxWidth: 1200,
          }}
        >
          Spin up a Repl, run{' '}
          <code style={{ fontFamily: font.mono }}>npx @open-slide/cli init</code>, and let the Agent
          design your slides.
        </p>
      </div>

      <div
        className="rf-fadeUp"
        style={{
          animationDelay: '0.38s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: p.cream,
          }}
        >
          replit.com
        </span>
        <div
          style={{
            fontFamily: font.mono,
            fontSize: 24,
            color: 'rgba(250,246,241,0.5)',
            letterSpacing: '0.06em',
          }}
        >
          BUILD · PRESENT · SHIP
        </div>
      </div>
    </div>
  </div>
);

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

export const transition: SlideTransition = {
  duration: 220,
  exit: {
    duration: 150,
    easing: EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-5px)' },
    ],
  },
  enter: {
    duration: 220,
    delay: 80,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(7px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

export const meta: SlideMeta = {
  title: 'Using open-slide in Replit',
  theme: 'replit',
  createdAt: '2026-05-28T12:31:07.896Z',
};

export default [
  Cover,
  WhatIsReplit,
  CreateProject,
  SetUp,
  AuthorPrompt,
  AuthorResult,
  Deploy,
  Closing,
] satisfies Page[];
