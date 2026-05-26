import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';

export const design: DesignSystem = {
  palette: { bg: '#f6f1e7', text: '#141210', accent: '#b3341f' },
  fonts: {
    display: '"Times New Roman", Georgia, serif',
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  },
  typeScale: { hero: 150, body: 34 },
  radius: 2,
};

const colors = {
  surface: '#fffaf0',
  muted: '#746b5f',
  rule: '#1a1815',
  faint: '#d9cebb',
  gold: '#9f6b26',
  deepRed: '#6f1d16',
};

const fonts = {
  display: 'var(--osd-font-display)',
  body: 'var(--osd-font-body)',
  mono: '"SF Mono", "Cascadia Mono", Consolas, monospace',
};

const TOTAL = 8;
const PAD_X = 140;
const PAD_Y = 112;

const page = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
} as const;

const citations = [
  'Brown, 1971',
  'Heather, 2005',
  'Ward-Perkins, 2005',
  'Goldsworthy, 2009',
  'Ostrogorsky, 1969',
];

const PaperTexture = () => (
  <svg
    aria-hidden="true"
    role="presentation"
    width="100%"
    height="100%"
    style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.42 }}
  >
    <title>paper texture</title>
    <defs>
      <pattern id="rome-grid" width="96" height="96" patternUnits="userSpaceOnUse">
        <path d="M 96 0 L 0 0 0 96" fill="none" stroke={colors.faint} strokeWidth="1" />
      </pattern>
      <pattern id="rome-dots" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill={colors.faint} />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#rome-grid)" />
    <rect width="100%" height="100%" fill="url(#rome-dots)" opacity="0.55" />
  </svg>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: '0.28em',
      textTransform: 'uppercase',
      color: 'var(--osd-accent)',
    }}
  >
    {children}
  </div>
);

const Footer = ({ pageNum, section }: { pageNum: number; section: string }) => (
  <div
    style={{
      position: 'absolute',
      left: PAD_X,
      right: PAD_X,
      bottom: 58,
      display: 'flex',
      justifyContent: 'space-between',
      borderTop: `1px dashed ${colors.rule}`,
      paddingTop: 18,
      fontSize: 18,
      letterSpacing: '0.24em',
      textTransform: 'uppercase',
      color: colors.muted,
    }}
  >
    <span>Rome: decline and rupture / {section}</span>
    <span>
      p. {pageNum} of {TOTAL}
    </span>
  </div>
);

const SourceNote = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      position: 'absolute',
      right: PAD_X,
      bottom: 112,
      maxWidth: 760,
      fontSize: 20,
      lineHeight: 1.45,
      color: colors.muted,
      textAlign: 'right',
    }}
  >
    {children}
  </div>
);

const RomanArch = () => (
  <svg
    width="520"
    height="620"
    viewBox="0 0 520 620"
    aria-hidden="true"
    role="presentation"
    style={{ position: 'absolute', right: 135, bottom: 132 }}
  >
    <title>Roman arch line drawing</title>
    <path
      d="M70 590V265C70 160 155 75 260 75s190 85 190 190v325"
      fill="none"
      stroke={colors.rule}
      strokeWidth="10"
    />
    <path
      d="M140 590V268c0-66 54-120 120-120s120 54 120 120v322"
      fill="none"
      stroke={colors.deepRed}
      strokeWidth="6"
    />
    <path d="M42 590H478" stroke={colors.rule} strokeWidth="10" />
    <path d="M92 505H428M92 420H428M96 335H424" stroke={colors.faint} strokeWidth="4" />
    <path d="M260 75V590" stroke={colors.faint} strokeWidth="3" strokeDasharray="10 14" />
  </svg>
);

const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontFamily: fonts.display,
      fontSize: 'var(--osd-size-hero)',
      fontWeight: 700,
      lineHeight: 1.03,
      margin: '34px 0 0',
      maxWidth: 1120,
    }}
  >
    {children}
  </h1>
);

const Heading = ({ children }: { children: React.ReactNode }) => (
  <h2
    style={{
      fontFamily: fonts.display,
      fontSize: 82,
      lineHeight: 1.08,
      fontWeight: 700,
      margin: '28px 0 0',
      maxWidth: 1350,
    }}
  >
    {children}
  </h2>
);

const Lead = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 34, lineHeight: 1.52, maxWidth: 1180, margin: '44px 0 0' }}>{children}</p>
);

const TwoColumn = ({ items }: { items: { label: string; body: string; note: string }[] }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 34, marginTop: 56 }}>
    {items.map((item) => (
      <div
        key={item.label}
        style={{
          minHeight: 250,
          background: colors.surface,
          border: `1px solid ${colors.rule}`,
          borderRadius: 'var(--osd-radius)',
          padding: '34px 38px',
        }}
      >
        <div
          style={{
            fontSize: 20,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--osd-accent)',
            fontWeight: 700,
          }}
        >
          {item.label}
        </div>
        <div style={{ fontFamily: fonts.display, fontSize: 43, lineHeight: 1.18, marginTop: 22 }}>
          {item.body}
        </div>
        <div style={{ fontSize: 22, lineHeight: 1.4, color: colors.muted, marginTop: 22 }}>
          {item.note}
        </div>
      </div>
    ))}
  </div>
);

