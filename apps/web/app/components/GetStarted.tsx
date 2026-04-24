import { CopyCommand } from "./CopyCommand";

export function GetStarted() {
  return (
    <section id="install" className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(900px 640px at 80% 20%, rgba(113,112,255,0.22) 0%, transparent 62%), radial-gradient(1100px 800px at 20% 90%, rgba(255,181,71,0.10) 0%, transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-[1360px] px-8 lg:px-12 py-28 lg:py-40">
        <div>
          <div className="flex flex-col gap-10">
            <h2 className="text-[40px] sm:text-[52px] lg:text-[72px] leading-[1.02] tracking-[-0.03em]">
              <span className="font-[family-name:var(--font-sans)] font-medium">
                Author a deck
              </span>
              <br />
              <span className="font-[family-name:var(--font-display)] italic text-[color:var(--color-accent)]">
                in the next minute.
              </span>
            </h2>

            <p className="max-w-[640px] text-[18px] leading-[1.55] text-[color:var(--color-text-soft)]">
              One command, zero config.{" "}
              <span className="text-[color:var(--color-muted)]">
                Your agent takes it from here.
              </span>
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <CopyCommand command="npx @open-slide/cli init" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
