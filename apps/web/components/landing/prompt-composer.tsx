'use client';

import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AgentIconList } from './agent-icon-list';
import { Container } from './frame';

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
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { margin: '-20% 0px -20% 0px' });
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
    <section
      id="prompt"
      ref={sectionRef}
      className="border-t border-[color:var(--color-rule-soft)]"
      aria-labelledby="prompt-composer-heading"
    >
      <h2 id="prompt-composer-heading" className="sr-only">
        Create a slide deck with a prompt
      </h2>

      <Container className="py-20 sm:py-28">
        <div
          data-reveal
          className="mx-auto max-w-[760px] rounded-2xl border border-[color:var(--color-rule)] bg-[color:var(--color-panel)]"
        >
          <div className="flex min-h-[104px] items-center px-5 py-6 sm:min-h-[120px] sm:px-7">
            <div className="flex h-[54px] w-full flex-wrap content-center items-center gap-x-2 gap-y-1 font-[family-name:var(--font-mono)] text-[15px] leading-[1.55] tracking-[-0.02em] sm:h-[34px] sm:flex-nowrap sm:text-[17px]">
              <span className="shrink-0 font-medium text-[color:var(--color-accent)]">
                /create-slide
              </span>
              <span className="relative h-[1.55em] min-w-0 flex-[1_1_220px] overflow-hidden">
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
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[color:var(--color-rule-soft)] px-3 py-3 sm:px-4">
            <span className="min-w-0 px-2.5 py-1.5">
              <AgentIconList />
            </span>

            <Link
              href="/docs/skills/create-slide"
              aria-label="Learn how to use the create-slide skill"
              className="pressable group flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-text)] text-[color:var(--color-ink)] hover:opacity-80"
            >
              <ArrowUpGlyph />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function ArrowUpGlyph() {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
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
