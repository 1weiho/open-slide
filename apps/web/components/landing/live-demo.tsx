'use client';

import posthog from 'posthog-js';
import { useState } from 'react';
import { InlineSlidePlayer, inlineSlideCount } from './inline-slide-player';

export function LiveDemo() {
  const [index, setIndex] = useState(0);
  const count = inlineSlideCount;
  const clamp = (i: number) => Math.max(0, Math.min(count - 1, i));
  const atStart = index === 0;
  const atEnd = index === count - 1;

  const handlePrev = () => {
    const next = clamp(index - 1);
    setIndex(next);
    posthog.capture('demo_slide_navigated', {
      direction: 'prev',
      slide_index: next,
    });
  };

  const handleNext = () => {
    const next = clamp(index + 1);
    setIndex(next);
    posthog.capture('demo_slide_navigated', {
      direction: 'next',
      slide_index: next,
    });
  };

  return (
    <section id="demo" className="relative" aria-labelledby="demo-heading">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 pt-4 sm:pt-8 lg:pt-12 pb-20 sm:pb-32">
        <h2 id="demo-heading" className="sr-only">
          Live demo
        </h2>
        <div
          className="relative block w-full overflow-hidden rounded-[8px] border border-[color:var(--color-rule)] bg-black"
          style={{ aspectRatio: '16 / 9' }}
        >
          <InlineSlidePlayer index={index} onIndexChange={setIndex} />
        </div>

        <div className="mt-6 flex items-center justify-between font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[color:var(--color-muted)]">
          <a
            href="https://demo.open-slide.dev/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('view_more_demos_clicked')}
            className="inline-flex items-center gap-2 hover:text-[color:var(--color-text)] transition-colors"
          >
            View more demos
            <span aria-hidden>↗</span>
          </a>
          <span className="flex items-center gap-3">
            <span className="text-[color:var(--color-text-soft)]">
              {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={handlePrev}
              disabled={atStart}
              aria-label="Previous slide"
              className="px-1.5 py-0.5 text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text)] transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-[color:var(--color-text-soft)]"
            >
              ←
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={atEnd}
              aria-label="Next slide"
              className="px-1.5 py-0.5 text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text)] transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-[color:var(--color-text-soft)]"
            >
              →
            </button>
          </span>
        </div>
      </div>
    </section>
  );
}
