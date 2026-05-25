'use client';

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import { type ReactNode, useEffect, useRef } from 'react';

export function Inspector() {
  return (
    <section id="inspector" className="relative">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-[color:var(--color-rule)]" />
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 py-20 sm:py-32 lg:py-40">
        <h2 className="text-[32px] sm:text-[44px] lg:text-[64px] leading-[1.1] sm:leading-[1.05] tracking-[-0.03em] max-w-[860px] mb-14 sm:mb-20">
          <span className="font-[family-name:var(--font-sans)] font-medium">
            Talk to the agent.
          </span>
          <br />
          <span className="font-[family-name:var(--font-display)] italic text-[color:var(--color-accent)]">
            Or just tap the canvas.
          </span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[color:var(--color-rule)] border border-[color:var(--color-rule)] rounded-[6px] overflow-hidden">
          <FeatureCell
            num="01"
            kicker="agent applies"
            title="Drop a comment. The agent rewrites the file."
            body={
              <>
                Click any block, leave a note. The inspector pins it as a{' '}
                <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-accent-soft)]">
                  @slide-comment
                </span>{' '}
                marker in your source. Run{' '}
                <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-accent-soft)]">
                  /apply-comments
                </span>{' '}
                — the agent edits exactly what you flagged and clears the marker.
              </>
            }
            visual={<AgentApplyVisual />}
          />
          <FeatureCell
            num="02"
            kicker="visual editor"
            title="Click. Tweak. Save."
            body="Toggle inspect, click any element. Change text, font, weight, color, or swap an image — right on the canvas. Edits buffer in memory until you hit Save, so one batch lands as a single HMR write."
            visual={<VisualEditorVisual />}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCell({
  num,
  kicker,
  title,
  body,
  visual,
}: {
  num: string;
  kicker: string;
  title: string;
  body: ReactNode;
  visual: ReactNode;
}) {
  return (
    <div className="group relative bg-[color:var(--color-ink)] flex flex-col gap-10 p-8 sm:p-10 lg:p-12 transition-colors hover:bg-[color:var(--color-panel)]">
      <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[color:var(--color-muted)]">
        {num} · {kicker}
      </span>

      <div>
        <h3 className="text-[22px] sm:text-[26px] lg:text-[30px] font-medium tracking-[-0.025em] leading-[1.15] max-w-[28ch]">
          {title}
        </h3>
        <p className="mt-4 text-[15px] leading-[1.65] text-[color:var(--color-text-soft)] max-w-[44ch]">
          {body}
        </p>
      </div>

      <div className="mt-auto">{visual}</div>
    </div>
  );
}

const AGENT_LOOP_DURATION = 10;
const COMMENT_TEXT = 'use the accent color on this title';

function AgentApplyVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduced = useReducedMotion();
  const active = inView && !reduced;

  const typingProgress = useMotionValue(1);
  const commentText = useTransform(typingProgress, (p) =>
    COMMENT_TEXT.slice(0, Math.max(0, Math.round(p * COMMENT_TEXT.length))),
  );

  useEffect(() => {
    if (!active) {
      typingProgress.set(1);
      return;
    }
    typingProgress.set(0);
    const controls = animate(typingProgress, [0, 0, 1, 1, 0, 0], {
      duration: AGENT_LOOP_DURATION,
      times: [0, 0.3, 0.52, 0.78, 0.82, 1],
      ease: 'linear',
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [active, typingProgress]);

  const loopTransition = (times: number[]) =>
    active
      ? {
          duration: AGENT_LOOP_DURATION,
          times,
          ease: 'easeInOut' as const,
          repeat: Infinity,
        }
      : undefined;

  return (
    <div
      ref={ref}
      className="relative rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] overflow-hidden"
    >
      <div
        className="relative aspect-[16/9] grid grid-cols-[1fr_42%]"
        style={{ containerType: 'inline-size' }}
      >
        {/* canvas */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 px-[5cqw] py-[5cqw] flex flex-col justify-center gap-[1.4cqw]">
            <span className="font-[family-name:var(--font-mono)] text-[1.3cqw] tracking-[0.18em] uppercase text-[color:var(--color-muted)]">
              cover
            </span>
            <div className="relative inline-flex w-fit">
              <motion.span
                aria-hidden
                className="absolute -inset-[0.6cqw] border-2 border-[#3b82f6] bg-[#3b82f6]/10 pointer-events-none"
                animate={
                  active
                    ? {
                        opacity: [0, 0, 1, 1, 0, 0],
                        scale: [0.92, 0.92, 1, 1, 0.96, 0.96],
                      }
                    : { opacity: 1, scale: 1 }
                }
                transition={loopTransition([0, 0.11, 0.14, 0.86, 0.92, 1])}
              />
              <motion.span
                className="relative font-[family-name:var(--font-sans)] font-semibold tracking-[-0.035em] leading-[1.0]"
                style={{ fontSize: '6.4cqw' }}
                animate={
                  active
                    ? {
                        color: [
                          'var(--color-text)',
                          'var(--color-text)',
                          'var(--color-accent)',
                          'var(--color-accent)',
                          'var(--color-text)',
                          'var(--color-text)',
                        ],
                      }
                    : { color: 'var(--color-text)' }
                }
                transition={loopTransition([0, 0.7, 0.74, 0.86, 0.92, 1])}
              >
                Q2 Launch
              </motion.span>
            </div>
            <span
              className="font-[family-name:var(--font-sans)] text-[color:var(--color-text-soft)] max-w-[80%]"
              style={{ fontSize: '1.5cqw', lineHeight: 1.4 }}
            >
              What we're shipping, why it matters.
            </span>
          </div>

          {/* crosshair cursor — flies in, clicks Q2 Launch, fades */}
          <motion.svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            strokeWidth={1.6}
            strokeLinecap="round"
            className="absolute pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
            style={{
              left: '7cqw',
              top: 'calc(50% - 1.5cqw)',
              width: '3cqw',
              height: '3cqw',
            }}
            animate={
              active
                ? {
                    opacity: [0, 0, 1, 1, 1, 0, 0],
                    x: ['14cqw', '14cqw', '0cqw', '0cqw', '0cqw', '0cqw', '0cqw'],
                    y: ['7cqw', '7cqw', '0cqw', '0cqw', '0cqw', '0cqw', '0cqw'],
                    scale: [1, 1, 1, 0.78, 1, 1, 1],
                  }
                : { opacity: 0 }
            }
            transition={loopTransition([0, 0.02, 0.1, 0.115, 0.13, 0.16, 1])}
          >
            <title>cursor</title>
            <line x1="12" y1="2" x2="12" y2="9" />
            <line x1="12" y1="15" x2="12" y2="22" />
            <line x1="2" y1="12" x2="9" y2="12" />
            <line x1="15" y1="12" x2="22" y2="12" />
            <circle cx="12" cy="12" r="2.5" fill="#3b82f6" fillOpacity={0.25} />
          </motion.svg>

          {/* "Agent applying..." status pill — appears after submit, fades before style change settles */}
          <motion.div
            className="absolute right-[1.5cqw] bottom-[1.5cqw] inline-flex items-center gap-[0.55cqw] rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)] font-[family-name:var(--font-sans)] text-[color:var(--color-text)] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]"
            style={{ padding: '0.55cqw 0.9cqw', fontSize: '1.05cqw' }}
            animate={
              active
                ? {
                    opacity: [0, 0, 1, 1, 0, 0],
                    y: ['40%', '40%', '0%', '0%', '40%', '40%'],
                  }
                : { opacity: 0, y: '40%' }
            }
            transition={loopTransition([0, 0.55, 0.6, 0.78, 0.82, 1])}
          >
            <SpinnerGlyph active={active} />
            <span style={{ color: 'var(--color-muted)' }}>Agent applying</span>
            <ApplyingDots active={active} />
          </motion.div>
        </div>

        {/* InspectorPanel — slides in from the right after click */}
        <motion.div
          className="border-l border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)] flex flex-col overflow-hidden"
          animate={active ? { x: ['100%', '100%', '0%', '0%', '100%', '100%'] } : { x: '0%' }}
          transition={loopTransition([0, 0.15, 0.24, 0.86, 0.93, 1])}
        >
          {/* header */}
          <div
            className="border-b border-[color:var(--color-rule)] flex items-center justify-between"
            style={{ padding: '1.4cqw 1.6cqw' }}
          >
            <div className="flex items-center gap-[0.6cqw]">
              <span
                className="font-[family-name:var(--font-sans)] font-semibold tracking-tight text-[color:var(--color-text)]"
                style={{ fontSize: '1.25cqw' }}
              >
                Inspect
              </span>
              <span
                aria-hidden
                className="bg-[color:var(--color-rule)]"
                style={{ width: '1px', height: '1.4cqw' }}
              />
              <span
                className="rounded-[3px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] font-[family-name:var(--font-mono)] text-[color:var(--color-text)]"
                style={{ padding: '0.1cqw 0.5cqw', fontSize: '1cqw' }}
              >
                &lt;h1&gt;
              </span>
            </div>
            <span className="text-[color:var(--color-dim)]">✕</span>
          </div>

          <PanelSection label="Content">
            <PanelTextarea value="Q2 Launch" />
          </PanelSection>

          <PanelDivider />

          <PanelSection label="Leave a comment">
            <motion.div
              className="relative rounded-[4px] border bg-[color:var(--color-panel)]"
              style={{
                fontSize: '1.1cqw',
                padding: '0.7cqw 0.8cqw',
                minHeight: '3.4cqw',
                lineHeight: 1.4,
              }}
              animate={
                active
                  ? {
                      borderColor: [
                        'var(--color-rule)',
                        'var(--color-rule)',
                        'var(--color-accent)',
                        'var(--color-accent)',
                        'var(--color-rule)',
                        'var(--color-rule)',
                      ],
                      boxShadow: [
                        '0 0 0 0 transparent',
                        '0 0 0 0 transparent',
                        '0 0 0 0.25cqw color-mix(in oklab, var(--color-accent) 16%, transparent)',
                        '0 0 0 0.25cqw color-mix(in oklab, var(--color-accent) 16%, transparent)',
                        '0 0 0 0 transparent',
                        '0 0 0 0 transparent',
                      ],
                    }
                  : {
                      borderColor: 'var(--color-rule)',
                      boxShadow: '0 0 0 0 transparent',
                    }
              }
              transition={loopTransition([0, 0.25, 0.3, 0.78, 0.82, 1])}
            >
              <motion.span
                aria-hidden
                className="absolute pointer-events-none text-[color:var(--color-muted)]"
                style={{ left: '0.8cqw', top: '0.7cqw' }}
                animate={active ? { opacity: [1, 1, 0, 0, 1, 1] } : { opacity: 0 }}
                transition={loopTransition([0, 0.28, 0.3, 0.78, 0.82, 1])}
              >
                Add a note...
              </motion.span>
              <motion.span className="text-[color:var(--color-text)]">{commentText}</motion.span>
              <motion.span
                aria-hidden
                className="inline-block align-[-0.15em] bg-[color:var(--color-text)]"
                style={{
                  width: '0.12cqw',
                  height: '1.3cqw',
                  marginLeft: '0.15cqw',
                }}
                animate={active ? { opacity: [0, 0, 1, 1, 0, 0] } : { opacity: 0 }}
                transition={loopTransition([0, 0.28, 0.3, 0.54, 0.56, 1])}
              />
            </motion.div>
            <div className="flex items-center justify-between" style={{ marginTop: '0.7cqw' }}>
              <span
                className="font-[family-name:var(--font-mono)] text-[color:var(--color-dim)]"
                style={{ fontSize: '0.95cqw' }}
              >
                Cmd + Enter to submit
              </span>
              <motion.span
                className="inline-flex items-center font-[family-name:var(--font-sans)] font-medium text-[color:var(--color-brand-foreground,white)] rounded-[4px] bg-[color:var(--color-accent)]"
                style={{ fontSize: '1.1cqw', padding: '0.45cqw 0.9cqw' }}
                animate={active ? { scale: [1, 1, 0.94, 1, 1] } : { scale: 1 }}
                transition={loopTransition([0, 0.52, 0.54, 0.57, 1])}
              >
                Add comment
              </motion.span>
            </div>
          </PanelSection>
        </motion.div>
      </div>
    </div>
  );
}

function SpinnerGlyph({ active }: { active: boolean }) {
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-accent)"
      strokeWidth={2.2}
      strokeLinecap="round"
      style={{ width: '1.3cqw', height: '1.3cqw' }}
      animate={active ? { rotate: 360 } : { rotate: 0 }}
      transition={active ? { duration: 1.1, repeat: Infinity, ease: 'linear' } : undefined}
    >
      <title>spinner</title>
      <path d="M21 12a9 9 0 1 1-9-9" />
    </motion.svg>
  );
}

function ApplyingDots({ active }: { active: boolean }) {
  return (
    <span
      className="inline-flex items-end gap-[0.15cqw] text-[color:var(--color-muted)]"
      style={{ width: '1.8cqw' }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block rounded-full bg-current"
          style={{ width: '0.32cqw', height: '0.32cqw' }}
          animate={active ? { opacity: [0.25, 1, 0.25] } : { opacity: 0.5 }}
          transition={
            active
              ? {
                  duration: 1.1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.18,
                }
              : undefined
          }
        />
      ))}
    </span>
  );
}

function VisualEditorVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduced = useReducedMotion();
  const active = inView && !reduced;

  const progress = useMotionValue(0.38);
  const fontSize = useTransform(progress, [0.38, 0.65], ['6.4cqw', '7.6cqw']);
  const barWidth = useTransform(progress, (p) => `${p * 100}%`);
  const thumbLeft = useTransform(progress, (p) => `calc(${p * 100}% - 0.55cqw)`);
  const sizeNum = useTransform(progress, [0.38, 0.65], [88, 104]);
  const sizeLabel = useTransform(sizeNum, (v) => `${Math.round(v)}px`);

  useEffect(() => {
    if (!active) {
      progress.set(0.38);
      return;
    }
    const controls = animate(progress, [0.38, 0.65, 0.65, 0.38, 0.38], {
      duration: 6,
      times: [0, 0.2, 0.5, 0.7, 1],
      ease: 'easeInOut',
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [active, progress]);

  return (
    <div
      ref={ref}
      className="relative rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] overflow-hidden"
    >
      <div
        className="relative aspect-[16/9] grid grid-cols-[1fr_42%]"
        style={{ containerType: 'inline-size' }}
      >
        {/* canvas */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 px-[5cqw] py-[5cqw] flex flex-col justify-center gap-[1.4cqw]">
            <span className="font-[family-name:var(--font-mono)] text-[1.3cqw] tracking-[0.18em] uppercase text-[color:var(--color-muted)]">
              cover
            </span>
            <div className="relative inline-flex w-fit">
              <span
                aria-hidden
                className="absolute -inset-[0.6cqw] border-2 border-[#3b82f6] bg-[#3b82f6]/10 pointer-events-none"
              />
              <motion.span
                className="relative font-[family-name:var(--font-sans)] font-semibold tracking-[-0.035em] leading-[1.0] text-[color:var(--color-accent)]"
                style={{ fontSize }}
              >
                Q2 Launch
              </motion.span>
            </div>
            <span
              className="font-[family-name:var(--font-sans)] text-[color:var(--color-text-soft)] max-w-[80%]"
              style={{ fontSize: '1.5cqw', lineHeight: 1.4 }}
            >
              What we're shipping, why it matters.
            </span>
          </div>

          {/* SaveBar — matches core/SaveCard layout */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: '3cqw' }}>
            <div
              className="inline-flex items-center gap-[0.4cqw] whitespace-nowrap rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)]/95 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]"
              style={{ padding: '0.35cqw 0.35cqw 0.35cqw 0.5cqw' }}
            >
              <SaveBarIconBtn glyph={<UndoGlyph />} />
              <SaveBarIconBtn glyph={<RedoGlyph />} dim />
              <span
                aria-hidden
                className="bg-[color:var(--color-rule)]"
                style={{ width: '1px', height: '1.6cqw', margin: '0 0.2cqw' }}
              />
              <span
                className="inline-flex items-center gap-[0.5cqw] font-[family-name:var(--font-sans)] font-medium text-[color:var(--color-text)]"
                style={{ padding: '0 0.7cqw', fontSize: '1.25cqw' }}
              >
                <motion.span
                  className="rounded-full bg-[color:var(--color-accent)]"
                  style={{ width: '0.7cqw', height: '0.7cqw' }}
                  animate={
                    active
                      ? {
                          boxShadow: [
                            '0 0 0 0.3cqw color-mix(in oklab, var(--color-accent) 18%, transparent)',
                            '0 0 0 0.55cqw color-mix(in oklab, var(--color-accent) 6%, transparent)',
                            '0 0 0 0.3cqw color-mix(in oklab, var(--color-accent) 18%, transparent)',
                          ],
                        }
                      : {
                          boxShadow:
                            '0 0 0 0.3cqw color-mix(in oklab, var(--color-accent) 18%, transparent)',
                        }
                  }
                  transition={
                    active ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : undefined
                  }
                />
                <span>1 unsaved change</span>
              </span>
              <span
                className="font-[family-name:var(--font-sans)] text-[color:var(--color-muted)]"
                style={{ fontSize: '1.2cqw', padding: '0.4cqw 0.8cqw' }}
              >
                Discard
              </span>
              <span
                className="inline-flex items-center gap-[0.4cqw] font-[family-name:var(--font-sans)] font-medium text-[color:var(--color-brand-foreground,white)] rounded-[4px] bg-[color:var(--color-accent)]"
                style={{ fontSize: '1.2cqw', padding: '0.45cqw 0.9cqw' }}
              >
                <SaveGlyph />
                Save
              </span>
            </div>
          </div>
        </div>

        {/* InspectorPanel */}
        <div className="border-l border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)] flex flex-col overflow-hidden">
          {/* header */}
          <div
            className="border-b border-[color:var(--color-rule)] flex items-center justify-between"
            style={{ padding: '1.4cqw 1.6cqw' }}
          >
            <div className="flex items-center gap-[0.6cqw]">
              <span
                className="font-[family-name:var(--font-sans)] font-semibold tracking-tight text-[color:var(--color-text)]"
                style={{ fontSize: '1.25cqw' }}
              >
                Inspect
              </span>
              <span
                aria-hidden
                className="bg-[color:var(--color-rule)]"
                style={{ width: '1px', height: '1.4cqw' }}
              />
              <span
                className="rounded-[3px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] font-[family-name:var(--font-mono)] text-[color:var(--color-text)]"
                style={{ padding: '0.1cqw 0.5cqw', fontSize: '1cqw' }}
              >
                &lt;h1&gt;
              </span>
            </div>
            <span className="text-[color:var(--color-dim)]">✕</span>
          </div>

          <PanelSection label="Content">
            <PanelTextarea value="Q2 Launch" />
          </PanelSection>

          <PanelDivider />

          <PanelSection label="Typography">
            <PanelRow label="Size">
              <div className="flex-1 h-[0.5cqw] rounded-full bg-[color:var(--color-panel)] relative">
                <motion.div
                  className="absolute left-0 top-0 bottom-0 rounded-full bg-[color:var(--color-accent)]"
                  style={{ width: barWidth }}
                />
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 rounded-full bg-[color:var(--color-text)] border border-[color:var(--color-accent)]"
                  style={{
                    width: '1.1cqw',
                    height: '1.1cqw',
                    left: thumbLeft,
                  }}
                />
              </div>
              <motion.span
                className="flex-1 rounded-[4px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] text-[color:var(--color-text)] font-[family-name:var(--font-mono)]"
                style={{ fontSize: '1.05cqw', padding: '0.4cqw 0.6cqw' }}
              >
                {sizeLabel}
              </motion.span>
            </PanelRow>
            <PanelRow label="Weight">
              <PanelSelect value="Semibold · 600" />
            </PanelRow>
            <PanelRow label="Style">
              <div className="flex items-center gap-[0.4cqw]">
                <PanelToggle glyph={<BoldGlyph />} pressed />
                <PanelToggle glyph={<ItalicGlyph />} />
              </div>
            </PanelRow>
          </PanelSection>

          <PanelDivider />

          <PanelSection label="Color">
            <PanelRow label="Text">
              <PanelSwatch color="var(--color-accent)" />
              <PanelInput value="#D56B48" mono uppercase />
            </PanelRow>
          </PanelSection>
        </div>
      </div>
    </div>
  );
}

function PanelSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[0.9cqw]" style={{ padding: '1.2cqw 1.6cqw' }}>
      <span
        className="font-[family-name:var(--font-sans)] font-medium text-[color:var(--color-text-soft)]"
        style={{ fontSize: '1cqw' }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function PanelDivider() {
  return <div className="h-px bg-[color:var(--color-rule)]" />;
}

function PanelRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[34%_1fr] items-center gap-[0.7cqw]">
      <span
        className="font-[family-name:var(--font-sans)] text-[color:var(--color-muted)]"
        style={{ fontSize: '1.1cqw' }}
      >
        {label}
      </span>
      <div className="flex items-center gap-[0.5cqw]">{children}</div>
    </div>
  );
}

function PanelInput({
  value,
  mono = true,
  uppercase = false,
}: {
  value: string;
  mono?: boolean;
  uppercase?: boolean;
}) {
  return (
    <span
      className={`flex-1 rounded-[4px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] text-[color:var(--color-text)] ${
        mono ? 'font-[family-name:var(--font-mono)]' : 'font-[family-name:var(--font-sans)]'
      } ${uppercase ? 'uppercase' : ''}`}
      style={{ fontSize: '1.05cqw', padding: '0.4cqw 0.6cqw' }}
    >
      {value}
    </span>
  );
}

function PanelSelect({ value }: { value: string }) {
  return (
    <span
      className="flex-1 inline-flex items-center justify-between rounded-[4px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] font-[family-name:var(--font-sans)] text-[color:var(--color-text)]"
      style={{ fontSize: '1.05cqw', padding: '0.4cqw 0.6cqw' }}
    >
      <span>{value}</span>
      <span className="text-[color:var(--color-muted)]" style={{ fontSize: '1cqw' }}>
        ▾
      </span>
    </span>
  );
}

function PanelToggle({ glyph, pressed = false }: { glyph: ReactNode; pressed?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[4px] border ${
        pressed
          ? 'border-[color:var(--color-rule)] bg-[color:var(--color-panel)] text-[color:var(--color-text)]'
          : 'border-[color:var(--color-rule)] bg-transparent text-[color:var(--color-muted)]'
      }`}
      style={{ width: '2.4cqw', height: '2.4cqw' }}
    >
      {glyph}
    </span>
  );
}

function PanelSwatch({ color }: { color: string }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[4px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)]"
      style={{ width: '2.4cqw', height: '2.4cqw' }}
    >
      <span
        className="rounded-[2px]"
        style={{
          width: '1.5cqw',
          height: '1.5cqw',
          backgroundColor: color,
        }}
      />
    </span>
  );
}

function PanelTextarea({ value }: { value: string }) {
  return (
    <span
      className="block rounded-[4px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] font-[family-name:var(--font-sans)] text-[color:var(--color-text)]"
      style={{
        fontSize: '1.1cqw',
        padding: '0.7cqw 0.7cqw',
        minHeight: '3.6cqw',
        lineHeight: 1.4,
      }}
    >
      {value}
    </span>
  );
}

function SaveBarIconBtn({ glyph, dim = false }: { glyph: ReactNode; dim?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[4px] ${
        dim ? 'text-[color:var(--color-dim)]' : 'text-[color:var(--color-muted)]'
      }`}
      style={{ width: '2cqw', height: '2cqw' }}
    >
      {glyph}
    </span>
  );
}

function UndoGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: '1.2cqw', height: '1.2cqw' }}
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10h-4" />
    </svg>
  );
}

function RedoGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: '1.2cqw', height: '1.2cqw' }}
    >
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9a5 5 0 0 0 0 10h4" />
    </svg>
  );
}

function SaveGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: '1.1cqw', height: '1.1cqw' }}
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );
}

function BoldGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: '1.2cqw', height: '1.2cqw' }}
    >
      <path d="M6 4h7a4 4 0 0 1 0 8H6z" />
      <path d="M6 12h8a4 4 0 0 1 0 8H6z" />
    </svg>
  );
}

function ItalicGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: '1.2cqw', height: '1.2cqw' }}
    >
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}
