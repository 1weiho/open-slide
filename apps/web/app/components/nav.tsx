import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

export function Nav() {
  return (
    <header className="sticky top-0 z-40 bg-[color:var(--color-ink)]/80 backdrop-blur-md border-b border-[color:var(--color-rule-soft)]">
      <div className="mx-auto max-w-[1360px] px-8 lg:px-12 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 font-[family-name:var(--font-mono)] text-[13px] tracking-[0.04em]"
        >
          {/* biome-ignore lint/performance/noImgElement: static brand icon */}
          <img src="/open-slide.png" alt="" aria-hidden className="block h-6 w-6 rounded-[5px]" />
          <span className="text-[color:var(--color-text)]">open-slide</span>
        </Link>

        <nav className="flex items-center gap-8 font-[family-name:var(--font-mono)] text-[12px] tracking-[0.08em] uppercase">
          <a
            href="#how-it-works"
            className="hidden md:inline text-[color:var(--color-muted)] hover:text-[color:var(--color-text)] transition-colors"
          >
            How
          </a>
          <a
            href="#anatomy"
            className="hidden md:inline text-[color:var(--color-muted)] hover:text-[color:var(--color-text)] transition-colors"
          >
            Anatomy
          </a>
          <a
            href="#agents"
            className="hidden md:inline text-[color:var(--color-muted)] hover:text-[color:var(--color-text)] transition-colors"
          >
            Agents
          </a>
          <a
            href="https://demo.open-slide.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline text-[color:var(--color-muted)] hover:text-[color:var(--color-text)] transition-colors"
          >
            Demo ↗
          </a>
          <a
            href="https://github.com/1weiho/open-slide"
            target="_blank"
            rel="noopener noreferrer"
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
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
