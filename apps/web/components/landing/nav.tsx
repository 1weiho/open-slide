'use client';

import Image from 'next/image';
import Link from 'next/link';
import posthog from 'posthog-js';
import { ThemeToggle } from './theme-toggle';

export function Nav({ githubStars }: { githubStars?: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--color-rule-soft)] bg-[color:var(--color-ink)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between px-6 sm:px-8">
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

        <nav className="flex items-center gap-5 text-[14px] font-medium">
          <Link
            href="/docs"
            className="hidden text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)] md:inline"
          >
            Docs
          </Link>
          <a
            href="https://demo.open-slide.dev/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('nav_external_link_clicked', { label: 'demo' })}
            className="hidden text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)] md:inline"
          >
            Demo
          </a>
          <a
            href="https://github.com/1weiho/open-slide"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('nav_external_link_clicked', { label: 'github' })}
            className="hidden items-center gap-1.5 text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)] md:inline-flex"
          >
            <span>GitHub</span>
            {githubStars ? (
              <span
                aria-label={`${githubStars} GitHub stars`}
                className="font-[family-name:var(--font-mono)] text-[11px] text-[color:var(--color-dim)]"
              >
                ★ {githubStars}
              </span>
            ) : null}
          </a>
          <ThemeToggle />
          <Link
            href="/docs"
            className="pressable hidden h-8 items-center rounded-full bg-[color:var(--color-text)] px-3.5 text-[13px] font-medium text-[color:var(--color-ink)] hover:opacity-80 sm:inline-flex"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
