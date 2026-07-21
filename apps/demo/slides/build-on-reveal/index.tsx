import { type DesignSystem, type Page, type SlideMeta, Step, Steps } from '@open-slide/core';
import type { CSSProperties } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#0b0c10', text: '#f4f1e8', accent: '#c8b88a' },
  fonts: {
    display: 'ui-serif, Georgia, "Times New Roman", serif',
    body: '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
  },
  typeScale: { hero: 156, body: 32 },
  radius: 6,
};

const muted = 'rgba(244, 241, 232, 0.46)';
const hairline = 'rgba(244, 241, 232, 0.12)';

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
} as const;

const EYEBROW: CSSProperties = {
  fontSize: 20,
  letterSpacing: '0.28em',
  color: 'var(--osd-accent)',
  textTransform: 'uppercase',
  fontWeight: 500,
};

const FOOT: CSSProperties = {
  fontSize: 18,
  letterSpacing: '0.22em',
  color: muted,
  textTransform: 'uppercase',
  fontVariantNumeric: 'tabular-nums',
};

const Cover: Page = () => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      padding: '120px 144px',
    }}
  >
    <div style={EYEBROW}>open-slide · primitives</div>
    <div style={{ alignSelf: 'center' }}>
      <h1
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 'var(--osd-size-hero)',
          fontWeight: 400,
          lineHeight: 0.96,
          letterSpacing: '-0.035em',
          margin: 0,
        }}
      >
        Build on reveal.
      </h1>
      <p
        style={{
          fontSize: 30,
          lineHeight: 1.5,
          color: muted,
          marginTop: 48,
          maxWidth: 1000,
          fontStyle: 'italic',
        }}
      >
        Show one idea at a time. Press → to step through; → again after the last step advances the
        slide.
      </p>
    </div>
    <div style={{ ...FOOT, display: 'flex', justifyContent: 'space-between' }}>
      <span>01 · steps</span>
      <span>→ to begin</span>
    </div>
  </div>
);

const BULLET_ROW: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '48px 1fr',
  alignItems: 'baseline',
  columnGap: 28,
  fontSize: 38,
  lineHeight: 1.45,
  paddingBottom: 28,
  borderBottom: `1px solid ${hairline}`,
};

const BULLET_NUM: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontStyle: 'italic',
  color: 'var(--osd-accent)',
  fontSize: 32,
};

const Bullets: Page = () => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      padding: '120px 144px',
    }}
  >
    <div style={EYEBROW}>§ 02 · the basics</div>
    <div style={{ alignSelf: 'center', maxWidth: 1400 }}>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 88,
          fontWeight: 400,
          lineHeight: 1.02,
          letterSpacing: '-0.025em',
          margin: '0 0 56px',
        }}
      >
        Three reasons to step.
      </h2>
      <Steps>
        <Step>
          <div style={BULLET_ROW}>
            <span style={BULLET_NUM}>i.</span>
            <span>An audience reads faster than a presenter speaks.</span>
          </div>
        </Step>
        <Step>
          <div style={BULLET_ROW}>
            <span style={BULLET_NUM}>ii.</span>
            <span>Showing every bullet at once invites pre-reading.</span>
          </div>
        </Step>
        <Step>
          <div style={{ ...BULLET_ROW, borderBottom: 'none' }}>
            <span style={BULLET_NUM}>iii.</span>
            <span>Revealing in time stages attention.</span>
          </div>
        </Step>
      </Steps>
    </div>
    <div style={{ ...FOOT, display: 'flex', justifyContent: 'space-between' }}>
      <span>02 · reveal · single block</span>
      <span>← to peel back</span>
    </div>
  </div>
);

