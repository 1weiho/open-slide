'use client';

import posthog from 'posthog-js';
import { type CSSProperties, useState } from 'react';
import { CrossMark } from './frame';
import { InlineSlidePlayer, inlineSlideCount } from './inline-slide-player';

export function LiveDemo() {
  const [index, setIndex] = useState(0);
  const count = inlineSlideCount;
  const clamp = (i: number) => Math.max(0, Math.min(count - 1, i));
  const atStart = index === 0;
  const atEnd = index === count - 1;

  const goTo = (next: number, direction: 'prev' | 'next') => {
    setIndex(next);
    posthog.capture('demo_slide_navigated', {
      direction,
      slide_index: next,
    });
  };

  const handlePrev = () => goTo(clamp(index - 1), 'prev');
  const handleNext = () => goTo(clamp(index + 1), 'next');
  const handleJump = (i: number) => {
    if (i === index) return;
    goTo(i, i > index ? 'next' : 'prev');
  };

  const paddleBase =
    'pressable absolute top-1/2 z-[2] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-[15px] text-white/90 backdrop-blur-md opacity-0 group-hover:enabled:opacity-100 focus-visible:enabled:opacity-100 hover:border-white/30 hover:bg-black/65 disabled:pointer-events-none sm:flex';

  return (
    <section id="demo" className="relative overflow-hidden" aria-labelledby="demo-heading">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 pt-4 sm:pt-8 lg:pt-12 pb-20 sm:pb-32">
        <div data-reveal className="mb-4 flex items-center justify-between gap-4">
          <h2 id="demo-heading" className="caption flex items-center gap-2.5">
            <span
              aria-hidden
              className="live-dot h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)]"
            />
            Live demo
          </h2>
          <span className="hidden font-[family-name:var(--font-mono)] text-[11px] tracking-[0.08em] uppercase text-[color:var(--color-muted)] sm:block">
            every page is code · 1920 × 1080
          </span>
        </div>

        <div
          data-reveal="stage"
          style={{ '--reveal-delay': '70ms' } as CSSProperties}
          className="relative"
        >
          <div
            aria-hidden
            className="stage-glow pointer-events-none absolute -inset-x-10 -top-16 -bottom-10 sm:-inset-x-24 sm:-top-28 sm:-bottom-16"
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[2] hidden sm:block">
            <CrossMark className="absolute -top-[6px] -left-[5px]" />
            <CrossMark className="absolute -top-[6px] -right-[5px]" />
            <CrossMark className="absolute -bottom-[6px] -left-[5px]" />
            <CrossMark className="absolute -bottom-[6px] -right-[5px]" />
          </div>
          <div
            className="group stage-shadow relative z-[1] block w-full overflow-hidden rounded-[8px] border border-[color:var(--color-rule)] bg-black"
            style={{ aspectRatio: '16 / 9' }}
          >
            <InlineSlidePlayer index={index} onIndexChange={setIndex} />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[1] rounded-[8px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
            <button
              type="button"
              onClick={handlePrev}
              disabled={atStart}
              aria-label="Previous slide"
              className={`${paddleBase} left-3`}
            >
              ←
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={atEnd}
              aria-label="Next slide"
              className={`${paddleBase} right-3`}
            >
              →
            </button>
          </div>
        </div>

        <div
          data-reveal
          style={{ '--reveal-delay': '140ms' } as CSSProperties}
          className="mt-5 flex items-center justify-between text-[13px] font-medium text-[color:var(--color-muted)]"
        >
          <a
            href="https://demo.open-slide.dev/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('view_more_demos_clicked')}
            className="group inline-flex items-center gap-2 hover:text-[color:var(--color-text)] transition-colors"
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
            <span className="hidden items-center md:flex">
              {Array.from({ length: count }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleJump(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index ? 'true' : undefined}
                  className="group/seg flex h-6 items-center px-[3px]"
                >
                  <span
                    className={`block h-[3px] rounded-full transition-[width,background-color] duration-300 ${
                      i === index
                        ? 'w-[22px] bg-[color:var(--color-accent)]'
                        : 'w-[14px] bg-[color:var(--color-rule)] group-hover/seg:bg-[color:var(--color-dim)]'
                    }`}
                  />
                </button>
              ))}
            </span>
            <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.08em] text-[color:var(--color-text-soft)]">
              {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={handlePrev}
              disabled={atStart}
              aria-label="Previous slide"
              className="pressable px-1.5 py-0.5 text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-[color:var(--color-text-soft)]"
            >
              ←
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={atEnd}
              aria-label="Next slide"
              className="pressable px-1.5 py-0.5 text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-[color:var(--color-text-soft)]"
            >
              →
            </button>
          </span>
        </div>
      </div>
    </section>
  );
}
