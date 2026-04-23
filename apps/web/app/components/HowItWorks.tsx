const steps = [
  {
    num: "01",
    kicker: "scaffold",
    title: "Init a deck",
    body: "One command spins up slides/, open-slide.json, and a hot-reloading dev server. No templates, no themes, no assumptions.",
    code: {
      prompt: "$",
      line: "npx @open-slide/cli init my-deck",
      tail: "✓ ready in 3s",
    },
  },
  {
    num: "02",
    kicker: "author",
    title: "Ask your agent",
    body: "Your coding agent drafts pages as arbitrary React components. You guide with prompts; it writes files on disk.",
    code: {
      prompt: "›",
      line: "draft a 5-slide deck on Q2 roadmap",
      tail: "claude / codex / gemini",
    },
  },
  {
    num: "03",
    kicker: "iterate",
    title: "Comment, reapply",
    body: "Leave @slide-comment markers in the inspector. The agent reads them, rewrites the page, commits the diff.",
    code: {
      prompt: "//",
      line: "@slide-comment tighten the headline",
      tail: "git diff · 1 file changed",
    },
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-[color:var(--color-rule)]"
      />
      <div className="mx-auto max-w-[1360px] px-8 lg:px-12 py-24 lg:py-32">
        <div className="flex items-end justify-between flex-wrap gap-y-6 mb-16">
          <h2 className="text-[40px] sm:text-[52px] lg:text-[72px] leading-[1.02] tracking-[-0.03em] max-w-[860px]">
            <span className="font-[family-name:var(--font-sans)] font-medium">
              Three files,
            </span>{" "}
            <span className="font-[family-name:var(--font-display)] italic text-[color:var(--color-accent)]">
              three steps,
            </span>{" "}
            <span className="font-[family-name:var(--font-sans)] font-medium text-[color:var(--color-muted)]">
              forever.
            </span>
          </h2>
          <div className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-muted)]">
            init → author → iterate ↻
          </div>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[color:var(--color-rule)] border border-[color:var(--color-rule)] rounded-[22px] overflow-hidden">
          {steps.map((s) => (
            <li
              key={s.num}
              className="group relative p-8 lg:p-10 bg-[color:var(--color-ink)] flex flex-col gap-7 min-h-[420px] transition-colors hover:bg-[color:var(--color-panel)]"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-[family-name:var(--font-display)] italic text-[88px] leading-none text-[color:var(--color-accent)]/80">
                  {s.num}
                </span>
                <span className="caption">{s.kicker}</span>
              </div>

              <div>
                <h3 className="text-[30px] lg:text-[34px] font-medium tracking-[-0.03em] leading-[1.1]">
                  {s.title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.55] text-[color:var(--color-text-soft)] max-w-[36ch]">
                  {s.body}
                </p>
              </div>

              <div className="mt-auto rounded-[10px] border border-[color:var(--color-rule)] bg-black/40 p-4 font-[family-name:var(--font-mono)] text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="text-[color:var(--color-accent)]">
                    {s.code.prompt}
                  </span>
                  <span className="text-[color:var(--color-text)] truncate">
                    {s.code.line}
                  </span>
                </div>
                <div className="mt-2 text-[11px] tracking-[0.1em] uppercase text-[color:var(--color-muted)]">
                  {s.code.tail}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
