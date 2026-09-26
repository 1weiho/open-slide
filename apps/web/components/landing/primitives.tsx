'use client';

import { motion, useInView, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import posthog from 'posthog-js';
import {
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { highlight } from './code-highlight';

const ACCENT = '#de3b3d';
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const MONO = 'var(--font-mono), ui-monospace, monospace';
const NONE: readonly number[] = [];

const pad2 = (n: number) => String(n).padStart(2, '0');

type PanelProps = { active: boolean };

type Tab = {
  id: string;
  label: string;
  api: string;
  docs: string;
  dwell: number;
  Panel: ComponentType<PanelProps>;
};

// phase counts the cues passed since the loop (re)started; tick changes on
// every cut, including the restart, so keyed elements can replay per cut.
function useLoop(active: boolean, cues: readonly number[], loop: number) {
  const [state, setState] = useState({ phase: cues.length, tick: 0 });

  useEffect(() => {
    if (!active) {
      setState({ phase: cues.length, tick: 0 });
      return;
    }
    let timers: number[] = [];
    const run = (first: boolean) => {
      setState((s) => ({ phase: 0, tick: first ? 0 : s.tick + 1 }));
      timers = cues.map((at, k) =>
        window.setTimeout(() => setState((s) => ({ phase: k + 1, tick: s.tick + 1 })), at),
      );
      timers.push(window.setTimeout(() => run(false), loop));
    };
    run(true);
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [active, cues, loop]);

  return state;
}

type PageVariant = { word: string; accent: string; subtitle: string };

const PAGE_VARIANTS: PageVariant[] = [
  { word: 'deck', accent: ACCENT, subtitle: 'A React slide, rendered live.' },
  { word: 'pitch', accent: '#d98c1f', subtitle: 'No DSL. No templates. Just code.' },
  { word: 'story', accent: '#1f9e6e', subtitle: 'Versioned, reviewable, yours.' },
];
const PAGE_PULSE = [2, 3, 4];
const PAGE_CUES = [3200, 6400] as const;
const PAGE_LOOP = 9600;

function pageLines({ accent, word, subtitle }: PageVariant) {
  return [
    "import type { Page } from '@open-slide/core';",
    '',
    `const ACCENT = '${accent}';`,
    `const WORD = '${word}';`,
    `const SUBTITLE = '${subtitle}';`,
    '',
    'const Cover: Page = () => (',
    '  <section style={{ padding: 120 }}>',
    "    <h1 style={{ fontSize: 188, letterSpacing: '-0.04em' }}>",
    '      Hello, <em style={{ color: ACCENT }}>{WORD}</em>.',
    '    </h1>',
    '    <p>{SUBTITLE}</p>',
    '  </section>',
    ');',
    '',
    'export default [Cover] satisfies Page[];',
  ];
}

const STEP_LINES = [
  "import { Step, Steps, type Page } from '@open-slide/core';",
  '',
  'const Beats: Page = () => (',
  '  <section style={{ padding: 120 }}>',
  '    <h1>Three beats.</h1>',
  '    <Steps>',
  '      <Step>Set the stage.</Step>',
  '      <Step>Layer the consequence.</Step>',
  '      <Step>Land the turn.</Step>',
  '    </Steps>',
  '  </section>',
  ');',
  '',
  'export default [Beats] satisfies Page[];',
];
const STEP_ROWS = ['Set the stage.', 'Layer the consequence.', 'Land the turn.'];
const STEP_FIRST_LINE = 6;
const STEP_CUES = [1400, 2600, 3800] as const;
const STEP_LOOP = 6400;

const TRANSITION_LINES = [
  "import type { Page, SlideTransition } from '@open-slide/core';",
  '',
  'const Cover: Page = () => <section>…</section>;',
  'const Agenda: Page = () => <section>…</section>;',
  '',
  'export const transition: SlideTransition = {',
  '  duration: 260,',
  '  enter: {',
  "    easing: 'cubic-bezier(0, 0, 0.2, 1)',",
  '    keyframes: [',
  "      { opacity: 0, transform: 'translateY(16px)' },",
  "      { opacity: 1, transform: 'translateY(0)' },",
  '    ],',
  '  },',
  '};',
  '',
  'export default [Cover, Agenda] satisfies Page[];',
];
const TRANSITION_PULSE = [10, 11];
const TRANSITION_CUES = [1900] as const;
const TRANSITION_LOOP = 3800;
const AGENDA_ROWS = ['Where we are', 'What ships', "What's next"];

const MORPH_LINES = [
  "import { MorphElement, type Page } from '@open-slide/core';",
  '',
  'const Cover: Page = () => (',
  "  <section style={{ display: 'grid', placeItems: 'center' }}>",
  '    <MorphElement id="title">',
  '      <h1 style={{ fontSize: 188 }}>Morph.</h1>',
  '    </MorphElement>',
  '  </section>',
  ');',
  '',
  'const Detail: Page = () => (',
  '  <section style={{ padding: 120 }}>',
  '    <MorphElement id="title">',
  '      <h1 style={{ fontSize: 64 }}>Morph.</h1>',
  '    </MorphElement>',
  '    <p>Same id, two pages. One object.</p>',
  '  </section>',
  ');',
  '',
  'export const transition = { duration: 700, morph: true };',
  '',
  'export default [Cover, Detail] satisfies Page[];',
];
const MORPH_PULSE = [
  [4, 5],
  [12, 13],
];
const MORPH_CUES = [2000] as const;
const MORPH_LOOP = 4000;

const MAX_LINES = Math.max(
  pageLines(PAGE_VARIANTS[0]).length,
  STEP_LINES.length,
  TRANSITION_LINES.length,
  MORPH_LINES.length,
);

function PagePanel({ active }: PanelProps) {
  const { phase } = useLoop(active, PAGE_CUES, PAGE_LOOP);
  const v = PAGE_VARIANTS[phase % PAGE_VARIANTS.length];

  return (
    <>
      <CodeWindow
        file="slides/hello/index.tsx"
        lines={pageLines(v)}
        pulseLines={PAGE_PULSE}
        pulseKey={phase}
      />
      <OutputWindow caption="Edit the file and the canvas re-renders. Anything you can write in React goes on a page.">
        <Stage name="hello" counter="01 / 01">
          <div className="absolute top-1/2 left-[6.25cqw] flex -translate-y-1/2 flex-col gap-[1.6cqw]">
            <h1
              style={{
                fontSize: '9.8cqw',
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              Hello,{' '}
              <em
                key={`word-${phase}`}
                className="inline-block"
                style={{
                  color: v.accent,
                  transition: 'color 600ms ease',
                  animation: `textReveal 650ms ${EASE} both`,
                }}
              >
                {v.word}
              </em>
              .
            </h1>
            <span
              aria-hidden
              className="block h-px w-[8cqw] transition-colors duration-500"
              style={{ background: v.accent }}
            />
            <p
              key={`sub-${phase}`}
              style={{
                fontFamily: MONO,
                fontSize: '1.5cqw',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#6b6b6b',
                animation: `textReveal 650ms 120ms ${EASE} both`,
              }}
            >
              {v.subtitle}
            </p>
          </div>
        </Stage>
      </OutputWindow>
    </>
  );
}

function StepPanel({ active }: PanelProps) {
  const { phase, tick } = useLoop(active, STEP_CUES, STEP_LOOP);

  return (
    <>
      <CodeWindow
        file="slides/beats/index.tsx"
        lines={STEP_LINES}
        pulseLines={phase > 0 ? [STEP_FIRST_LINE + phase - 1] : NONE}
        pulseKey={tick}
      />
      <OutputWindow caption="Each → reveals the next beat on the same page. Jumping in from the overview shows it complete.">
        <Stage name="beats" counter="01 / 01">
          <Headline>Three beats.</Headline>
          <Rows items={STEP_ROWS} revealed={phase} />
          <KeyCap tick={tick} pressed={phase > 0} />
        </Stage>
      </OutputWindow>
    </>
  );
}

function TransitionPanel({ active }: PanelProps) {
  const { phase, tick } = useLoop(active, TRANSITION_CUES, TRANSITION_LOOP);
  const agenda = phase === 1;

  return (
    <>
      <CodeWindow
        file="slides/q2-launch/index.tsx"
        lines={TRANSITION_LINES}
        pulseLines={TRANSITION_PULSE}
        pulseKey={tick}
      />
      <OutputWindow caption="One transition per deck, declared next to the pages. The incoming page rises in over the outgoing one.">
        <Stage name={agenda ? 'agenda' : 'cover'} counter={agenda ? '02 / 02' : '01 / 02'}>
          <div className="absolute inset-0">{agenda ? <CoverPage /> : <AgendaPage />}</div>
          <div key={tick} className="page-enter absolute inset-0 bg-white">
            {agenda ? <AgendaPage /> : <CoverPage />}
          </div>
          <KeyCap tick={tick} pressed={tick > 0} />
        </Stage>
      </OutputWindow>
    </>
  );
}

function MorphPanel({ active }: PanelProps) {
  const { phase, tick } = useLoop(active, MORPH_CUES, MORPH_LOOP);
  const detail = phase === 1;

  return (
    <>
      <CodeWindow
        file="slides/morph/index.tsx"
        lines={MORPH_LINES}
        pulseLines={MORPH_PULSE[phase]}
        pulseKey={tick}
      />
      <OutputWindow caption="Wrap the same object on two pages with one id. Across the cut it glides instead of fading.">
        <Stage name={detail ? 'detail' : 'cover'} counter={detail ? '02 / 02' : '01 / 02'}>
          {detail ? (
            <p
              className="absolute top-[17.6cqw] left-[6.25cqw]"
              style={{ fontSize: '2.4cqw', color: '#404040' }}
            >
              Same id, two pages. One object.
            </p>
          ) : null}
          <h1
            className="absolute whitespace-nowrap"
            style={{
              left: detail ? '6.25cqw' : '50%',
              top: detail ? '12cqw' : '50%',
              transform: detail ? 'translate(0, 0)' : 'translate(-50%, -50%)',
              fontSize: detail ? '3.33cqw' : '9.8cqw',
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              transition: `left 700ms ${EASE}, top 700ms ${EASE}, transform 700ms ${EASE}, font-size 700ms ${EASE}`,
            }}
          >
            Morph.
          </h1>
          <KeyCap tick={tick} pressed={tick > 0} />
        </Stage>
      </OutputWindow>
    </>
  );
}

function CoverPage() {
  return (
    <div className="absolute top-1/2 left-[6.25cqw] flex -translate-y-1/2 flex-col gap-[1.6cqw]">
      <h1 style={{ fontSize: '8cqw', fontWeight: 600, lineHeight: 1, letterSpacing: '-0.04em' }}>
        Q2 launch.
      </h1>
      <p style={{ fontSize: '2.2cqw', color: '#404040' }}>What we're shipping, why it matters.</p>
    </div>
  );
}

function AgendaPage() {
  return (
    <>
      <Headline>Agenda.</Headline>
      <Rows items={AGENDA_ROWS} />
    </>
  );
}

function Headline({ children }: { children: ReactNode }) {
  return (
    <h1
      className="absolute top-[12cqw] left-[6.25cqw]"
      style={{ fontSize: '5.4cqw', fontWeight: 600, lineHeight: 1, letterSpacing: '-0.03em' }}
    >
      {children}
    </h1>
  );
}

function Rows({ items, revealed = items.length }: { items: string[]; revealed?: number }) {
  return (
    <ol className="absolute top-[22.5cqw] right-[6.25cqw] left-[6.25cqw]">
      {items.map((item, i) => {
        const on = i < revealed;
        return (
          <li
            key={item}
            className="flex items-center gap-[1.8cqw]"
            style={{
              height: '7.4cqw',
              borderTop: i > 0 ? '1px solid #ececec' : undefined,
              fontSize: '2.7cqw',
              opacity: on ? 1 : 0,
              transform: on ? 'none' : 'translateY(0.6cqw)',
              transition: `opacity 200ms ease, transform 320ms ${EASE}`,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: '1.4cqw', color: ACCENT }}>
              {pad2(i + 1)}
            </span>
            {item}
          </li>
        );
      })}
    </ol>
  );
}

function KeyCap({ tick, pressed }: { tick: number; pressed: boolean }) {
  return (
    <span
      key={tick}
      aria-hidden
      className={`absolute right-[6.25cqw] bottom-[4cqw] inline-flex items-center justify-center rounded-[0.9cqw] border border-[#e4e4e4] bg-white text-[#404040] ${pressed ? 'key-press' : ''}`}
      style={{ width: '6cqw', height: '5cqw', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)' }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: '2.2cqw', height: '2.2cqw' }}
      >
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    </span>
  );
}

function Stage({
  name,
  counter,
  children,
}: {
  name: string;
  counter: string;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 select-none overflow-hidden bg-white text-[#0a0a0a]"
      style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif', letterSpacing: '-0.01em' }}
    >
      {children}
      <div
        className="absolute top-[4cqw] right-[6.25cqw] left-[6.25cqw] flex items-center justify-between"
        style={{
          fontFamily: MONO,
          fontSize: '1.5cqw',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#6b6b6b',
        }}
      >
        <span className="flex items-center gap-[0.9cqw]">
          <span
            className="inline-block rounded-full"
            style={{ width: '0.9cqw', height: '0.9cqw', background: ACCENT }}
          />
          <span>open-slide · {name}</span>
        </span>
        <span className="nums">{counter}</span>
      </div>
    </div>
  );
}

function CodeWindow({
  file,
  lines,
  pulseLines,
  pulseKey,
}: {
  file: string;
  lines: string[];
  pulseLines: readonly number[];
  pulseKey: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg bg-[color:var(--color-panel)] shadow-[var(--shadow-window)]">
      <div className="flex h-10 items-center justify-between border-b border-[color:var(--color-rule-soft)] px-4 font-[family-name:var(--font-mono)] text-[12px] text-[color:var(--color-muted)] sm:h-11 sm:px-5">
        <span>{file}</span>
        <span className="hidden tracking-[0.08em] uppercase sm:inline">
          tsx · {lines.length} lines
        </span>
      </div>
      <pre className="overflow-x-auto p-4 font-[family-name:var(--font-mono)] text-[12px] leading-[1.7] sm:p-5 sm:text-[12.5px]">
        <code
          className="block lg:min-h-[var(--code-min)]"
          style={{ '--code-min': `${MAX_LINES * 1.7}em` } as CSSProperties}
        >
          {lines.map((line, idx) => {
            const pulse = pulseLines.includes(idx);
            return (
              <div
                key={pulse ? `${idx}-${pulseKey}` : idx}
                className={`-mx-2 rounded-[3px] px-2 ${pulse ? 'code-pulse' : ''}`}
                // highlight output is escaped + whitelisted spans — safe markup
                dangerouslySetInnerHTML={{ __html: highlight(line) || '&nbsp;' }}
              />
            );
          })}
        </code>
      </pre>
    </div>
  );
}

function OutputWindow({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-lg bg-[color:var(--color-panel)] p-4 shadow-[var(--shadow-window)] sm:p-5">
      <div className="mb-4 flex items-center justify-between font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-[color:var(--color-muted)]">
        <span>rendered output</span>
        <span className="flex items-center gap-2">
          <span className="relative flex size-1.5 items-center justify-center">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--color-accent)] opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--color-accent)]" />
          </span>
          live
        </span>
      </div>
      <div
        className="relative my-auto overflow-hidden rounded-[6px] border border-[color:var(--color-rule)] bg-white"
        style={{ aspectRatio: '16 / 9', containerType: 'inline-size' }}
      >
        {children}
      </div>
      <p className="mt-4 text-pretty text-[13px] leading-[1.5] text-[color:var(--color-muted)]">
        {caption}
      </p>
    </div>
  );
}

const TABS: Tab[] = [
  {
    id: 'page',
    label: 'Page',
    api: 'Page',
    docs: '/docs/primitive/page',
    dwell: 6400,
    Panel: PagePanel,
  },
  {
    id: 'step',
    label: 'Step',
    api: 'Step',
    docs: '/docs/primitive/step',
    dwell: STEP_LOOP,
    Panel: StepPanel,
  },
  {
    id: 'transition',
    label: 'Transition',
    api: 'Transition',
    docs: '/docs/primitive/transition',
    dwell: TRANSITION_LOOP * 2,
    Panel: TransitionPanel,
  },
  {
    id: 'morph',
    label: 'Morph',
    api: 'MorphElement',
    docs: '/docs/primitive/morph-element',
    dwell: MORPH_LOOP * 2,
    Panel: MorphPanel,
  },
];

export function PrimitivesVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const inView = useInView(ref, { amount: 0.3 });
  const reduced = useReducedMotion();
  const active = inView && !reduced;
  const baseId = useId();

  const [index, setIndex] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!active || pinned || paused) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % TABS.length), TABS[index].dwell);
    return () => window.clearTimeout(id);
  }, [active, pinned, paused, index]);

  const select = (i: number) => {
    setIndex(i);
    setPinned(true);
    posthog.capture('primitive_tab_selected', { tab: TABS[i].id });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  };

  const tab = TABS[index];
  const Panel = tab.Panel;

  return (
    <div
      ref={ref}
      className="flex flex-col gap-4"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Primitives"
          onKeyDown={onKeyDown}
          className="inline-flex items-center gap-0.5 rounded-lg bg-[color:var(--color-panel)] p-1 shadow-[var(--shadow-edge)]"
        >
          {TABS.map((t, i) => {
            const selected = i === index;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${t.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(i)}
                className={`relative h-8 rounded-md px-3.5 text-[13px] font-medium transition-colors duration-200 ${
                  selected
                    ? 'text-[color:var(--color-text)]'
                    : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]'
                }`}
              >
                {selected ? (
                  <motion.span
                    layoutId={`${baseId}-pill`}
                    className="absolute inset-0 rounded-md"
                    style={{ background: 'color-mix(in oklab, var(--color-text) 6%, transparent)' }}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
                  />
                ) : null}
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>

        <Link
          href={tab.docs}
          className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)]"
        >
          {tab.api} docs
          <span
            aria-hidden
            className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          >
            ↗
          </span>
        </Link>
      </div>

      <motion.div
        key={tab.id}
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${tab.id}`}
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <Panel active={active} />
      </motion.div>
    </div>
  );
}
