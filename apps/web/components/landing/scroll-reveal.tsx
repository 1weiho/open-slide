'use client';

import { useEffect } from 'react';

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

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('reveal-shown');
          entry.target.classList.remove('reveal-hidden');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    for (const el of pending) observer.observe(el);

    return () => {
      observer.disconnect();
      for (const el of pending) el.classList.remove('reveal-hidden');
    };
  }, []);

  return null;
}
