'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import type { QA } from './faq';

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function FaqItem({ item, index }: { item: QA; index: number }) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-button-${index}`;

  return (
    <div>
      <dt>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="group flex w-full items-center justify-between gap-6 py-5 text-left"
        >
          <span
            className={`text-[18px] sm:text-[20px] font-medium tracking-[-0.02em] leading-[1.3] transition-colors group-hover:text-[color:var(--color-accent)] ${
              open ? 'text-[color:var(--color-accent)]' : 'text-[color:var(--color-text)]'
            }`}
          >
            {item.q}
          </span>
          <span
            aria-hidden
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-[transform,color,border-color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              open
                ? 'rotate-45 border-[color:var(--color-accent)]/40 text-[color:var(--color-accent)]'
                : 'border-[color:var(--color-rule)] text-[color:var(--color-muted)] group-hover:border-[color:var(--color-dim)] group-hover:text-[color:var(--color-text)]'
            }`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path d="M5 0v10M0 5h10" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </span>
        </button>
      </dt>
      <AnimatePresence initial={false}>
        {open && (
          <motion.dd
            id={panelId}
            aria-labelledby={buttonId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
              transition: { duration: 0.36, ease: EASE_OUT_STRONG },
            }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : {
                    height: 0,
                    opacity: 0,
                    transition: { duration: 0.24, ease: EASE_OUT_STRONG },
                  }
            }
            className="overflow-hidden"
          >
            <p className="pb-5 text-[15px] leading-[1.65] text-[color:var(--color-text-soft)] max-w-[60ch]">
              {item.a}
            </p>
          </motion.dd>
        )}
      </AnimatePresence>
    </div>
  );
}
