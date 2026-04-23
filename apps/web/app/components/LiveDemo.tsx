import { InlineSlidePlayer } from "./InlineSlidePlayer";

export function LiveDemo() {
  return (
    <section id="demo" className="relative">
      <div className="mx-auto max-w-[1360px] px-8 lg:px-12 pb-24">
        <h2 className="text-[40px] sm:text-[52px] lg:text-[68px] leading-[1.02] tracking-[-0.03em] mb-8">
          <span className="font-[family-name:var(--font-sans)] font-medium">
            This page is a slide.
          </span>{" "}
          <span className="font-[family-name:var(--font-display)] italic text-[color:var(--color-muted)]">
            Press&nbsp;→.
          </span>
        </h2>

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
            <InlineSlidePlayer />
          </div>

          <div className="flex items-center justify-between mt-4 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] uppercase text-[color:var(--color-muted)]">
            <span>rendered in-page · no iframe</span>
            <span className="flex items-center gap-3">
              <kbd className="px-1.5 py-0.5 rounded border border-[color:var(--color-rule)] text-[color:var(--color-text-soft)]">
                ←
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-[color:var(--color-rule)] text-[color:var(--color-text-soft)]">
                →
              </kbd>
              <span>prev / next</span>
            </span>
          </div>
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
