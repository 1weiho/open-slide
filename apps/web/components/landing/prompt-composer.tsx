'use client';

import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { SectionRule } from './frame';

const prompts = [
  'a Q2 product launch',
  'an investor-ready pitch',
  'our quarterly business review',
  'a conference keynote',
  'a customer success story',
] as const;

const promptVariants = {
  enter: {
    opacity: 0,
    transform: 'translateY(20px) rotateX(-72deg)',
    filter: 'blur(3px)',
  },
  center: {
    opacity: 1,
    transform: 'translateY(0px) rotateX(0deg)',
    filter: 'blur(0px)',
  },
  exit: {
    opacity: 0,
    transform: 'translateY(-20px) rotateX(72deg)',
    filter: 'blur(3px)',
  },
};

const reducedPromptVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

export function PromptComposer() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { margin: '-20% 0px -20% 0px' });
  const reduceMotion = useReducedMotion();
  const [promptIndex, setPromptIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isInView || isPaused) return;

    const interval = window.setInterval(() => {
      setPromptIndex((current) => (current + 1) % prompts.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, [isInView, isPaused]);

  const prompt = prompts[promptIndex];
  const variants = reduceMotion ? reducedPromptVariants : promptVariants;

  return (
    <section
      id="prompt"
      ref={sectionRef}
      className="prompt-stage relative flex min-h-[420px] items-center overflow-hidden sm:min-h-[520px]"
      aria-labelledby="prompt-composer-heading"
    >
      <SectionRule />
      <h2 id="prompt-composer-heading" className="sr-only">
        Create a slide deck with a prompt
      </h2>

      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="prompt-stage-grid absolute inset-0" />
        <div className="prompt-stage-glow absolute left-1/2 top-1/2 h-[260px] w-[min(90vw,820px)] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      </div>

      <div className="relative mx-auto w-full max-w-[860px] px-5 py-24 sm:px-8 lg:px-12">
        <div
          data-reveal="blur"
          onPointerEnter={() => setIsPaused(true)}
          onPointerLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
          className="prompt-composer floating rounded-[18px] border border-[color:var(--color-rule)] p-2 sm:rounded-[22px] sm:p-2.5"
        >
          <div className="rounded-[13px] border border-[color:var(--color-rule-soft)] bg-[color:var(--color-panel)] sm:rounded-[16px]">
            <div className="flex min-h-[108px] items-center px-5 py-6 sm:min-h-[128px] sm:px-8">
              <div className="relative h-[58px] w-full overflow-hidden [perspective:700px] sm:h-[38px]">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    key={prompt}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      duration: reduceMotion ? 0.2 : 0.52,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    role="textbox"
                    aria-label={`/create-slide ${prompt}`}
                    aria-readonly="true"
                    className="absolute inset-0 flex origin-center flex-wrap content-center items-baseline gap-x-2 gap-y-1 font-[family-name:var(--font-mono)] text-[16px] leading-[1.55] tracking-[-0.025em] will-change-[transform,opacity] sm:flex-nowrap sm:text-[19px]"
                  >
                    <span className="shrink-0 font-medium text-[color:var(--color-accent)]">
                      /create-slide
                    </span>
                    <span className="text-[color:var(--color-text)]">{prompt}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[color:var(--color-rule-soft)] px-3 py-3 sm:px-4">
              <span className="inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.02em] text-[color:var(--color-muted)]">
                <SparkGlyph />
                open-slide skill
              </span>

              <Link
                href="/docs/skills/create-slide"
                aria-label="Learn how to use the create-slide skill"
                className="pressable group flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-text)] text-[color:var(--color-panel)] shadow-[0_1px_0_oklch(1_0_0/0.16)_inset] hover:bg-[color:var(--color-accent)] sm:h-11 sm:w-11"
              >
                <ArrowUpGlyph />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SparkGlyph() {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1.25c.35 2.65 2.1 4.4 4.75 4.75C9.1 6.35 7.35 8.1 7 10.75 6.65 8.1 4.9 6.35 2.25 6 4.9 5.65 6.65 3.9 7 1.25Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M11.25 9.25v3M9.75 10.75h3" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

function ArrowUpGlyph() {
  return (
    <svg
      aria-hidden
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      className="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-0.5"
    >
      <path
        d="M8.5 13.5v-10m0 0-4 4m4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
