'use client';

import Image from 'next/image';
import Link from 'next/link';
import posthog from 'posthog-js';
import { ThemeToggle } from './theme-toggle';

export function Nav({ githubStars }: { githubStars?: string | null }) {
  return (
    <header className="sticky top-0 z-40 bg-[color:var(--color-ink)]/85 backdrop-blur-md border-b border-[color:var(--color-rule-soft)]">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[14px] font-medium tracking-[-0.01em]"
        >
          <Image
            src="/open-slide.png"
            alt="open-slide logo"
            width={24}
            height={24}
            priority
            className="block h-6 w-6 rounded-[4px]"
          />
          <span className="text-[color:var(--color-text)]">open-slide</span>
        </Link>

        <nav className="flex items-center gap-6 text-[13.5px] font-medium">
          <Link
            href="/docs"
            className="hidden md:inline text-[color:var(--color-muted)] hover:text-[color:var(--color-text)] transition-colors"
          >
            Docs
          </Link>
          <a
            href="https://demo.open-slide.dev/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('nav_external_link_clicked', { label: 'demo' })}
            className="hidden md:inline text-[color:var(--color-muted)] hover:text-[color:var(--color-text)] transition-colors"
          >
            Demo
          </a>
          <a
            href="https://github.com/1weiho/open-slide"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('nav_external_link_clicked', { label: 'github' })}
            className="hidden md:inline-flex items-center gap-2 text-[color:var(--color-muted)] hover:text-[color:var(--color-text)] transition-colors"
          >
            <span>GitHub</span>
            {githubStars ? (
              <span
                aria-label={`${githubStars} GitHub stars`}
                className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] px-2 py-[2px] font-[family-name:var(--font-mono)] text-[10.5px] text-[color:var(--color-text)]"
              >
                <span aria-hidden>★</span>
                {githubStars}
              </span>
            ) : null}
          </a>
          <ThemeToggle />
          <Link
            href="/docs"
            className="hidden sm:inline-flex h-8 items-center rounded-full bg-[color:var(--color-text)] px-3.5 text-[13px] font-medium text-[color:var(--color-ink)] transition-opacity hover:opacity-80"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
