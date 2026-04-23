import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 bg-[color:var(--color-ink)]/80 backdrop-blur-md border-b border-[color:var(--color-rule-soft)]">
      <div className="mx-auto max-w-[1360px] px-8 lg:px-12 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 font-[family-name:var(--font-mono)] text-[13px] tracking-[0.04em]"
        >
          <span
            aria-hidden
            className="relative block h-2.5 w-2.5 rounded-[2px] bg-[color:var(--color-accent)]"
            style={{
              boxShadow: "0 0 20px var(--color-accent), 0 0 0 1px var(--color-accent-deep)",
            }}
          />
          <span className="text-[color:var(--color-text)]">open-slide</span>
          <span className="text-[color:var(--color-dim)] ml-1">/ v0.0</span>
        </Link>

        <nav className="flex items-center gap-8 font-[family-name:var(--font-mono)] text-[12px] tracking-[0.08em] uppercase">
          <a
            href="#how-it-works"
            className="hidden md:inline text-[color:var(--color-muted)] hover:text-[color:var(--color-text)] transition-colors"
          >
            How
          </a>
          <a
            href="#agents"
            className="hidden md:inline text-[color:var(--color-muted)] hover:text-[color:var(--color-text)] transition-colors"
          >
            Agents
          </a>
          <a
            href="#anatomy"
            className="hidden md:inline text-[color:var(--color-muted)] hover:text-[color:var(--color-text)] transition-colors"
          >
            Anatomy
          </a>
          <a
            href="https://github.com/"
            className="hidden md:inline text-[color:var(--color-muted)] hover:text-[color:var(--color-text)] transition-colors"
          >
            GitHub ↗
          </a>
          <a
            href="#install"
            className="inline-flex items-center gap-2 px-3.5 h-8 rounded-full border border-[color:var(--color-rule)] text-[color:var(--color-text)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)] transition"
          >
            init
            <span aria-hidden>→</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
