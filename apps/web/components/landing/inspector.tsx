'use client';

import {
  ALargeSmall,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  ChevronRight,
  Italic,
  type LucideIcon,
  MessageSquare,
  Move,
  MoveHorizontal,
  Paintbrush,
  PencilLine,
  Redo2,
  Save,
  Type,
  Undo2,
  UnfoldVertical,
  X,
} from 'lucide-react';
import {
  animate,
  type MotionValue,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import { type CSSProperties, type ReactNode, type Ref, useEffect, useRef, useState } from 'react';

/* The mock is a 760px-wide editor window scaled to the card. `--u` is one
   virtual pixel; overriding Tailwind's `--spacing` makes every spacing
   utility scale with it, so the panel can reuse core's real class values. */
const EDITOR_W = 760;
const SLIDE_SCALE = 0.204;

const mockVars = {
  '--u': `calc(100cqw / ${EDITOR_W})`,
  '--spacing': 'calc(4 * var(--u))',
  '--m-muted': 'color-mix(in oklab, var(--color-text) 5%, var(--color-panel))',
  '--m-brand-soft': 'color-mix(in oklab, var(--color-accent) 12%, transparent)',
} as CSSProperties;

const u = (n: number) => `calc(${n} * var(--u))`;

const COMMENT_TEXT = 'Use the accent color on this title';
const AGENT_LOOP = 12;

type AgentPhase = 'idle' | 'typing' | 'typed' | 'pressed' | 'queued' | 'applied';

function agentPhaseAt(t: number): AgentPhase {
  if (t < 0.08) return 'idle';
  if (t < 0.3) return 'typing';
  if (t < 0.36) return 'typed';
  if (t < 0.38) return 'pressed';
  if (t < 0.5) return 'queued';
  if (t < 0.92) return 'applied';
  return 'idle';
}

export function AgentApplyVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduced = useReducedMotion();
  const active = inView && !reduced;

  const clock = useMotionValue(0.6);
  const [phase, setPhase] = useState<AgentPhase>('applied');

  useEffect(() => {
    if (!active) {
      clock.set(0.6);
      setPhase('applied');
      return;
    }
    clock.set(0);
    const controls = animate(clock, 1, { duration: AGENT_LOOP, ease: 'linear', repeat: Infinity });
    return () => controls.stop();
  }, [active, clock]);

  useMotionValueEvent(clock, 'change', (t) => {
    const next = agentPhaseAt(t);
    setPhase((current) => (current === next ? current : next));
  });

  const typingProgress = useTransform(clock, [0.08, 0.3], [0, 1], { clamp: true });
  const commentText = useTransform(typingProgress, (p) =>
    COMMENT_TEXT.slice(0, Math.round(p * COMMENT_TEXT.length)),
  );

  const draftVisible = phase === 'typing' || phase === 'typed' || phase === 'pressed';
  const applied = phase === 'applied';
  const count = phase === 'queued' ? 1 : 0;

  return (
    <EditorFrame ref={ref}>
      <Canvas>
        <Slide
          titleColor={applied ? 'var(--color-accent)' : 'var(--color-text)'}
          selected={phase !== 'idle'}
        />
        <CommentFab count={count} />
      </Canvas>

      <Panel>
        <Section title="Typography">
          <TypographyRows size="160" />
        </Section>

        <div className="mt-auto">
          <Collapsible title="Comment" open>
            <TextareaMock placeholder="Describe a change for the agent…" focused={draftVisible}>
              {draftVisible ? <motion.span>{commentText}</motion.span> : null}
            </TextareaMock>
            <div className="flex items-center justify-between gap-2">
              <span
                className="font-[family-name:var(--font-mono)] text-[color:var(--color-muted)]/70"
                style={{ fontSize: u(10.5) }}
              >
                ⌘/ to focus · ⌘↵ to add
              </span>
              <BrandButton disabled={!draftVisible} pressed={phase === 'pressed'}>
                Add comment
              </BrandButton>
            </div>
          </Collapsible>
          <Collapsible title="Source" open>
            <div className="flex items-center justify-between gap-2">
              <span
                className="font-[family-name:var(--font-mono)] text-[color:var(--color-muted)]"
                style={{ fontSize: u(10.5) }}
              >
                &lt;h1&gt; · 12:7
              </span>
              <AgentBadge />
            </div>
          </Collapsible>
        </div>
      </Panel>
    </EditorFrame>
  );
}

