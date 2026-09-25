'use client';

import posthog from 'posthog-js';
import { type CSSProperties, useState } from 'react';
import { Container } from './frame';
import { InlineSlidePlayer, inlineSlideCount } from './inline-slide-player';

const navButtonClass =
  'pressable inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] text-[color:var(--color-text-soft)] hover:border-[color:var(--color-dim)] hover:text-[color:var(--color-text)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[color:var(--color-rule)] disabled:hover:text-[color:var(--color-text-soft)]';

export function LiveDemo() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const count = inlineSlideCount;
  const clamp = (i: number) => Math.max(0, Math.min(count - 1, i));
  const atStart = index === 0;
  const atEnd = index === count - 1;

  const goTo = (next: number) => {
    if (next === index) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  const handlePrev = () => {
    const next = clamp(index - 1);
    goTo(next);
    posthog.capture('demo_slide_navigated', {
      direction: 'prev',
      slide_index: next,
    });
  };

  const handleNext = () => {
    const next = clamp(index + 1);
    goTo(next);
    posthog.capture('demo_slide_navigated', {
      direction: 'next',
      slide_index: next,
    });
  };

  return (
    <section id="demo" aria-labelledby="demo-heading">
      <Container className="pt-14 pb-8 sm:pt-16 sm:pb-12">
        <h2 id="demo-heading" className="sr-only">
          Live demo
        </h2>
        <div
          data-reveal
          className="rise-frame relative block w-full overflow-hidden rounded-2xl border border-[color:var(--color-rule)] bg-white shadow-[var(--shadow-lift)]"
          style={{ aspectRatio: '16 / 9', animationDelay: '560ms' }}
        >
          <InlineSlidePlayer index={index} onIndexChange={goTo} />
        </div>

        <div
          className="rise mt-4 flex items-center justify-between text-[13px] font-medium text-[color:var(--color-muted)]"
          style={{ animationDelay: '760ms' }}
        >
          <a
            href="https://demo.open-slide.dev/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('view_more_demos_clicked')}
            className="group inline-flex items-center gap-1.5 transition-colors hover:text-[color:var(--color-text)]"
          >
            View more demos
            <span
              aria-hidden
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            >
              ↗
            </span>
          </a>
          <span className="flex items-center gap-2">
            <span className="sr-only" aria-live="polite">
              Slide {index + 1} of {count}
            </span>
            <span
              aria-hidden
              className="nums mr-1 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.08em] text-[color:var(--color-text-soft)]"
            >
              <span className="inline-flex overflow-hidden align-bottom">
                <span
                  key={index}
                  className={index === 0 && direction === 1 ? undefined : 'swap-in'}
                  style={{ '--swap-y': `${direction * 70}%` } as CSSProperties}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              </span>{' '}
              / {String(count).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={handlePrev}
              disabled={atStart}
              aria-label="Previous slide"
              className={navButtonClass}
            >
              <ArrowGlyph direction="left" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={atEnd}
              aria-label="Next slide"
              className={navButtonClass}
            >
              <ArrowGlyph direction="right" />
            </button>
          </span>
        </div>
      </Container>
    </section>
  );
}

function ArrowGlyph({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={direction === 'left' ? 'rotate-180' : undefined}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
