'use client';

import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AgentIconList } from './agent-icon-list';

const prompts = [
  'a Q2 product launch',
  'an investor-ready pitch',
  'our quarterly business review',
  'a conference keynote',
  'a customer success story',
] as const;

const promptVariants = {
  enter: { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const reducedPromptVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

export function PromptComposer() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: '-10% 0px -10% 0px' });
  const reduceMotion = useReducedMotion();
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const interval = window.setInterval(() => {
      setPromptIndex((current) => (current + 1) % prompts.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, [isInView]);

  const prompt = prompts[promptIndex];
  const variants = reduceMotion ? reducedPromptVariants : promptVariants;

  return (
    <div
      ref={ref}
      className="rounded-lg bg-[color:var(--color-panel)] shadow-[var(--shadow-window)]"
    >
      <div className="flex min-h-[96px] items-center px-5 py-5 sm:min-h-[108px]">
        <div className="flex h-[50px] w-full flex-wrap content-center items-center gap-x-2 gap-y-1 font-[family-name:var(--font-mono)] text-[14px] leading-[1.55] tracking-[-0.02em] sm:h-[30px] sm:flex-nowrap sm:text-[15px]">
          <span className="shrink-0 font-medium text-[color:var(--color-accent)]">
            /create-slide
          </span>
          <span className="relative h-[1.55em] min-w-0 flex-[1_1_200px] overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={prompt}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: reduceMotion ? 0.2 : 0.45,
                  ease: [0.23, 1, 0.32, 1],
                }}
                className="absolute inset-0 flex items-center text-[color:var(--color-text)]"
              >
                {prompt}
                <motion.span
                  aria-hidden
                  className="ml-px inline-block h-[1.1em] w-[1.5px] bg-[color:var(--color-text)]"
                  animate={reduceMotion || !isInView ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }}
                  transition={
                    reduceMotion || !isInView
                      ? { duration: 0 }
                      : { duration: 1.1, times: [0, 0.5, 0.5, 1], repeat: Infinity }
                  }
                />
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[color:var(--color-rule-soft)] px-3 py-2.5">
        <span className="min-w-0 px-2 py-1.5">
          <AgentIconList />
        </span>

        <Link
          href="/docs/skills/create-slide"
          aria-label="Learn how to use the create-slide skill"
          className="pressable group flex size-8 items-center justify-center rounded-full bg-[color:var(--color-text)] text-[color:var(--color-ink)] hover:opacity-80"
        >
          <ArrowUpGlyph />
        </Link>
      </div>
    </div>
  );
}

function ArrowUpGlyph() {
  return (
    <svg
      aria-hidden
      width="15"
      height="15"
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