const EDIT_LOOP = 7;
const SIZE_FROM = 160;
const SIZE_TO = 200;

type EditPhase = 'idle' | 'dirty' | 'pressed' | 'saving' | 'saved' | 'hidden';

function editPhaseAt(t: number): EditPhase {
  if (t < 0.14) return 'idle';
  if (t < 0.55) return 'dirty';
  if (t < 0.58) return 'pressed';
  if (t < 0.66) return 'saving';
  if (t < 0.86) return 'saved';
  return 'hidden';
}

export function VisualEditorVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduced = useReducedMotion();
  const active = inView && !reduced;

  const clock = useMotionValue(0.4);
  const [phase, setPhase] = useState<EditPhase>('dirty');

  useEffect(() => {
    if (!active) {
      clock.set(0.4);
      setPhase('dirty');
      return;
    }
    clock.set(0);
    const controls = animate(clock, 1, { duration: EDIT_LOOP, ease: 'linear', repeat: Infinity });
    return () => controls.stop();
  }, [active, clock]);

  useMotionValueEvent(clock, 'change', (t) => {
    const next = editPhaseAt(t);
    setPhase((current) => (current === next ? current : next));
  });

  const size = useTransform(
    clock,
    [0, 0.12, 0.32, 0.93, 0.98, 1],
    [SIZE_FROM, SIZE_FROM, SIZE_TO, SIZE_TO, SIZE_FROM, SIZE_FROM],
    { clamp: true },
  );
  const sizeLabel = useTransform(size, (v) => String(Math.round(v)));
  const titleSize = useTransform(size, (v) => u(v * SLIDE_SCALE));

  const cardVisible = phase !== 'idle' && phase !== 'hidden';

  return (
    <EditorFrame ref={ref}>
      <Canvas>
        <Slide titleColor="var(--color-accent)" titleSize={titleSize} selected />
        <SaveCardMock visible={cardVisible} phase={phase} />
      </Canvas>

      <Panel>
        <Section title="Typography">
          <TypographyRows size={sizeLabel} />
        </Section>
        <Section title="Color">
          <ColorRow label="Text" value="#DE3B3D" />
          <ColorRow label="Background" value="#FFFFFF" dim />
        </Section>
        <Section
          title="Content"
          action={
            <span
              className="inline-flex h-6 items-center gap-1 rounded-[calc(5*var(--u))] px-2 font-medium text-[color:var(--color-muted)]"
              style={{ fontSize: u(11.5) }}
            >
              <PencilLine className="size-3.5" />
              Edit on slide
            </span>
          }
        >
          <TextareaMock>Q2 Launch</TextareaMock>
        </Section>
        <div className="mt-auto">
          <Collapsible title="Comment" />
          <Collapsible title="Source" />
        </div>
      </Panel>
    </EditorFrame>
  );
}

function EditorFrame({ ref, children }: { ref: Ref<HTMLDivElement>; children: ReactNode }) {
  return (
    <div
      ref={ref}
      className="relative select-none overflow-hidden rounded-lg bg-[color:var(--color-panel)] shadow-[var(--shadow-window)]"
      style={{ containerType: 'inline-size' }}
    >
      <div
        className="relative grid aspect-[3/2] grid-cols-[1fr_calc(320*var(--u))] font-[family-name:var(--font-sans)] text-[color:var(--color-text)]"
        style={{ ...mockVars, letterSpacing: '-0.005em' }}
      >
        {children}
      </div>
    </div>
  );
}

function Canvas({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-[color:var(--color-panel-hi)]">{children}</div>
  );
}

