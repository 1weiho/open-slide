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
          className="group block w-full py-5 text-left"
        >
          <span
            className={`text-[18px] sm:text-[20px] font-medium tracking-[-0.02em] leading-[1.3] transition-colors group-hover:text-[color:var(--color-accent)] ${
              open ? 'text-[color:var(--color-accent)]' : 'text-[color:var(--color-text)]'
            }`}
          >
            {item.q}
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
            <p className="pb-5 text-[15px] leading-[1.65] text-[color:var(--color-text-soft)] max-w-[60ch]">
              {item.a}
            </p>
          </motion.dd>
        )}
      </AnimatePresence>
    </div>
  );
}