const Cover: Page = () => (
  <div style={{ ...page, padding: `${PAD_Y}px ${PAD_X}px` }}>
    <PaperTexture />
    <RomanArch />
    <div style={{ position: 'relative', zIndex: 1, paddingTop: 70 }}>
      <Eyebrow>Late antiquity / 376-476 CE</Eyebrow>
      <Title>
        Rome did not fall
        <br />
        in a day.
      </Title>
      <div style={{ width: 560, height: 2, background: colors.rule, margin: '58px 0 32px' }} />
      <p style={{ fontSize: 36, lineHeight: 1.48, maxWidth: 980, margin: 0, color: colors.muted }}>
        A short historical briefing on pressure, adaptation, and the end of imperial rule in the
        western Mediterranean.
      </p>
    </div>
    <SourceNote>Harvard-style references are included on the final page.</SourceNote>
    <Footer pageNum={1} section="prologue" />
  </div>
);

const Thesis: Page = () => (
  <div style={{ ...page, padding: `${PAD_Y}px ${PAD_X}px` }}>
    <PaperTexture />
    <Eyebrow>Argument</Eyebrow>
    <Heading>The better question is not “why did Rome fall?” but “which Rome?”</Heading>
    <Lead>
      The western empire fractured politically in 476 CE. Roman institutions, law, Christianity, and
      imperial identity continued in altered forms, especially in the eastern empire.
    </Lead>
    <TwoColumn
      items={[
        {
          label: 'Western rupture',
          body: 'Court, army and tax base lost coherence.',
          note: 'The last western emperor was deposed in 476 CE.',
        },
        {
          label: 'Eastern continuity',
          body: 'Constantinople remained Roman for centuries.',
          note: 'Its rulers still called themselves Roman emperors.',
        },
      ]}
    />
    <SourceNote>See Brown (1971), Heather (2005), and Ostrogorsky (1969).</SourceNote>
    <Footer pageNum={2} section="thesis" />
  </div>
);

const Pressures: Page = () => (
  <div style={{ ...page, padding: `${PAD_Y}px ${PAD_X}px` }}>
    <PaperTexture />
    <Eyebrow>Structural pressure</Eyebrow>
    <Heading>Rome’s western system became expensive to defend and hard to finance.</Heading>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 30, marginTop: 60 }}>
      {[
        ['Frontiers', 'Long borders demanded permanent military spending.'],
        ['Taxation', 'Shrinking revenue weakened central command.'],
        ['Politics', 'Civil wars consumed soldiers and legitimacy.'],
      ].map(([label, body], index) => (
        <div
          key={label}
          style={{
            borderTop: `6px solid ${index === 1 ? colors.gold : 'var(--osd-accent)'}`,
            paddingTop: 30,
          }}
        >
          <div style={{ fontFamily: fonts.display, fontSize: 54, lineHeight: 1.1 }}>{label}</div>
          <p style={{ fontSize: 31, lineHeight: 1.45, color: colors.muted, margin: '22px 0 0' }}>
            {body}
          </p>
        </div>
      ))}
    </div>
    <SourceNote>
      Goldsworthy (2009) emphasizes political instability and military overreach.
    </SourceNote>
    <Footer pageNum={3} section="pressure" />
  </div>
);

const Migration: Page = () => (
  <div style={{ ...page, padding: `${PAD_Y}px ${PAD_X}px` }}>
    <PaperTexture />
    <Eyebrow>External shock</Eyebrow>
    <Heading>The arrival of armed peoples was not new. The scale and timing were.</Heading>
    <Lead>
      Goths, Vandals and Huns entered an empire already weakened by internal conflict. Roman leaders
      tried to absorb, bargain with, and fight them, often all at once.
    </Lead>
    <div
      style={{
        marginTop: 58,
        border: `1px solid ${colors.rule}`,
        background: colors.surface,
        padding: '34px 42px',
        display: 'grid',
        gridTemplateColumns: '260px 1fr 260px',
        gap: 28,
        alignItems: 'center',
      }}
    >
      <div style={{ fontFamily: fonts.display, fontSize: 64 }}>376</div>
      <div style={{ height: 2, background: colors.rule, position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: '44%',
            top: -16,
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--osd-accent)',
          }}
        />
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 64, textAlign: 'right' }}>410</div>
      <div style={{ fontSize: 25, color: colors.muted }}>Goths cross the Danube.</div>
      <div style={{ fontSize: 25, color: colors.muted, textAlign: 'center' }}>
        Adrianople exposes Roman vulnerability.
      </div>
      <div style={{ fontSize: 25, color: colors.muted, textAlign: 'right' }}>
        Alaric sacks Rome.
      </div>
    </div>
    <SourceNote>
      Heather (2005) treats migration and Hunnic pressure as decisive accelerants.
    </SourceNote>
    <Footer pageNum={4} section="migration" />
  </div>
);