function Slide({
  titleColor,
  titleSize,
  selected,
}: {
  titleColor: string;
  titleSize?: MotionValue<string>;
  selected: boolean;
}) {
  return (
    <div
      className="absolute left-1/2 top-1/2 flex aspect-video -translate-x-1/2 -translate-y-1/2 flex-col justify-center gap-3.5 bg-[color:var(--color-panel)] px-9 shadow-[var(--shadow-edge)]"
      style={{ width: `calc(100% - ${u(48)})` }}
    >
      <span
        className="font-[family-name:var(--font-mono)] uppercase text-[color:var(--color-muted)]"
        style={{ fontSize: u(6), letterSpacing: '0.18em' }}
      >
        cover
      </span>
      <div className="relative w-fit">
        <motion.span
          className="block font-semibold leading-none"
          style={{
            fontSize: titleSize ?? u(SIZE_FROM * SLIDE_SCALE),
            letterSpacing: '-0.035em',
            color: titleColor,
            transition: 'color 600ms ease',
          }}
        >
          Q2 Launch
        </motion.span>
        <SelectionFrame visible={selected} />
      </div>
      <span className="text-[color:var(--color-text-soft)]" style={{ fontSize: u(7.5) }}>
        What we're shipping, why it matters.
      </span>
    </div>
  );
}

const HANDLES = [
  [0, 0],
  [0.5, 0],
  [1, 0],
  [1, 0.5],
  [1, 1],
  [0.5, 1],
  [0, 1],
  [0, 0.5],
];

function SelectionFrame({ visible }: { visible: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 border border-blue-500"
      initial={false}
      animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="absolute -top-5 left-1/2 h-5 w-px bg-blue-500" />
      <span className="absolute -top-6 left-1/2 size-2.5 -translate-x-1/2 rounded-full border border-blue-500 bg-[color:var(--color-panel)] shadow-sm" />
      {HANDLES.map(([x, y]) => (
        <span
          key={`${x}-${y}`}
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-blue-500 bg-[color:var(--color-panel)] shadow-sm"
          style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
        />
      ))}
    </motion.div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border-l border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)]">
      <header className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-[color:var(--color-rule)] px-3">
        <div className="flex items-center gap-2">
          <Paintbrush className="size-3.5 text-[color:var(--color-muted)]" />
          <span className="font-semibold tracking-tight" style={{ fontSize: u(12) }}>
            Format
          </span>
        </div>
        <GhostIcon icon={X} />
      </header>

      <div className="flex shrink-0 items-center justify-between gap-3 px-3.5 pt-3.5 pb-1">
        <div className="flex items-center gap-2 font-medium" style={{ fontSize: u(12) }}>
          <Type className="size-4 text-[color:var(--color-muted)]" />
          <span>Text</span>
        </div>
        <div className="relative isolate flex h-8 items-center rounded-lg bg-[color:var(--m-muted)] p-[2px] ring-1 ring-inset ring-[color:var(--color-rule)]/60">
          <span
            aria-hidden
            className="absolute inset-y-0.5 left-0.5 w-8 rounded-md bg-[color:var(--color-panel)] shadow-[var(--shadow-edge)]"
          />
          <span className="relative z-10 flex h-full w-8 items-center justify-center text-[color:var(--color-text)]">
            <Type className="size-3.5" />
          </span>
          <span className="relative z-10 flex h-full w-8 items-center justify-center text-[color:var(--color-text)]/55">
            <Move className="size-3.5" />
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </aside>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span
      className="font-medium uppercase text-[color:var(--color-muted)]"
      style={{ fontSize: u(11), letterSpacing: '0.08em' }}
    >
      {children}
    </span>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="px-3.5 py-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <Eyebrow>{title}</Eyebrow>
        {action ? <span className="-my-1 flex items-center">{action}</span> : null}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

function Collapsible({
  title,
  open = false,
  children,
}: {
  title: string;
  open?: boolean;
  children?: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 px-3.5 py-4">
        <Eyebrow>{title}</Eyebrow>
        <ChevronRight
          className={`size-3 text-[color:var(--color-muted)] ${open ? 'rotate-90' : ''}`}
        />
      </div>
      {open ? <div className="-mt-1.5 flex flex-col gap-2.5 px-3.5 pb-4">{children}</div> : null}
    </div>
  );
}