const Mixed: Page = () => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      padding: '120px 144px',
    }}
  >
    <div style={EYEBROW}>§ 03 · mixed</div>
    <div style={{ alignSelf: 'center', maxWidth: 1400 }}>
      <Steps>
        <h2
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 88,
            fontWeight: 400,
            lineHeight: 1.02,
            letterSpacing: '-0.025em',
            margin: '0 0 32px',
          }}
        >
          Not everything has to wait.
        </h2>
        <p
          style={{
            fontSize: 30,
            lineHeight: 1.5,
            color: muted,
            margin: '0 0 56px',
            maxWidth: 1100,
            fontStyle: 'italic',
          }}
        >
          Non-Step children render immediately — only Step blocks defer until the next arrow press.
        </p>
        <Step>
          <p style={{ fontSize: 34, lineHeight: 1.5, margin: '0 0 24px' }}>
            First, set the stage with framing that the audience can take in without conscious
            effort.
          </p>
        </Step>
        <Step>
          <p style={{ fontSize: 34, lineHeight: 1.5, margin: '0 0 24px' }}>
            Then, layer the consequence — the part you actually want them to sit with for a beat.
          </p>
        </Step>
        <Step>
          <p style={{ fontSize: 34, lineHeight: 1.5, margin: 0 }}>
            Finally, the turn — the line that re-frames everything above and makes the slide a
            single idea, revealed.
          </p>
        </Step>
      </Steps>
    </div>
    <div style={{ ...FOOT, display: 'flex', justifyContent: 'space-between' }}>
      <span>03 · reveal · mixed content</span>
      <span>headline always · paragraphs in turn</span>
    </div>
  </div>
);

const COL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
};

const CARD: CSSProperties = {
  border: `1px solid ${hairline}`,
  borderRadius: 'var(--osd-radius)',
  padding: '28px 32px',
  fontSize: 28,
  lineHeight: 1.45,
  background: 'rgba(244, 241, 232, 0.03)',
};

const COL_HEAD: CSSProperties = {
  ...EYEBROW,
  fontSize: 17,
  marginBottom: 4,
};

const Columns: Page = () => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      padding: '120px 144px',
    }}
  >
    <div style={EYEBROW}>§ 04 · multiple blocks</div>
    <div style={{ alignSelf: 'center', width: '100%' }}>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 76,
          fontWeight: 400,
          lineHeight: 1.04,
          letterSpacing: '-0.022em',
          margin: '0 0 56px',
        }}
      >
        Two columns, two builds.
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 64 }}>
        <div style={COL}>
          <div style={COL_HEAD}>Left column</div>
          <Steps>
            <Step>
              <div style={CARD}>Reveal A · 1</div>
            </Step>
            <Step>
              <div style={CARD}>Reveal A · 2</div>
            </Step>
          </Steps>
        </div>
        <div style={COL}>
          <div style={COL_HEAD}>Right column</div>
          <Steps>
            <Step>
              <div style={CARD}>Reveal B · 1</div>
            </Step>
            <Step>
              <div style={CARD}>Reveal B · 2</div>
            </Step>
          </Steps>
        </div>
      </div>
    </div>
    <div style={{ ...FOOT, display: 'flex', justifyContent: 'space-between' }}>
      <span>04 · reveal · multiple blocks</span>
      <span>left finishes before right starts</span>
    </div>
  </div>
);

const Closing: Page = () => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      padding: '120px 144px',
    }}
  >
    <div style={EYEBROW}>fin</div>
    <div style={{ alignSelf: 'center', maxWidth: 1400 }}>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 132,
          fontWeight: 400,
          lineHeight: 0.98,
          letterSpacing: '-0.03em',
          margin: 0,
        }}
      >
        Reveal is timing,
        <br />
        <em style={{ fontStyle: 'italic' }}>not decoration</em>.
      </h2>
      <p
        style={{
          fontSize: 26,
          lineHeight: 1.6,
          color: muted,
          marginTop: 48,
          maxWidth: 960,
          borderTop: `1px solid ${hairline}`,
          paddingTop: 32,
        }}
      >
        Jumping into this slide via the overview grid shows it fully composed. Stepping in linearly
        shows it one beat at a time. Same content, two rhythms.
      </p>
    </div>
    <div style={{ ...FOOT, display: 'flex', justifyContent: 'space-between' }}>
      <span>05 · close</span>
      <span>← to revisit</span>
    </div>
  </div>
);

export const meta: SlideMeta = {
  title: 'Build on Reveal',
  createdAt: '2026-05-25T00:00:00.000Z',
};

export default [Cover, Bullets, Mixed, Columns, Closing] satisfies Page[];
