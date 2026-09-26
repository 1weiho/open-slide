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
          <span className="text-[16px] font-medium leading-[1.4] tracking-[-0.01em] text-[color:var(--color-text)] sm:text-[17px]">
            {item.q}
          </span>
          <motion.span
            aria-hidden
            animate={{ rotate: open ? 135 : 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: EASE_OUT_STRONG }}
            className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              open
                ? 'text-[color:var(--color-text)]'
                : 'text-[color:var(--color-muted)] group-hover:text-[color:var(--color-text)]'
            }`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path d="M5 0v10M0 5h10" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </motion.span>
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
            <motion.p
              initial={
                reduceMotion ? false : { transform: 'translateY(-6px)', filter: 'blur(4px)' }
              }
              animate={{ transform: 'translateY(0px)', filter: 'blur(0px)' }}
              transition={{ duration: 0.45, ease: EASE_OUT_STRONG }}
              className="max-w-[60ch] pb-5 text-[15px] leading-[1.65] text-[color:var(--color-text-soft)]"
            >
              {item.a}
            </motion.p>
          </motion.dd>
        )}
      </AnimatePresence>
    </div>
  );
}