function TypographyRows({ size }: { size: string | MotionValue<string> }) {
  return (
    <>
      <div className="flex items-center gap-1.5">
        <div
          className="flex h-7 min-w-0 flex-1 items-center justify-between gap-2 rounded-[calc(5*var(--u))] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] px-2.5"
          style={{ fontSize: u(12) }}
        >
          <span className="truncate">Semibold · 600</span>
          <ChevronDown className="size-3.5 opacity-50" />
        </div>
        <NumberShell icon={ALargeSmall} suffix="px" className="w-24">
          <motion.span>{size}</motion.span>
        </NumberShell>
      </div>
      <div className="flex items-center gap-2">
        <ToggleGroup items={[{ icon: Bold, pressed: true }, { icon: Italic }]} />
        <ToggleGroup
          items={[
            { icon: AlignLeft, pressed: true },
            { icon: AlignCenter },
            { icon: AlignRight },
            { icon: AlignJustify },
          ]}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <NumberShell icon={UnfoldVertical} className="basis-0 grow">
          1.1
        </NumberShell>
        <NumberShell icon={MoveHorizontal} suffix="px" className="basis-0 grow">
          -5.6
        </NumberShell>
      </div>
    </>
  );
}

function NumberShell({
  icon: Icon,
  suffix,
  className = '',
  children,
}: {
  icon: LucideIcon;
  suffix?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex h-7 shrink-0 items-center rounded-[calc(5*var(--u))] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] pl-2 pr-1.5 ${className}`}
    >
      <Icon className="size-3.5 shrink-0 text-[color:var(--color-muted)]" />
      <span
        className="nums min-w-0 flex-1 px-2 text-right font-[family-name:var(--font-mono)]"
        style={{ fontSize: u(11) }}
      >
        {children}
      </span>
      {suffix ? (
        <span
          className="font-[family-name:var(--font-mono)] uppercase text-[color:var(--color-muted)]/80"
          style={{ fontSize: u(9.5), letterSpacing: '0.06em' }}
        >
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

function ToggleGroup({ items }: { items: { icon: LucideIcon; pressed?: boolean }[] }) {
  return (
    <div className="flex w-fit items-center">
      {items.map(({ icon: Icon, pressed }, i) => (
        <span
          key={Icon.displayName ?? i}
          className={`inline-flex size-7 items-center justify-center border border-[color:var(--color-rule)] ${
            i > 0 ? 'border-l-0' : 'rounded-l-[calc(5*var(--u))]'
          } ${i === items.length - 1 ? 'rounded-r-[calc(5*var(--u))]' : ''} ${
            pressed
              ? 'border-[color:var(--color-text)] bg-[color:var(--color-text)] text-[color:var(--color-panel)]'
              : 'bg-[color:var(--color-panel)] text-[color:var(--color-text)]/75'
          }`}
        >
          <Icon className="size-3.5" />
        </span>
      ))}
    </div>
  );
}

function ColorRow({ label, value, dim = false }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className="grid grid-cols-[calc(68*var(--u))_1fr] items-center gap-3">
      <span className="text-[color:var(--color-muted)]" style={{ fontSize: u(11) }}>
        {label}
      </span>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-[calc(5*var(--u))] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)]">
          <span
            className="size-4 rounded-[calc(3*var(--u))]"
            style={
              dim
                ? {
                    backgroundImage:
                      'repeating-conic-gradient(var(--m-muted) 0 25%, transparent 0 50%)',
                    backgroundSize: `${u(8)} ${u(8)}`,
                  }
                : { backgroundColor: value }
            }
          />
        </span>
        <span
          className="nums flex h-7 flex-1 items-center rounded-[calc(5*var(--u))] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] px-2 font-[family-name:var(--font-mono)] uppercase"
          style={{ fontSize: u(11) }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function TextareaMock({
  placeholder,
  focused = false,
  children,
}: {
  placeholder?: string;
  focused?: boolean;
  children?: ReactNode;
}) {
  const empty = children === null || children === undefined;
  return (
    <div
      className={`flex min-h-16 w-full whitespace-pre rounded-[calc(6*var(--u))] border bg-[color:var(--color-panel)] px-2.5 py-2 leading-relaxed transition-[border-color,box-shadow] ${
        focused
          ? 'border-[color:var(--color-text)]/40 shadow-[0_0_0_calc(2*var(--u))_var(--m-brand-soft)]'
          : 'border-[color:var(--color-rule)]'
      }`}
      style={{ fontSize: u(12) }}
    >
      {empty ? (
        <span className="text-[color:var(--color-muted)]/70">{placeholder}</span>
      ) : (
        <span>
          {children}
          {focused ? (
            <span className="ml-px inline-block h-[1.15em] w-px animate-pulse bg-[color:var(--color-text)] align-[-0.2em]" />
          ) : null}
        </span>
      )}
    </div>
  );
}

function BrandButton({
  disabled = false,
  pressed = false,
  children,
}: {
  disabled?: boolean;
  pressed?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-[calc(5*var(--u))] bg-[color:var(--color-accent)] px-2.5 font-medium text-white shadow-[inset_0_1px_0_oklch(1_0_0/0.18)] transition-[opacity,transform] duration-150 ${
        disabled ? 'opacity-45' : ''
      } ${pressed ? 'scale-95' : ''}`}
      style={{ fontSize: u(12) }}
    >
      {children}
    </span>
  );
}