const MaterialFall: Page = () => (
  <div style={{ ...page, padding: `${PAD_Y}px ${PAD_X}px` }}>
    <PaperTexture />
    <Eyebrow>Material evidence</Eyebrow>
    <Heading>Collapse was visible in ordinary things: coins, pottery, roofs and roads.</Heading>
    <Lead>
      In the western provinces, the post-Roman economy became less connected and less complex. That
      makes “fall” more than a literary metaphor.
    </Lead>
    <div style={{ display: 'flex', gap: 28, marginTop: 56 }}>
      {['mass-produced pottery', 'reliable coinage', 'urban building', 'long-distance trade'].map(
        (label, index) => (
          <div
            key={label}
            style={{
              flex: 1,
              height: 160 + index * 26,
              alignSelf: 'flex-end',
              border: `1px solid ${colors.rule}`,
              background: index < 2 ? colors.deepRed : colors.gold,
              color: '#fffaf0',
              padding: '22px 20px',
              display: 'flex',
              alignItems: 'flex-end',
              fontSize: 25,
              lineHeight: 1.22,
              fontWeight: 700,
            }}
          >
            {label}
          </div>
        ),
      )}
    </div>
    <SourceNote>
      Ward-Perkins (2005) argues that the western collapse had severe material costs.
    </SourceNote>
    <Footer pageNum={5} section="evidence" />
  </div>
);

const Religion: Page = () => (
  <div style={{ ...page, padding: `${PAD_Y}px ${PAD_X}px` }}>
    <PaperTexture />
    <Eyebrow>Culture</Eyebrow>
    <Heading>Christianity changed Rome, but it did not simply destroy it.</Heading>
    <TwoColumn
      items={[
        {
          label: 'Continuity',
          body: 'Bishops preserved authority in cities.',
          note: 'Christian institutions helped organize post-imperial society.',
        },
        {
          label: 'Transformation',
          body: 'Imperial identity moved into new forms.',
          note: 'The “late antique” world was not just a dark ending.',
        },
      ]}
    />
    <Lead>
      The religious story is best read as transformation: power shifted, values changed, and Roman
      language survived inside Christian politics.
    </Lead>
    <SourceNote>
      Brown (1971) frames late antiquity as transformation rather than simple decay.
    </SourceNote>
    <Footer pageNum={6} section="culture" />
  </div>
);

const Verdict: Page = () => (
  <div style={{ ...page, padding: `${PAD_Y}px ${PAD_X}px` }}>
    <PaperTexture />
    <Eyebrow>Verdict</Eyebrow>
    <Heading>Rome’s downfall was a compound failure, not a single cause.</Heading>
    <div style={{ marginTop: 62, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 44 }}>
      {[
        'Political instability made long-term defense harder.',
        'Military pressure exposed weak fiscal foundations.',
        'Western imperial authority broke before Roman culture did.',
        'The eastern empire shows that “Rome” had more than one ending.',
      ].map((item, index) => (
        <div key={item} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div
            style={{
              flexShrink: 0,
              width: 58,
              height: 58,
              border: `1px solid ${colors.rule}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: fonts.display,
              fontSize: 32,
              color: 'var(--osd-accent)',
            }}
          >
            {index + 1}
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.38 }}>{item}</div>
        </div>
      ))}
    </div>
    <SourceNote>Interpretation synthesized from {citations.slice(0, 4).join('; ')}.</SourceNote>
    <Footer pageNum={7} section="verdict" />
  </div>
);

const References: Page = () => (
  <div style={{ ...page, padding: `${PAD_Y}px ${PAD_X}px` }}>
    <PaperTexture />
    <Eyebrow>Harvard references</Eyebrow>
    <Heading>Selected bibliography</Heading>
    <div
      style={{
        marginTop: 54,
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 24,
        maxWidth: 1500,
      }}
    >
      {[
        'Brown, P. (1971) The World of Late Antiquity. London: Thames and Hudson.',
        'Goldsworthy, A. (2009) The Fall of the West: The Death of the Roman Superpower. London: Weidenfeld & Nicolson.',
        'Heather, P. (2005) The Fall of the Roman Empire: A New History. London: Macmillan.',
        'Ostrogorsky, G. (1969) History of the Byzantine State. Oxford: Basil Blackwell.',
        'Ward-Perkins, B. (2005) The Fall of Rome and the End of Civilization. Oxford: Oxford University Press.',
      ].map((ref) => (
        <div
          key={ref}
          style={{
            fontSize: 28,
            lineHeight: 1.42,
            paddingBottom: 18,
            borderBottom: `1px dashed ${colors.faint}`,
          }}
        >
          {ref}
        </div>
      ))}
    </div>
    <Footer pageNum={8} section="references" />
  </div>
);

export const meta: SlideMeta = { title: 'Rome and Its Downfall' };

export default [
  Cover,
  Thesis,
  Pressures,
  Migration,
  MaterialFall,
  Religion,
  Verdict,
  References,
] satisfies Page[];
