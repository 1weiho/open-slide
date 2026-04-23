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
            <h2 className="text-[56px] sm:text-[92px] lg:text-[152px] leading-[0.94] tracking-[-0.04em]">
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
              <a
                href="https://github.com/"
                className="inline-flex items-center gap-2 h-[52px] px-5 rounded-[10px] border border-[color:var(--color-rule)] text-[14px] font-[family-name:var(--font-mono)] text-[color:var(--color-text)] hover:border-[color:var(--color-text)] transition"
              >
                read the docs
                <span
                  aria-hidden
                  className="text-[color:var(--color-muted)]"
                >
                  ↗
                </span>
              </a>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-[820px]">
              <Meta label="core" value="@open-slide/core" />
              <Meta label="cli" value="@open-slide/cli" />
              <Meta label="node" value="≥ 18" />
              <Meta label="license" value="MIT" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 pt-3 border-t border-[color:var(--color-rule)]">
      <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[color:var(--color-muted)]">
        {label}
      </span>
      <span className="font-[family-name:var(--font-mono)] text-[13px] text-[color:var(--color-text)] tracking-[-0.01em]">
        {value}
      </span>
    </div>
  );
}
