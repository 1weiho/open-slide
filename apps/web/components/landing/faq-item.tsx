'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import type { QA } from './faq';

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
          className="group flex w-full items-center justify-between gap-6 py-7 sm:py-8 text-left"
        >
          <span className="text-[18px] sm:text-[20px] font-medium tracking-[-0.02em] leading-[1.3] text-[color:var(--color-text)] transition-colors group-hover:text-[color:var(--color-accent)]">
            {item.q}
          </span>
          <span
            aria-hidden
            className="relative h-4 w-4 shrink-0 text-[color:var(--color-muted)] transition-colors group-hover:text-[color:var(--color-text)]"
          >
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
            <span
              className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current transition-transform duration-300 ${
                open ? 'rotate-90' : ''
              }`}
            />
          </span>
        </button>
      </dt>
      <AnimatePresence initial={false}>
        {open && (
          <motion.dd
            id={panelId}
            aria-labelledby={buttonId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-7 sm:pb-8 text-[15px] leading-[1.65] text-[color:var(--color-text-soft)] max-w-[60ch]">
              {item.a}
            </p>
          </motion.dd>
        )}
      </AnimatePresence>
    </div>
  );
}