function GhostIcon({ icon: Icon, dim = false }: { icon: LucideIcon; dim?: boolean }) {
  return (
    <span
      className={`inline-flex size-7 items-center justify-center rounded-[calc(5*var(--u))] text-[color:var(--color-muted)] ${dim ? 'opacity-45' : ''}`}
    >
      <Icon className="size-3.5" />
    </span>
  );
}

function AgentBadge() {
  return (
    <span
      className="flex shrink-0 items-center gap-1.5 rounded-[calc(3*var(--u))] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] px-1.5 py-px text-[color:var(--color-text)]/85"
      style={{ fontSize: u(10.5) }}
    >
      <span className="relative flex size-1.5 items-center justify-center">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
      </span>
      Agent is watching
    </span>
  );
}

function CommentFab({ count }: { count: number }) {
  return (
    <div
      className="absolute right-4 bottom-4 flex items-center gap-2 rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] px-3 py-2 font-medium shadow-[var(--shadow-floating)]"
      style={{ fontSize: u(12) }}
    >
      <MessageSquare className="size-4" />
      <span className="nums">{count}</span>
    </div>
  );
}

function SaveCardMock({ visible, phase }: { visible: boolean; phase: EditPhase }) {
  const saved = phase === 'saved';
  const saving = phase === 'saving';
  return (
    <motion.div
      className="pointer-events-none absolute bottom-6 left-1/2"
      initial={false}
      animate={
        visible
          ? { opacity: 1, y: 0, scale: 1, x: '-50%' }
          : { opacity: 0, y: 8, scale: 0.98, x: '-50%' }
      }
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex h-9 items-center gap-1 whitespace-nowrap rounded-[calc(8*var(--u))] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)]/95 py-0.5 pr-0.5 pl-1 shadow-[var(--shadow-floating)] backdrop-blur-md">
        {!saved ? (
          <div className="flex items-center">
            <GhostIcon icon={Undo2} />
            <GhostIcon icon={Redo2} dim />
            <span aria-hidden className="ml-1 mr-0.5 h-4 w-px bg-[color:var(--color-rule)]" />
          </div>
        ) : null}
        {saved ? (
          <span
            className="flex items-center gap-1.5 px-2.5 font-medium text-[color:var(--color-text)]"
            style={{ fontSize: u(12) }}
          >
            <Check className="size-3.5 shrink-0 text-[color:var(--color-mint)]" strokeWidth={2.5} />
            Saved
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 font-medium text-[color:var(--color-text)]"
            style={{ fontSize: u(12) }}
          >
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full bg-[color:var(--color-accent)] shadow-[0_0_0_calc(3*var(--u))_var(--m-brand-soft)]"
            />
            <span className="nums">1 unsaved change</span>
          </span>
        )}
        {!saved && !saving ? (
          <span
            className="inline-flex h-7 items-center rounded-[calc(5*var(--u))] px-2.5 font-medium text-[color:var(--color-muted)]"
            style={{ fontSize: u(12) }}
          >
            Discard
          </span>
        ) : null}
        {!saved ? (
          <span
            className={`inline-flex h-7 items-center gap-1.5 rounded-[calc(5*var(--u))] bg-[color:var(--color-accent)] px-3 font-medium text-white shadow-[inset_0_1px_0_oklch(1_0_0/0.18)] transition-transform duration-150 ${
              phase === 'pressed' ? 'scale-95' : ''
            }`}
            style={{ fontSize: u(12) }}
          >
            {saving ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-[1.5px] border-white/40 border-t-white" />
                Saving
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                Save
              </>
            )}
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}
