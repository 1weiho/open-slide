'use client';

import { useEffect } from 'react';

const STAGGER_MS = 80;
const SETTLE_MS = 1400;

export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    // Only elements still below the fold get hidden — anything already on
    // screen stays put, so there is never a flash of disappearing content.
    const foldLine = window.innerHeight * 0.92;
    const pending = els.filter((el) => el.getBoundingClientRect().top > foldLine);
    if (pending.length === 0) return;

    for (const el of pending) el.classList.add('reveal-hidden');

    const timers: number[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        // Elements crossing in the same frame (a grid row, a fast scroll)
        // cascade in reading order instead of landing all at once.
        const batch = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => ({ el: entry.target as HTMLElement, rect: entry.boundingClientRect }))
          .sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left);

        batch.forEach(({ el }, i) => {
          const delay = i * STAGGER_MS;
          el.style.setProperty('--reveal-delay', `${delay}ms`);
          el.classList.add('reveal-shown');
          el.classList.remove('reveal-hidden');
          observer.unobserve(el);
          // Drop the reveal transition once it settles so it can't override
          // the element's own hover transitions.
          timers.push(
            window.setTimeout(() => {
              el.classList.remove('reveal-shown');
              el.style.removeProperty('--reveal-delay');
            }, SETTLE_MS + delay),
          );
        });
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    for (const el of pending) observer.observe(el);

    return () => {
      observer.disconnect();
      for (const id of timers) window.clearTimeout(id);
      for (const el of pending) el.classList.remove('reveal-hidden', 'reveal-shown');
    };
  }, []);

  return null;
}
