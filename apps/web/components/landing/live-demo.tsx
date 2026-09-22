'use client';

import posthog from 'posthog-js';
import { useState } from 'react';
import { Container } from './frame';
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
    <section id="demo" aria-labelledby="demo-heading">
      <Container className="pb-20 sm:pb-28">
        <h2 id="demo-heading" className="sr-only">
          Live demo
        </h2>
        <div
          data-reveal
          className="relative block w-full overflow-hidden rounded-xl border border-[color:var(--color-rule)] bg-black"
          style={{ aspectRatio: '16 / 9' }}
        >
          <InlineSlidePlayer index={index} onIndexChange={setIndex} />
        </div>

        <div className="mt-5 flex items-center justify-between text-[13px] font-medium text-[color:var(--color-muted)]">
          <a
            href="https://demo.open-slide.dev/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('view_more_demos_clicked')}
            className="group inline-flex items-center gap-2 transition-colors hover:text-[color:var(--color-text)]"
          >
            View more demos
            <span
              aria-hidden
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            >
              ↗
            </span>
          </a>
          <span className="flex items-center gap-3">
            <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.08em] text-[color:var(--color-text-soft)]">
              {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={handlePrev}
              disabled={atStart}
              aria-label="Previous slide"
              className="pressable px-1.5 py-0.5 text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-[color:var(--color-text-soft)]"
            >
              ←
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={atEnd}
              aria-label="Next slide"
              className="pressable px-1.5 py-0.5 text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-[color:var(--color-text-soft)]"
            >
              →
            </button>
          </span>
        </div>
      </Container>
    </section>
  );
}
