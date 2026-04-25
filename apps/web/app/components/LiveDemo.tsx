"use client";

import { useState } from "react";
import { InlineSlidePlayer, inlineSlideCount } from "./InlineSlidePlayer";

export function LiveDemo() {
  const [index, setIndex] = useState(0);
  const count = inlineSlideCount;
  const clamp = (i: number) => Math.max(0, Math.min(count - 1, i));
  const atStart = index === 0;
  const atEnd = index === count - 1;

  return (
    <section id="demo" className="relative">
      <div className="mx-auto max-w-[1360px] px-8 lg:px-12 pt-12 lg:pt-20 pb-24">
        {/* specimen frame */}
        <div className="relative specimen p-4 sm:p-6 lg:p-8 rounded-[22px] border border-[color:var(--color-rule)] bg-gradient-to-b from-[color:var(--color-panel)] to-[color:var(--color-ink)]">
          <SpecimenCorners />

          <div className="flex items-center justify-between mb-4 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[color:var(--color-muted)]">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)] shadow-[0_0_10px_var(--color-accent)]" />
              open-slide · live demo
            </span>
            <span>1920 × 1080 · 16 : 9</span>
          </div>

          <div
            className="relative block w-full overflow-hidden rounded-[14px] border border-[color:var(--color-rule)] bg-black"
            style={{ aspectRatio: "16 / 9" }}
          >
            <InlineSlidePlayer index={index} onIndexChange={setIndex} />
          </div>

          <div className="flex items-center justify-end mt-4 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[color:var(--color-muted)]">
            <span className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIndex((i) => clamp(i - 1))}
                disabled={atStart}
                aria-label="Previous slide"
                className="px-1.5 py-0.5 rounded border border-[color:var(--color-rule)] text-[color:var(--color-text-soft)] hover:border-[color:var(--color-text)] hover:text-[color:var(--color-text)] transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[color:var(--color-rule)] disabled:hover:text-[color:var(--color-text-soft)]"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => clamp(i + 1))}
                disabled={atEnd}
                aria-label="Next slide"
                className="px-1.5 py-0.5 rounded border border-[color:var(--color-rule)] text-[color:var(--color-text-soft)] hover:border-[color:var(--color-text)] hover:text-[color:var(--color-text)] transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[color:var(--color-rule)] disabled:hover:text-[color:var(--color-text-soft)]"
              >
                →
              </button>
            </span>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href="https://demo.open-slide.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-[12px] tracking-[0.12em] uppercase text-[color:var(--color-muted)] hover:text-[color:var(--color-accent)] transition-colors"
          >
            View more demos
            <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function SpecimenCorners() {
  const corner =
    "absolute h-5 w-5 border-[color:var(--color-accent)] pointer-events-none";
  return (
    <>
      <span aria-hidden className={`${corner} -top-px -left-px border-t border-l rounded-tl-[22px]`} />
      <span aria-hidden className={`${corner} -top-px -right-px border-t border-r rounded-tr-[22px]`} />
      <span aria-hidden className={`${corner} -bottom-px -left-px border-b border-l rounded-bl-[22px]`} />
      <span aria-hidden className={`${corner} -bottom-px -right-px border-b border-r rounded-br-[22px]`} />
    </>
  );
}
